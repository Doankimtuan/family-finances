import { ArtifactStore } from "../artifacts";
import type { AiosCoreConfig } from "../configs";
import { AiosError } from "../lib/errors";
import { createArtifactId } from "../lib/ids";
import { nowIso } from "../lib/hash";
import { assertAcyclic, computeWaves } from "../lib/graph";
import { KnowledgeBase } from "../knowledge";
import type { GateProfile, SideEffect } from "../schemas/common";
import {
  DependencyGraphPayload,
  GoalPayload,
  PlanPayload,
  TaskPayload,
} from "../schemas/plan";

export type PlannerTaskSpec = {
  title: string;
  description?: string;
  skillId: string;
  skillVersion?: string | "active";
  primaryOutputType: string;
  doneWhen: string[];
  sideEffectBudget: SideEffect[];
  /** Local keys for edges within this plan (not artifact ids yet). */
  key: string;
  inputGoal?: boolean;
  validators?: string[];
  reviewers?: string[];
  allowParallelAttempts?: boolean;
  continueOnCancel?: boolean;
};

export type PlannerEdgeSpec = {
  predecessorKey: string;
  successorKey: string;
  type: "blocks" | "feeds" | "informs";
  hard?: boolean;
};

export type CreatePlanInput = {
  goal: {
    title: string;
    problem: string;
    successCriteria: Array<{ id: string; description: string }>;
    constraints?: string[];
    nonGoals?: string[];
    risks?: string[];
    preferredGateProfile?: GateProfile;
  };
  planTitle: string;
  summary?: string;
  tasks: PlannerTaskSpec[];
  edges?: PlannerEdgeSpec[];
  gateProfile?: GateProfile;
  orchestrationId?: string;
  /** Synthetic run id for produced_by (planner session). */
  plannerRunId?: string;
  acceptReservedSkills?: boolean;
};

export type CreatePlanResult = {
  goalId: string;
  planId: string;
  dependencyGraphId: string;
  taskIdsByKey: Record<string, string>;
  waves: string[][];
};

export class Planner {
  constructor(
    private readonly config: AiosCoreConfig,
    private readonly artifacts: ArtifactStore,
    private readonly knowledge: KnowledgeBase,
  ) {}

  async createPlan(input: CreatePlanInput): Promise<CreatePlanResult> {
    if (input.tasks.length === 0) {
      throw new AiosError("empty-plan", "Plan requires at least one task");
    }
    if (input.goal.successCriteria.length === 0) {
      throw new AiosError(
        "missing-success-criteria",
        "Goal requires at least one success criterion",
      );
    }

    const keys = new Set(input.tasks.map((t) => t.key));
    if (keys.size !== input.tasks.length) {
      throw new AiosError("duplicate-task-key", "Task keys must be unique");
    }

    for (const task of input.tasks) {
      await this.knowledge.assertArtifactType(task.primaryOutputType);
      const status = await this.knowledge.skillStatus(task.skillId);
      if (!status) {
        if (this.config.requireActiveSkills) {
          throw new AiosError(
            "unknown-skill",
            `Skill "${task.skillId}" is not in the registry`,
          );
        }
      } else if (
        this.config.requireActiveSkills &&
        status !== "active" &&
        !input.acceptReservedSkills
      ) {
        throw new AiosError(
          "inactive-skill",
          `Skill "${task.skillId}" status is ${status}`,
        );
      }
    }

    const plannerRunId = input.plannerRunId ?? createArtifactId("planner-run");
    const goalId = createArtifactId("goal");
    const planId = createArtifactId("plan");
    const graphId = createArtifactId("deps");
    const ts = nowIso();
    const gateProfile =
      input.gateProfile ??
      input.goal.preferredGateProfile ??
      this.config.defaultGateProfile;

    const goalPayload: GoalPayload = {
      schema_version: "1.0.0",
      artifact_id: goalId,
      title: input.goal.title,
      problem: input.goal.problem,
      success_criteria: input.goal.successCriteria,
      constraints: input.goal.constraints ?? [],
      non_goals: input.goal.nonGoals ?? [],
      risks: input.goal.risks,
      preferred_gate_profile: gateProfile,
      created_at: ts,
    };
    GoalPayload.parse(goalPayload);

    await this.artifacts.write({
      artifactId: goalId,
      type: "goal",
      title: goalPayload.title,
      status: "ready",
      payloadKind: "json",
      payload: goalPayload,
      producedBy: { role: "planner", runId: plannerRunId },
      trace: {
        goal_id: goalId,
        orchestration_id: input.orchestrationId,
      },
    });

    const taskIdsByKey: Record<string, string> = {};
    for (const task of input.tasks) {
      taskIdsByKey[task.key] = createArtifactId(`task-${task.key}`);
    }

    for (const task of input.tasks) {
      const taskId = taskIdsByKey[task.key]!;
      const inputs = task.inputGoal
        ? [
            {
              name: "goal",
              artifact_id: goalId,
              artifact_version: 1 as const,
              required: true,
            },
          ]
        : [];

      const taskPayload: TaskPayload = {
        schema_version: "1.0.0",
        artifact_id: taskId,
        title: task.title,
        description: task.description,
        skill_id: task.skillId,
        skill_version: task.skillVersion ?? "active",
        primary_output_type: task.primaryOutputType,
        inputs,
        validators: task.validators ?? [],
        reviewers: task.reviewers ?? [],
        done_when: task.doneWhen,
        side_effect_budget: task.sideEffectBudget,
        allow_parallel_attempts: task.allowParallelAttempts ?? false,
        continue_on_cancel: task.continueOnCancel ?? false,
        status: "pending",
        trace: {
          goal_id: goalId,
          plan_id: planId,
          task_id: taskId,
          orchestration_id: input.orchestrationId,
        },
      };
      TaskPayload.parse(taskPayload);

      await this.artifacts.write({
        artifactId: taskId,
        type: "task",
        title: task.title,
        status: "ready",
        payloadKind: "json",
        payload: taskPayload,
        producedBy: { role: "planner", runId: plannerRunId, taskId },
        dependsOn: task.inputGoal
          ? [{ artifact_id: goalId, artifact_version: 1, relation: "requires" }]
          : [],
        trace: taskPayload.trace,
      });
    }

    const edges = (input.edges ?? []).map((e) => {
      const predecessor = taskIdsByKey[e.predecessorKey];
      const successor = taskIdsByKey[e.successorKey];
      if (!predecessor || !successor) {
        throw new AiosError(
          "edge-unknown-key",
          `Edge references unknown task key: ${e.predecessorKey} → ${e.successorKey}`,
        );
      }
      return {
        predecessor,
        successor,
        type: e.type,
        hard: e.hard,
      };
    });

    const nodeIds = Object.values(taskIdsByKey);
    const wavePlan = computeWaves(nodeIds, edges);
    if (!wavePlan.acyclic) {
      throw new AiosError(
        "cyclic-dependency-graph",
        "Plan hard edges contain a cycle",
      );
    }

    const graphPayload: DependencyGraphPayload = {
      schema_version: "1.0.0",
      artifact_id: graphId,
      kind: "task",
      plan_id: planId,
      orchestration_id: input.orchestrationId,
      created_at: ts,
      nodes: input.tasks.map((t) => ({
        id: taskIdsByKey[t.key]!,
        node_type: "task" as const,
        label: t.title,
        artifact_version: 1,
      })),
      edges,
      acyclic: true,
    };
    DependencyGraphPayload.parse(graphPayload);
    assertAcyclic(graphPayload);

    await this.artifacts.write({
      artifactId: graphId,
      type: "dependency-graph",
      title: `Deps for ${input.planTitle}`,
      status: "ready",
      payloadKind: "json",
      payload: graphPayload,
      producedBy: { role: "planner", runId: plannerRunId },
      dependsOn: nodeIds.map((id) => ({
        artifact_id: id,
        artifact_version: 1,
        relation: "requires" as const,
      })),
      trace: {
        goal_id: goalId,
        plan_id: planId,
        orchestration_id: input.orchestrationId,
      },
    });

    const planPayload: PlanPayload = {
      schema_version: "1.0.0",
      artifact_id: planId,
      plan_version: 1,
      goal_ref: {
        artifact_id: goalId,
        artifact_version: 1,
        relation: "requires",
      },
      title: input.planTitle,
      summary: input.summary,
      success_criteria: input.goal.successCriteria.map((sc) => ({
        id: sc.id,
        description: sc.description,
        maps_to_task_id: taskIdsByKey[sc.id],
      })),
      non_goals: input.goal.nonGoals ?? [],
      risks: input.goal.risks,
      task_refs: nodeIds.map((id) => ({
        artifact_id: id,
        artifact_version: 1,
        relation: "requires" as const,
      })),
      dependency_graph_ref: {
        artifact_id: graphId,
        artifact_version: 1,
        relation: "requires",
      },
      gate_profile: gateProfile,
      status: "ready",
      trace: {
        goal_id: goalId,
        plan_id: planId,
        orchestration_id: input.orchestrationId,
      },
      created_at: ts,
      updated_at: ts,
    };
    PlanPayload.parse(planPayload);

    await this.artifacts.write({
      artifactId: planId,
      type: "plan",
      title: input.planTitle,
      status: "ready",
      payloadKind: "json",
      payload: planPayload,
      producedBy: { role: "planner", runId: plannerRunId },
      dependsOn: [
        { artifact_id: goalId, artifact_version: 1, relation: "requires" },
        { artifact_id: graphId, artifact_version: 1, relation: "requires" },
        ...nodeIds.map((id) => ({
          artifact_id: id,
          artifact_version: 1,
          relation: "requires" as const,
        })),
      ],
      trace: planPayload.trace,
    });

    return {
      goalId,
      planId,
      dependencyGraphId: graphId,
      taskIdsByKey,
      waves: wavePlan.waves,
    };
  }
}
