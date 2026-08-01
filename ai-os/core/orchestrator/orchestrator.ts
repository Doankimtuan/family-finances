import { ArtifactStore } from "../artifacts";
import type { AiosCoreConfig } from "../configs";
import { AiosError } from "../lib/errors";
import { createArtifactId } from "../lib/ids";
import { nowIso } from "../lib/hash";
import { computeWaves } from "../lib/graph";
import { KnowledgeBase, type GateProfileEntry } from "../knowledge";
import type { MemoryManager, WorkingMemory } from "../memory";
import { Planner, type CreatePlanInput } from "../planner";
import type {
  ControlDecision,
  GateProfile,
  GateResult,
  SideEffect,
  TaskStatus,
} from "../schemas/common";
import {
  DependencyGraphPayload,
  PlanPayload,
  TaskPayload,
} from "../schemas/plan";
import {
  EscalationPayload,
  OrchestrationStatePayload,
  PlanDecisionPayload,
  QualityGatePayload,
  type TaskOutcome,
} from "../schemas/orchestration";
import { ExecutionRunPayload } from "../schemas/run";

export type StartOrchestrationInput = {
  goalRef?: { artifactId: string; version: number };
  gateProfile?: GateProfile;
};

export type PlanGateInput = {
  validationResults?: Array<{ artifact_id: string; result: GateResult }>;
  reviewResults?: Array<{ artifact_id: string; result: GateResult }>;
  result: GateResult;
  notes?: string;
};

export type AcceptPlanInput = {
  orchestrationId: string;
  planId: string;
  planVersion?: number;
  reason?: string;
  /** Required when gate profile has require_review_on_plan + reviews_blocking. */
  planGate?: PlanGateInput;
};

export type RecordTaskOutcomeInput = {
  orchestrationId: string;
  taskId: string;
  /** Terminal statuses only. */
  status: Extract<TaskStatus, "succeeded" | "failed" | "cancelled">;
  notes?: string;
  /** Optional output artifact refs produced externally (future workers). */
  outputs?: Array<{ artifact_id: string; artifact_version: number }>;
  failFast?: boolean;
};

/**
 * Control-plane orchestrator.
 * Schedules waves, enforces gate profiles, records stub run outcomes.
 * Does NOT invoke skills or workers.
 */
export class Orchestrator {
  constructor(
    private readonly config: AiosCoreConfig,
    private readonly artifacts: ArtifactStore,
    private readonly knowledge: KnowledgeBase,
    private readonly planner: Planner,
    private readonly memory: MemoryManager,
  ) {}

  getPlanner(): Planner {
    return this.planner;
  }

  async start(input: StartOrchestrationInput = {}): Promise<{
    orchestrationId: string;
    memory: WorkingMemory;
  }> {
    const orchestrationId = createArtifactId("orc");
    const runId = createArtifactId("orc-run");
    const ts = nowIso();
    const gateProfile = input.gateProfile ?? this.config.defaultGateProfile;
    await this.knowledge.getGateProfile(gateProfile);

    let goalId: string;
    let goalVersion: number;

    if (input.goalRef) {
      goalId = input.goalRef.artifactId;
      goalVersion = input.goalRef.version;
    } else {
      goalId = createArtifactId("goal-pending");
      goalVersion = 1;
      await this.artifacts.write({
        artifactId: goalId,
        type: "goal",
        title: "Pending goal",
        status: "draft",
        payloadKind: "json",
        payload: {
          schema_version: "1.0.0",
          artifact_id: goalId,
          title: "Pending goal",
          problem: "Goal not yet attached; awaiting planner.",
          success_criteria: [{ id: "pending", description: "Attach a real goal" }],
          constraints: [],
          non_goals: [],
          created_at: ts,
        },
        producedBy: { role: "orchestrator", runId },
        allowUnstable: true,
        trace: { orchestration_id: orchestrationId, goal_id: goalId },
      });
    }

    const state: OrchestrationStatePayload = {
      schema_version: "1.0.0",
      artifact_id: orchestrationId,
      status: "accepting",
      gate_profile: gateProfile,
      goal_ref: {
        artifact_id: goalId,
        artifact_version: goalVersion,
        relation: "requires",
      },
      budget: {
        max_waves: this.config.budget.maxWaves,
        max_retries_per_task: this.config.budget.maxRetriesPerTask,
        allowed_side_effects: this.config.budget.allowedSideEffects,
      },
      waves: [],
      task_outcomes: [],
      decisions: [],
      trace: { orchestration_id: orchestrationId, goal_id: goalId },
      created_at: ts,
      updated_at: ts,
    };
    OrchestrationStatePayload.parse(state);

    await this.artifacts.write({
      artifactId: orchestrationId,
      type: "orchestration-state",
      title: `Orchestration ${orchestrationId}`,
      status: "ready",
      payloadKind: "json",
      payload: state,
      producedBy: { role: "orchestrator", runId },
      trace: state.trace,
    });

    const mem = this.memory.forNamespace(orchestrationId);
    mem.set("phase", "accepting");

    return { orchestrationId, memory: mem };
  }

  async planAndAttach(
    orchestrationId: string,
    planInput: Omit<CreatePlanInput, "orchestrationId">,
  ): Promise<ReturnType<Planner["createPlan"]>> {
    await this.setStatus(orchestrationId, "planning");
    const result = await this.planner.createPlan({
      ...planInput,
      orchestrationId,
    });

    const state = await this.readState(orchestrationId);
    const previousGoalId = state.goal_ref.artifact_id;
    if (previousGoalId !== result.goalId) {
      try {
        const prevVersion =
          (await this.artifacts.latestVersion(previousGoalId)) ?? 1;
        const meta = await this.artifacts.readMeta(previousGoalId, prevVersion);
        if (meta.status === "draft" || meta.status === "ready") {
          await this.artifacts.transitionStatus(
            previousGoalId,
            prevVersion,
            "archived",
          );
        }
      } catch {
        // pending goal may be missing in tests; ignore
      }
    }

    const updated: OrchestrationStatePayload = {
      ...state,
      status: "planning",
      goal_ref: {
        artifact_id: result.goalId,
        artifact_version: 1,
        relation: "requires",
      },
      updated_at: nowIso(),
      trace: {
        ...state.trace,
        goal_id: result.goalId,
        plan_id: result.planId,
        orchestration_id: orchestrationId,
      },
    };
    await this.writeStateVersion(orchestrationId, updated);
    this.memory.forNamespace(orchestrationId).set("phase", "planning");
    return result;
  }

  async acceptPlan(input: AcceptPlanInput): Promise<{
    decisionId: string;
    waves: string[][];
    planVersion: number;
    gateId?: string;
  }> {
    const planVersion = input.planVersion ?? 1;
    const plan = await this.artifacts.readPayloadJson(
      input.planId,
      planVersion,
      PlanPayload,
    );

    this.assertPlanOwnedByOrchestration(plan, input.orchestrationId);

    const graph = await this.artifacts.readPayloadJson(
      plan.dependency_graph_ref.artifact_id,
      plan.dependency_graph_ref.artifact_version,
      DependencyGraphPayload,
    );

    const wavePlan = computeWaves(
      graph.nodes.map((n) => n.id),
      graph.edges,
    );
    if (!wavePlan.acyclic) {
      throw new AiosError(
        "cyclic-dependency-graph",
        "Cannot accept plan with cyclic hard edges",
      );
    }
    if (wavePlan.waves.length > this.config.budget.maxWaves) {
      throw new AiosError(
        "budget-exceeded",
        `Plan requires ${wavePlan.waves.length} waves; max is ${this.config.budget.maxWaves}`,
      );
    }

    const state = await this.readState(input.orchestrationId);
    await this.assertSideEffectBudgets(input.orchestrationId, plan);

    const profile = await this.knowledge.getGateProfile(plan.gate_profile);
    let gateId: string | undefined;

    if (profile.require_review_on_plan) {
      if (!input.planGate) {
        throw new AiosError(
          "plan-gate-required",
          `Gate profile "${plan.gate_profile}" requires planGate before accept/publish`,
        );
      }
      this.assertGateAllowsPublish(profile, input.planGate);
      gateId = await this.writeQualityGateArtifact({
        orchestrationId: input.orchestrationId,
        profileName: plan.gate_profile,
        subject: {
          kind: "artifact",
          id: input.planId,
          artifact_version: planVersion,
        },
        planGate: input.planGate,
        decision: "publish",
        goalId: plan.goal_ref.artifact_id,
        planId: input.planId,
      });
    }

    const decisionId = createArtifactId("plan-decision");
    const runId = createArtifactId("orc-run");
    const decision: PlanDecisionPayload = {
      schema_version: "1.0.0",
      artifact_id: decisionId,
      plan_ref: {
        artifact_id: input.planId,
        artifact_version: planVersion,
        relation: "requires",
      },
      decision: "accept",
      reason: input.reason ?? "Plan accepted by orchestrator",
      trace: {
        orchestration_id: input.orchestrationId,
        plan_id: input.planId,
        goal_id: plan.goal_ref.artifact_id,
      },
      created_at: nowIso(),
    };
    PlanDecisionPayload.parse(decision);

    await this.artifacts.write({
      artifactId: decisionId,
      type: "plan-decision",
      title: "Accept plan",
      status: "published",
      payloadKind: "json",
      payload: decision,
      producedBy: { role: "orchestrator", runId },
      dependsOn: [
        {
          artifact_id: input.planId,
          artifact_version: planVersion,
          relation: "requires",
        },
      ],
      trace: decision.trace,
    });

    const published = await this.artifacts.publishJsonVersion({
      artifactId: input.planId,
      fromVersion: planVersion,
      type: "plan",
      title: plan.title,
      schema: PlanPayload,
      producedBy: { role: "orchestrator", runId },
      dependsOn: [
        {
          artifact_id: decisionId,
          artifact_version: 1,
          relation: "derived-from",
        },
      ],
      trace: decision.trace,
      mutate: (p) => ({
        ...p,
        plan_version: p.plan_version + 1,
        status: "published",
        updated_at: nowIso(),
      }),
    });

    const taskOutcomes: TaskOutcome[] = wavePlan.waves.flatMap((taskIds) =>
      taskIds.map((task_id) => ({
        task_id,
        status: "pending" as const,
        at: nowIso(),
      })),
    );

    const updated: OrchestrationStatePayload = {
      ...state,
      status: "scheduled",
      gate_profile: plan.gate_profile,
      plan_ref: {
        artifact_id: input.planId,
        artifact_version: published.version,
        relation: "requires",
      },
      goal_ref: plan.goal_ref,
      waves: wavePlan.waves.map((taskIds, wave_index) => ({
        wave_index,
        task_ids: taskIds,
        status: "pending" as const,
      })),
      task_outcomes: taskOutcomes,
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: "continue",
          reason: input.reason ?? "Plan accepted; waves scheduled",
        },
      ],
      updated_at: nowIso(),
      trace: {
        orchestration_id: input.orchestrationId,
        plan_id: input.planId,
        goal_id: plan.goal_ref.artifact_id,
      },
    };
    await this.writeStateVersion(input.orchestrationId, updated);
    this.memory.forNamespace(input.orchestrationId).set("phase", "scheduled");

    return {
      decisionId,
      waves: wavePlan.waves,
      planVersion: published.version,
      gateId,
    };
  }

  async rejectOrRevisePlan(input: {
    orchestrationId: string;
    planId: string;
    planVersion?: number;
    decision: "reject" | "revise";
    reason: string;
    requestedChanges?: string[];
  }): Promise<string> {
    const planVersion = input.planVersion ?? 1;
    const plan = await this.artifacts.readPayloadJson(
      input.planId,
      planVersion,
      PlanPayload,
    );
    this.assertPlanOwnedByOrchestration(plan, input.orchestrationId);

    const decisionId = createArtifactId("plan-decision");
    const runId = createArtifactId("orc-run");
    const payload: PlanDecisionPayload = {
      schema_version: "1.0.0",
      artifact_id: decisionId,
      plan_ref: {
        artifact_id: input.planId,
        artifact_version: planVersion,
        relation: "requires",
      },
      decision: input.decision,
      reason: input.reason,
      requested_changes: input.requestedChanges,
      trace: {
        orchestration_id: input.orchestrationId,
        plan_id: input.planId,
        goal_id: plan.goal_ref.artifact_id,
      },
      created_at: nowIso(),
    };
    PlanDecisionPayload.parse(payload);

    await this.artifacts.write({
      artifactId: decisionId,
      type: "plan-decision",
      title: `${input.decision} plan`,
      status: "published",
      payloadKind: "json",
      payload,
      producedBy: { role: "orchestrator", runId },
      trace: payload.trace,
    });

    const state = await this.readState(input.orchestrationId);
    await this.writeStateVersion(input.orchestrationId, {
      ...state,
      status: input.decision === "revise" ? "planning" : "aborted",
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: input.decision === "revise" ? "replan" : "abort",
          reason: input.reason,
        },
      ],
      updated_at: nowIso(),
    });

    return decisionId;
  }

  /**
   * Advance the next pending wave to running and create stub run-records
   * (claimed → pending execution by future workers).
   */
  async startNextWave(orchestrationId: string): Promise<{
    waveIndex: number;
    taskIds: string[];
    runIds: Record<string, string>;
  }> {
    const state = await this.readState(orchestrationId);
    if (state.status !== "scheduled" && state.status !== "running") {
      throw new AiosError(
        "illegal-orchestration-status",
        `Cannot start wave from status ${state.status}`,
      );
    }
    if (!state.plan_ref) {
      throw new AiosError("plan-required", "Orchestration has no accepted plan");
    }

    const outcomes = new Map(
      (state.task_outcomes ?? []).map((o) => [o.task_id, o]),
    );
    const next = state.waves.find((w) => w.status === "pending");
    if (!next) {
      throw new AiosError("no-pending-wave", "No pending wave to start");
    }

    for (const earlier of state.waves) {
      if (earlier.wave_index >= next.wave_index) break;
      if (earlier.status !== "succeeded") {
        throw new AiosError(
          "wave-predecessors-incomplete",
          `Wave ${earlier.wave_index} must succeed before wave ${next.wave_index}`,
        );
      }
      for (const taskId of earlier.task_ids) {
        if (outcomes.get(taskId)?.status !== "succeeded") {
          throw new AiosError(
            "hard-predecessor-failed",
            `Cannot schedule dependents; task ${taskId} not succeeded`,
          );
        }
      }
    }

    const runIds: Record<string, string> = {};
    const runIdOrchestrator = createArtifactId("orc-run");

    for (const taskId of next.task_ids) {
      const taskVersion = (await this.artifacts.latestVersion(taskId)) ?? 1;
      const task = await this.artifacts.readPayloadJson(
        taskId,
        taskVersion,
        TaskPayload,
      );
      const runArtifactId = createArtifactId("run");
      runIds[taskId] = runArtifactId;
      const skillVersion =
        task.skill_version === "active" ? "0.0.0" : task.skill_version;
      const runPayload: ExecutionRunPayload = {
        schema_version: "1.0.0",
        artifact_id: runArtifactId,
        orchestration_id: orchestrationId,
        plan_id: state.plan_ref.artifact_id,
        task_id: taskId,
        skill_id: task.skill_id,
        skill_version: skillVersion,
        attempt: 1,
        allow_parallel_attempts: task.allow_parallel_attempts ?? false,
        status: "claimed",
        phase: "claim",
        started_at: nowIso(),
        inputs: (task.inputs ?? [])
          .filter((i) => i.artifact_id && typeof i.artifact_version === "number")
          .map((i) => ({
            name: i.name,
            artifact_id: i.artifact_id!,
            artifact_version: i.artifact_version as number,
          })),
        outputs: [],
        gate_results: [],
        stub: true,
        notes: "Core Engine stub run — no worker invocation",
        trace: {
          orchestration_id: orchestrationId,
          plan_id: state.plan_ref.artifact_id,
          task_id: taskId,
          goal_id: state.goal_ref.artifact_id,
          run_id: runArtifactId,
        },
      };
      ExecutionRunPayload.parse(runPayload);
      await this.artifacts.write({
        artifactId: runArtifactId,
        type: "run-record",
        title: `Stub run for ${task.title}`,
        status: "ready",
        payloadKind: "json",
        payload: runPayload,
        producedBy: {
          role: "orchestrator",
          runId: runIdOrchestrator,
          taskId,
        },
        dependsOn: [
          {
            artifact_id: taskId,
            artifact_version: taskVersion,
            relation: "requires",
          },
        ],
        trace: runPayload.trace,
      });

      await this.writeTaskStatusVersion(taskId, taskVersion, "running", {
        orchestration_id: orchestrationId,
        plan_id: state.plan_ref.artifact_id,
        task_id: taskId,
        goal_id: state.goal_ref.artifact_id,
        run_id: runArtifactId,
      });
    }

    const task_outcomes = (state.task_outcomes ?? []).map((o) =>
      next.task_ids.includes(o.task_id)
        ? {
            ...o,
            status: "running" as const,
            run_id: runIds[o.task_id],
            at: nowIso(),
          }
        : o,
    );

    const waves = state.waves.map((w) =>
      w.wave_index === next.wave_index
        ? { ...w, status: "running" as const }
        : w,
    );

    await this.writeStateVersion(orchestrationId, {
      ...state,
      status: "running",
      waves,
      task_outcomes,
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: "continue",
          reason: `Started wave ${next.wave_index}`,
        },
      ],
      updated_at: nowIso(),
    });
    this.memory.forNamespace(orchestrationId).set("phase", "running");
    this.memory
      .forNamespace(orchestrationId)
      .set(`wave:${next.wave_index}:runs`, runIds);

    return { waveIndex: next.wave_index, taskIds: next.task_ids, runIds };
  }

  /**
   * Record terminal task outcome without invoking workers.
   * Updates stub run-record + task + wave/orchestration state.
   */
  async recordTaskOutcome(input: RecordTaskOutcomeInput): Promise<{
    runId: string;
    waveComplete: boolean;
    orchestrationStatus: OrchestrationStatePayload["status"];
  }> {
    const state = await this.readState(input.orchestrationId);
    if (state.status !== "running") {
      throw new AiosError(
        "illegal-orchestration-status",
        `Cannot record task outcome from status ${state.status}`,
      );
    }

    const wave = state.waves.find(
      (w) => w.status === "running" && w.task_ids.includes(input.taskId),
    );
    if (!wave) {
      throw new AiosError(
        "task-not-in-running-wave",
        `Task ${input.taskId} is not in a running wave`,
      );
    }

    const existing = (state.task_outcomes ?? []).find(
      (o) => o.task_id === input.taskId,
    );
    const runId = existing?.run_id ?? createArtifactId("run");
    const failFast = input.failFast ?? true;

    // Update run-record to terminal
    const runVersion = (await this.artifacts.latestVersion(runId)) ?? 1;
    const prevRun = await this.artifacts.readPayloadJson(
      runId,
      runVersion,
      ExecutionRunPayload,
    );
    const ended = nowIso();
    const nextRun: ExecutionRunPayload = {
      ...prevRun,
      status: input.status === "succeeded" ? "succeeded" : "failed",
      phase: "complete",
      ended_at: ended,
      outputs: (input.outputs ?? []).map((o) => ({
        artifact_id: o.artifact_id,
        artifact_version: o.artifact_version,
        relation: "derived-from" as const,
      })),
      notes: input.notes ?? prevRun.notes,
      stub: true,
    };
    ExecutionRunPayload.parse(nextRun);
    await this.artifacts.write({
      artifactId: runId,
      type: "run-record",
      title: `Stub run ${input.status}`,
      status: "published",
      version: runVersion + 1,
      payloadKind: "json",
      payload: nextRun,
      producedBy: {
        role: "orchestrator",
        runId: createArtifactId("orc-run"),
        taskId: input.taskId,
      },
      supersedes: {
        artifact_id: runId,
        artifact_version: runVersion,
        relation: "derived-from",
      },
      trace: nextRun.trace,
    });
    const runMeta = await this.artifacts.readMeta(runId, runVersion);
    if (runMeta.status === "ready") {
      await this.artifacts.transitionStatus(runId, runVersion, "published");
    }
    await this.artifacts.transitionStatus(runId, runVersion, "superseded");

    const taskVersion = (await this.artifacts.latestVersion(input.taskId)) ?? 1;
    await this.writeTaskStatusVersion(input.taskId, taskVersion, input.status, {
      orchestration_id: input.orchestrationId,
      plan_id: state.plan_ref?.artifact_id,
      task_id: input.taskId,
      goal_id: state.goal_ref.artifact_id,
      run_id: runId,
    });

    let task_outcomes = (state.task_outcomes ?? []).map((o) =>
      o.task_id === input.taskId
        ? { ...o, status: input.status, run_id: runId, at: nowIso() }
        : o,
    );

    let waves = [...state.waves];
    let orchestrationStatus: OrchestrationStatePayload["status"] = "running";
    let waveComplete = false;
    const decisions = [...(state.decisions ?? [])];

    if (input.status !== "succeeded" && failFast) {
      waves = waves.map((w) => {
        if (w.wave_index === wave.wave_index) {
          return { ...w, status: "failed" as const };
        }
        if (w.wave_index > wave.wave_index && w.status === "pending") {
          return { ...w, status: "cancelled" as const };
        }
        return w;
      });
      task_outcomes = task_outcomes.map((o) => {
        if (wave.task_ids.includes(o.task_id) && o.task_id !== input.taskId) {
          if (o.status === "running" || o.status === "pending") {
            return { ...o, status: "cancelled" as const, at: nowIso() };
          }
        }
        const later = waves.find(
          (w) =>
            w.status === "cancelled" && w.task_ids.includes(o.task_id),
        );
        if (later && (o.status === "pending" || o.status === "ready")) {
          return { ...o, status: "cancelled" as const, at: nowIso() };
        }
        return o;
      });
      orchestrationStatus = "failed";
      decisions.push({
        at: nowIso(),
        decision: "abort",
        reason: input.notes ?? `Task ${input.taskId} failed (fail-fast)`,
        task_id: input.taskId,
      });
      waveComplete = true;
    } else {
      const waveOutcomes = task_outcomes.filter((o) =>
        wave.task_ids.includes(o.task_id),
      );
      const allTerminal = waveOutcomes.every((o) =>
        ["succeeded", "failed", "cancelled"].includes(o.status),
      );
      if (allTerminal) {
        waveComplete = true;
        const waveFailed = waveOutcomes.some((o) => o.status === "failed");
        waves = waves.map((w) =>
          w.wave_index === wave.wave_index
            ? {
                ...w,
                status: waveFailed ? ("failed" as const) : ("succeeded" as const),
              }
            : w,
        );
        if (waveFailed) {
          orchestrationStatus = "failed";
          decisions.push({
            at: nowIso(),
            decision: "abort",
            reason: `Wave ${wave.wave_index} failed`,
            task_id: input.taskId,
          });
        } else {
          const remaining = waves.some(
            (w) => w.status === "pending" || w.status === "running",
          );
          if (!remaining) {
            orchestrationStatus = "settling";
            decisions.push({
              at: nowIso(),
              decision: "continue",
              reason: "All waves succeeded; entering settling",
            });
          } else {
            decisions.push({
              at: nowIso(),
              decision: "continue",
              reason: `Task ${input.taskId} ${input.status}`,
              task_id: input.taskId,
            });
          }
        }
      } else {
        decisions.push({
          at: nowIso(),
          decision: "continue",
          reason: `Task ${input.taskId} ${input.status}`,
          task_id: input.taskId,
        });
      }
    }

    await this.writeStateVersion(input.orchestrationId, {
      ...state,
      status: orchestrationStatus,
      waves,
      task_outcomes,
      decisions,
      updated_at: nowIso(),
    });
    this.memory
      .forNamespace(input.orchestrationId)
      .set("phase", orchestrationStatus);

    return { runId, waveComplete, orchestrationStatus };
  }

  async recordQualityGate(input: {
    orchestrationId: string;
    subject: QualityGatePayload["subject"];
    validationResults?: Array<{ artifact_id: string; result: GateResult }>;
    reviewResults?: Array<{ artifact_id: string; result: GateResult }>;
    result: GateResult;
    decision: ControlDecision;
    notes?: string;
  }): Promise<string> {
    const state = await this.readState(input.orchestrationId);
    const profile = await this.knowledge.getGateProfile(state.gate_profile);
    this.assertGateAllowsDecision(profile, {
      result: input.result,
      validationResults: input.validationResults,
      reviewResults: input.reviewResults,
    }, input.decision);

    const gateId = await this.writeQualityGateArtifact({
      orchestrationId: input.orchestrationId,
      profileName: state.gate_profile,
      subject: input.subject,
      planGate: {
        validationResults: input.validationResults,
        reviewResults: input.reviewResults,
        result: input.result,
        notes: input.notes,
      },
      decision: input.decision,
      goalId: state.goal_ref.artifact_id,
      planId: state.plan_ref?.artifact_id,
    });

    let nextStatus: OrchestrationStatePayload["status"] = "gating";
    if (input.decision === "abort") nextStatus = "aborted";
    else if (input.decision === "publish" && state.status === "settling") {
      nextStatus = "succeeded";
    } else if (input.decision === "hold" || input.result === "fail") {
      nextStatus = profile.allow_publish_with_warn && input.result === "warn"
        ? state.status
        : "failed";
    }

    await this.writeStateVersion(input.orchestrationId, {
      ...state,
      status: nextStatus,
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: input.decision,
          reason: input.notes ?? `Quality gate ${input.result}`,
          task_id:
            input.subject.kind === "task" ? input.subject.id : undefined,
        },
      ],
      updated_at: nowIso(),
    });
    this.memory.forNamespace(input.orchestrationId).set("phase", nextStatus);

    return gateId;
  }

  async escalate(input: {
    orchestrationId: string;
    reason: string;
    blocking?: boolean;
    options?: string[];
  }): Promise<string> {
    const escalationId = createArtifactId("escalation");
    const runId = createArtifactId("orc-run");
    const state = await this.readState(input.orchestrationId);
    const payload: EscalationPayload = {
      schema_version: "1.0.0",
      artifact_id: escalationId,
      reason: input.reason,
      blocking: input.blocking ?? true,
      options: input.options,
      trace: {
        orchestration_id: input.orchestrationId,
        plan_id: state.plan_ref?.artifact_id,
        goal_id: state.goal_ref.artifact_id,
      },
      created_at: nowIso(),
    };
    EscalationPayload.parse(payload);

    await this.artifacts.write({
      artifactId: escalationId,
      type: "escalation",
      title: "Escalation",
      status: "published",
      payloadKind: "json",
      payload,
      producedBy: { role: "orchestrator", runId },
      trace: payload.trace,
    });

    await this.writeStateVersion(input.orchestrationId, {
      ...state,
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: "escalate",
          reason: input.reason,
        },
      ],
      updated_at: nowIso(),
    });

    return escalationId;
  }

  /**
   * Terminal success — only from settling after waves complete.
   * Prefer recordQualityGate({ decision: publish }) for gated settle.
   */
  async markSucceeded(orchestrationId: string, reason?: string): Promise<void> {
    const state = await this.readState(orchestrationId);
    if (state.status !== "settling") {
      throw new AiosError(
        "illegal-orchestration-status",
        `markSucceeded only allowed from settling (got ${state.status})`,
      );
    }
    const profile = await this.knowledge.getGateProfile(state.gate_profile);
    if (profile.validators_blocking || profile.reviews_blocking) {
      throw new AiosError(
        "settle-gate-required",
        `Profile "${state.gate_profile}" requires recordQualityGate before success`,
      );
    }
    await this.writeStateVersion(orchestrationId, {
      ...state,
      status: "succeeded",
      decisions: [
        ...(state.decisions ?? []),
        {
          at: nowIso(),
          decision: "continue",
          reason: reason ?? "Orchestration succeeded (advisory settle)",
        },
      ],
      updated_at: nowIso(),
    });
  }

  async readState(orchestrationId: string): Promise<OrchestrationStatePayload> {
    const version = await this.artifacts.latestVersion(orchestrationId);
    if (!version) {
      throw new AiosError(
        "orchestration-not-found",
        `No orchestration ${orchestrationId}`,
      );
    }
    return this.artifacts.readPayloadJson(
      orchestrationId,
      version,
      OrchestrationStatePayload,
    );
  }

  private assertPlanOwnedByOrchestration(
    plan: PlanPayload,
    orchestrationId: string,
  ): void {
    if (plan.trace?.orchestration_id !== orchestrationId) {
      throw new AiosError(
        "plan-orchestration-mismatch",
        `Plan ${plan.artifact_id} is not owned by orchestration ${orchestrationId}`,
      );
    }
  }

  private async assertSideEffectBudgets(
    orchestrationId: string,
    plan: PlanPayload,
  ): Promise<void> {
    const state = await this.readState(orchestrationId);
    const allowed = new Set(state.budget.allowed_side_effects);
    for (const ref of plan.task_refs) {
      const task = await this.artifacts.readPayloadJson(
        ref.artifact_id,
        ref.artifact_version,
        TaskPayload,
      );
      for (const effect of task.side_effect_budget) {
        if (!allowed.has(effect)) {
          throw new AiosError(
            "side-effect-budget-exceeded",
            `Task ${task.artifact_id} requests side effect "${effect}" not allowed by orchestration budget`,
            { details: { allowed: [...allowed], effect } },
          );
        }
      }
    }
  }

  private assertGateAllowsPublish(
    profile: GateProfileEntry,
    gate: PlanGateInput,
  ): void {
    this.assertGateAllowsDecision(profile, gate, "publish");
  }

  private assertGateAllowsDecision(
    profile: GateProfileEntry,
    gate: PlanGateInput,
    decision: ControlDecision,
  ): void {
    if (decision === "abort" || decision === "hold" || decision === "escalate") {
      return;
    }

    const validations = gate.validationResults ?? [];
    const reviews = gate.reviewResults ?? [];

    if (profile.validators_blocking) {
      const blocked = validations.some((v) => v.result === "fail");
      if (blocked || gate.result === "fail") {
        throw new AiosError(
          "blocking-validation-fail",
          "Cannot publish/continue under validators_blocking with fail",
        );
      }
    }

    if (profile.reviews_blocking || profile.require_review_on_plan) {
      if (reviews.length === 0 && profile.require_review_on_plan) {
        throw new AiosError(
          "review-required",
          "Gate profile requires at least one review result",
        );
      }
      if (reviews.some((r) => r.result === "fail") || gate.result === "fail") {
        throw new AiosError(
          "blocking-review-fail",
          "Cannot publish/continue under reviews_blocking with fail",
        );
      }
    }

    if (gate.result === "warn" && !profile.allow_publish_with_warn) {
      if (decision === "publish" || decision === "continue") {
        throw new AiosError(
          "warn-not-allowed",
          "Profile does not allow publish/continue with warn",
        );
      }
    }
  }

  private async writeQualityGateArtifact(input: {
    orchestrationId: string;
    profileName: GateProfile;
    subject: QualityGatePayload["subject"];
    planGate: PlanGateInput;
    decision: ControlDecision;
    goalId: string;
    planId?: string;
  }): Promise<string> {
    const gateId = createArtifactId("quality-gate");
    const runId = createArtifactId("orc-run");
    const payload: QualityGatePayload = {
      schema_version: "1.0.0",
      artifact_id: gateId,
      orchestration_id: input.orchestrationId,
      profile: input.profileName,
      subject: input.subject,
      validation_results: input.planGate.validationResults ?? [],
      review_results: input.planGate.reviewResults ?? [],
      result: input.planGate.result,
      decision: input.decision,
      notes: input.planGate.notes,
      trace: {
        orchestration_id: input.orchestrationId,
        plan_id: input.planId,
        goal_id: input.goalId,
      },
      created_at: nowIso(),
    };
    QualityGatePayload.parse(payload);
    await this.artifacts.write({
      artifactId: gateId,
      type: "quality-gate",
      title: `Gate ${input.decision}`,
      status: "published",
      payloadKind: "json",
      payload,
      producedBy: { role: "orchestrator", runId },
      trace: payload.trace,
    });
    return gateId;
  }

  private async writeTaskStatusVersion(
    taskId: string,
    fromVersion: number,
    status: TaskStatus,
    trace: TaskPayload["trace"],
  ): Promise<void> {
    const prev = await this.artifacts.readPayloadJson(
      taskId,
      fromVersion,
      TaskPayload,
    );
    const nextVersion =
      ((await this.artifacts.latestVersion(taskId)) ?? fromVersion) + 1;
    const next: TaskPayload = {
      ...prev,
      status,
      trace: { ...prev.trace, ...trace },
    };
    TaskPayload.parse(next);
    const metaStatus =
      status === "succeeded" || status === "failed" || status === "cancelled"
        ? "published"
        : "ready";
    await this.artifacts.write({
      artifactId: taskId,
      type: "task",
      title: prev.title,
      status: metaStatus,
      version: nextVersion,
      payloadKind: "json",
      payload: next,
      producedBy: {
        role: "orchestrator",
        runId: createArtifactId("orc-run"),
        taskId,
      },
      supersedes: {
        artifact_id: taskId,
        artifact_version: fromVersion,
        relation: "derived-from",
      },
      trace: next.trace,
    });
    const fromMeta = await this.artifacts.readMeta(taskId, fromVersion);
    if (fromMeta.status === "draft") {
      await this.artifacts.transitionStatus(taskId, fromVersion, "archived");
    } else if (fromMeta.status === "ready") {
      await this.artifacts.transitionStatus(taskId, fromVersion, "published");
      await this.artifacts.transitionStatus(taskId, fromVersion, "superseded");
    } else if (fromMeta.status === "published") {
      await this.artifacts.transitionStatus(taskId, fromVersion, "superseded");
    }
  }

  private async setStatus(
    orchestrationId: string,
    status: OrchestrationStatePayload["status"],
  ): Promise<void> {
    const state = await this.readState(orchestrationId);
    await this.writeStateVersion(orchestrationId, {
      ...state,
      status,
      updated_at: nowIso(),
    });
  }

  private async writeStateVersion(
    orchestrationId: string,
    state: OrchestrationStatePayload,
  ): Promise<void> {
    const latest = (await this.artifacts.latestVersion(orchestrationId)) ?? 0;
    const next = latest + 1;
    const payload = OrchestrationStatePayload.parse({
      ...state,
      artifact_id: orchestrationId,
      updated_at: nowIso(),
    });
    const runId = createArtifactId("orc-run");
    await this.artifacts.write({
      artifactId: orchestrationId,
      type: "orchestration-state",
      title: `Orchestration ${orchestrationId}`,
      status: "ready",
      version: next,
      payloadKind: "json",
      payload,
      producedBy: { role: "orchestrator", runId },
      supersedes:
        latest > 0
          ? {
              artifact_id: orchestrationId,
              artifact_version: latest,
              relation: "derived-from",
            }
          : undefined,
      trace: payload.trace,
    });
  }
}

/** Re-export for callers that need SideEffect type locally. */
export type { SideEffect };
