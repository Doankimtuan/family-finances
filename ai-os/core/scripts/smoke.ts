/**
 * Smoke entry for Core Engine (no workers).
 * Run: npx --yes tsx ai-os/core/scripts/smoke.ts
 */
import path from "node:path";
import { createAiosCore } from "../index";
import { AiosError } from "../lib/errors";
import { ErrorPhase } from "../schemas/common";

async function expectAiosError(
  label: string,
  code: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
    throw new Error(`Expected ${label} to throw ${code}`);
  } catch (error) {
    if (error instanceof AiosError && error.code === code) return;
    throw error;
  }
}

async function main() {
  // Shared-defs lockstep: Zod ErrorPhase must include gating/settling (not control)
  const phases = ErrorPhase.options;
  if (!phases.includes("gating") || !phases.includes("settling")) {
    throw new Error("ErrorPhase missing gating/settling");
  }
  if ((phases as string[]).includes("control")) {
    throw new Error("ErrorPhase must not include control");
  }

  const root = path.resolve(process.cwd(), "ai-os");
  const runtimeRoot = path.join(root, "runtime");
  const core = createAiosCore({ aiosRoot: root, runtimeRoot });

  if (core.orchestrator.getPlanner() !== core.planner) {
    throw new Error("Expected single shared Planner instance");
  }

  const types = await core.knowledge.artifactTypes();
  if (!types.entries["plan"]) {
    throw new Error("artifact-types registry missing plan");
  }

  // --- Happy path: gating → settling → succeeded ---
  const { orchestrationId, memory } = await core.orchestrator.start({
    gateProfile: "standard",
  });
  if (core.memory.forNamespace(orchestrationId) !== memory) {
    throw new Error("Expected MemoryManager-backed working memory");
  }
  memory.set("phase", "smoke");

  const planned = await core.orchestrator.planAndAttach(orchestrationId, {
    goal: {
      title: "Core engine smoke",
      problem: "Verify planner and orchestrator persist artifacts",
      successCriteria: [
        { id: "plan-accepted", description: "Plan accepted and waves scheduled" },
      ],
      nonGoals: ["Run workers"],
      constraints: [],
    },
    planTitle: "Smoke plan",
    tasks: [
      {
        key: "a",
        title: "Task A",
        skillId: "example-skill",
        primaryOutputType: "doc",
        doneWhen: ["A done"],
        sideEffectBudget: ["runtime-write"],
        inputGoal: true,
      },
      {
        key: "b",
        title: "Task B",
        skillId: "example-skill",
        primaryOutputType: "doc",
        doneWhen: ["B done"],
        sideEffectBudget: ["runtime-write"],
        inputGoal: true,
      },
    ],
    edges: [
      {
        predecessorKey: "a",
        successorKey: "b",
        type: "blocks",
      },
    ],
    acceptReservedSkills: true,
  });

  await expectAiosError("accept without validation evidence", "validation-required", () =>
    core.orchestrator.acceptPlan({
      orchestrationId,
      planId: planned.planId,
      reason: "Missing validations",
      planGate: {
        result: "pass",
        reviewResults: [{ artifact_id: planned.planId, result: "pass" }],
        validationResults: [],
      },
    }),
  );

  const { waves, planVersion } = await core.orchestrator.acceptPlan({
    orchestrationId,
    planId: planned.planId,
    reason: "Smoke accept",
    planGate: {
      result: "pass",
      reviewResults: [{ artifact_id: planned.planId, result: "pass" }],
      validationResults: [{ artifact_id: planned.planId, result: "pass" }],
      notes: "Smoke plan review + validation pass",
    },
  });

  const planMeta = await core.artifacts.readMeta(planned.planId, planVersion);
  const planPayload = await core.artifacts.readPayloadJson(
    planned.planId,
    planVersion,
  );
  if (planMeta.status !== "published") {
    throw new Error(`Expected plan meta published, got ${planMeta.status}`);
  }
  if ((planPayload as { status?: string }).status !== "published") {
    throw new Error(
      `Expected plan payload published, got ${(planPayload as { status?: string }).status}`,
    );
  }

  let state = await core.orchestrator.readState(orchestrationId);
  if (state.status !== "scheduled") {
    throw new Error(`Expected scheduled, got ${state.status}`);
  }
  if (waves.length !== 2) {
    throw new Error(`Expected 2 waves, got ${waves.length}`);
  }

  await expectAiosError("planAndAttach from scheduled", "illegal-orchestration-status", () =>
    core.orchestrator.planAndAttach(orchestrationId, {
      goal: {
        title: "Illegal replan",
        problem: "Should fail",
        successCriteria: [{ id: "xx", description: "x" }],
        nonGoals: [],
        constraints: [],
      },
      planTitle: "Illegal",
      tasks: [
        {
          key: "z",
          title: "Z",
          skillId: "example-skill",
          primaryOutputType: "doc",
          doneWhen: ["z"],
          sideEffectBudget: ["runtime-write"],
          inputGoal: true,
        },
      ],
      edges: [],
      acceptReservedSkills: true,
    }),
  );

  const wave0 = await core.orchestrator.startNextWave(orchestrationId);
  const taskA = wave0.taskIds[0]!;
  await core.orchestrator.recordTaskOutcome({
    orchestrationId,
    taskId: taskA,
    status: "succeeded",
    notes: "Smoke stub success A",
  });

  const wave1 = await core.orchestrator.startNextWave(orchestrationId);
  const taskB = wave1.taskIds[0]!;
  await core.orchestrator.recordTaskOutcome({
    orchestrationId,
    taskId: taskB,
    status: "succeeded",
    notes: "Smoke stub success B",
  });

  state = await core.orchestrator.readState(orchestrationId);
  if (state.status !== "gating") {
    throw new Error(`Expected gating, got ${state.status}`);
  }

  await expectAiosError("settle gate without validations", "validation-required", () =>
    core.orchestrator.recordQualityGate({
      orchestrationId,
      subject: { kind: "orchestration", id: orchestrationId },
      result: "pass",
      decision: "publish",
      reviewResults: [{ artifact_id: orchestrationId, result: "pass" }],
      validationResults: [],
      notes: "Missing validation evidence",
    }),
  );

  await core.orchestrator.recordQualityGate({
    orchestrationId,
    subject: { kind: "orchestration", id: orchestrationId },
    result: "pass",
    decision: "publish",
    reviewResults: [{ artifact_id: orchestrationId, result: "pass" }],
    validationResults: [{ artifact_id: orchestrationId, result: "pass" }],
    notes: "Smoke settle gate",
  });

  state = await core.orchestrator.readState(orchestrationId);
  if (state.status !== "settling") {
    throw new Error(`Expected settling after publish, got ${state.status}`);
  }

  await core.orchestrator.settle(orchestrationId, "Smoke settle complete");
  state = await core.orchestrator.readState(orchestrationId);
  if (state.status !== "succeeded") {
    throw new Error(`Expected succeeded, got ${state.status}`);
  }

  await expectAiosError("escalate after terminal", "illegal-orchestration-status", () =>
    core.orchestrator.escalate({
      orchestrationId,
      reason: "Should not escalate succeeded",
    }),
  );

  // --- Fail-fast with retries exhausted (maxRetriesPerTask=0) ---
  const failCore = createAiosCore({
    aiosRoot: root,
    runtimeRoot: path.join(runtimeRoot, "smoke-failfast"),
    budget: { maxRetriesPerTask: 0 },
  });
  const failOrch = await failCore.orchestrator.start({ gateProfile: "standard" });
  const failPlan = await failCore.orchestrator.planAndAttach(failOrch.orchestrationId, {
    goal: {
      title: "Fail-fast smoke",
      problem: "Verify sibling cancel on fail-fast",
      successCriteria: [{ id: "fail-fast", description: "fail fast" }],
      nonGoals: [],
      constraints: [],
    },
    planTitle: "Fail-fast plan",
    tasks: [
      {
        key: "p",
        title: "Parallel P",
        skillId: "example-skill",
        primaryOutputType: "doc",
        doneWhen: ["p"],
        sideEffectBudget: ["runtime-write"],
        inputGoal: true,
      },
      {
        key: "q",
        title: "Parallel Q",
        skillId: "example-skill",
        primaryOutputType: "doc",
        doneWhen: ["q"],
        sideEffectBudget: ["runtime-write"],
        inputGoal: true,
      },
    ],
    edges: [],
    acceptReservedSkills: true,
  });
  await failCore.orchestrator.acceptPlan({
    orchestrationId: failOrch.orchestrationId,
    planId: failPlan.planId,
    planGate: {
      result: "pass",
      reviewResults: [{ artifact_id: failPlan.planId, result: "pass" }],
      validationResults: [{ artifact_id: failPlan.planId, result: "pass" }],
    },
  });
  const failWave = await failCore.orchestrator.startNextWave(failOrch.orchestrationId);
  if (failWave.taskIds.length !== 2) {
    throw new Error(`Expected parallel wave of 2, got ${failWave.taskIds.length}`);
  }
  const [failTask, siblingTask] = failWave.taskIds;
  await failCore.orchestrator.recordTaskOutcome({
    orchestrationId: failOrch.orchestrationId,
    taskId: failTask!,
    status: "failed",
    notes: "Force fail-fast",
    failFast: true,
  });
  let failState = await failCore.orchestrator.readState(failOrch.orchestrationId);
  if (failState.status !== "failed") {
    throw new Error(`Expected failed after fail-fast, got ${failState.status}`);
  }
  const siblingOutcome = (failState.task_outcomes ?? []).find(
    (o) => o.task_id === siblingTask,
  );
  if (siblingOutcome?.status !== "cancelled") {
    throw new Error(
      `Expected sibling cancelled, got ${siblingOutcome?.status ?? "missing"}`,
    );
  }

  // --- Soft fail + retryTask (default retries) ---
  const retryOrch = await core.orchestrator.start({ gateProfile: "advisory" });
  const retryPlan = await core.orchestrator.planAndAttach(retryOrch.orchestrationId, {
    goal: {
      title: "Retry smoke",
      problem: "Verify soft fail then retry",
      successCriteria: [{ id: "retry-ok", description: "retry works" }],
      nonGoals: [],
      constraints: [],
    },
    planTitle: "Retry plan",
    tasks: [
      {
        key: "r",
        title: "Retryable",
        skillId: "example-skill",
        primaryOutputType: "doc",
        doneWhen: ["r"],
        sideEffectBudget: ["runtime-write"],
        inputGoal: true,
      },
    ],
    edges: [],
    acceptReservedSkills: true,
  });
  await core.orchestrator.acceptPlan({
    orchestrationId: retryOrch.orchestrationId,
    planId: retryPlan.planId,
  });
  const retryWave = await core.orchestrator.startNextWave(retryOrch.orchestrationId);
  const retryTaskId = retryWave.taskIds[0]!;
  await core.orchestrator.recordTaskOutcome({
    orchestrationId: retryOrch.orchestrationId,
    taskId: retryTaskId,
    status: "failed",
    notes: "Soft fail — retries remain",
    failFast: true,
  });
  let retryState = await core.orchestrator.readState(retryOrch.orchestrationId);
  if (retryState.status !== "running") {
    throw new Error(`Expected running after soft fail, got ${retryState.status}`);
  }
  const retried = await core.orchestrator.retryTask({
    orchestrationId: retryOrch.orchestrationId,
    taskId: retryTaskId,
  });
  if (retried.attempt !== 2) {
    throw new Error(`Expected attempt 2, got ${retried.attempt}`);
  }
  await core.orchestrator.recordTaskOutcome({
    orchestrationId: retryOrch.orchestrationId,
    taskId: retryTaskId,
    status: "succeeded",
    notes: "Retry succeeded",
  });
  retryState = await core.orchestrator.readState(retryOrch.orchestrationId);
  if (retryState.status !== "gating") {
    throw new Error(`Expected gating after retry success, got ${retryState.status}`);
  }
  // advisory: validators_blocking false — publish without validation evidence
  await core.orchestrator.recordQualityGate({
    orchestrationId: retryOrch.orchestrationId,
    subject: { kind: "orchestration", id: retryOrch.orchestrationId },
    result: "pass",
    decision: "publish",
    notes: "Advisory settle",
  });
  retryState = await core.orchestrator.readState(retryOrch.orchestrationId);
  if (retryState.status !== "settling") {
    throw new Error(`Expected settling, got ${retryState.status}`);
  }
  await core.orchestrator.settle(retryOrch.orchestrationId);
  retryState = await core.orchestrator.readState(retryOrch.orchestrationId);
  if (retryState.status !== "succeeded") {
    throw new Error(`Expected succeeded after advisory settle, got ${retryState.status}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        orchestrationId,
        planId: planned.planId,
        planVersion,
        goalId: planned.goalId,
        waves,
        finalStatus: state.status,
        failFastSibling: siblingOutcome?.status,
        retryAttempt: retried.attempt,
        memory: memory.snapshot(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
