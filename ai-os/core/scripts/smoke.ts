/**
 * Smoke entry for Core Engine (no workers).
 * Run: npx --yes tsx ai-os/core/scripts/smoke.ts
 */
import path from "node:path";
import { createAiosCore } from "../index";

async function main() {
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

  const { waves, planVersion } = await core.orchestrator.acceptPlan({
    orchestrationId,
    planId: planned.planId,
    reason: "Smoke accept",
    planGate: {
      result: "pass",
      reviewResults: [
        { artifact_id: planned.planId, result: "pass" },
      ],
      validationResults: [],
      notes: "Smoke plan review pass",
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
  if (state.status !== "settling") {
    throw new Error(`Expected settling, got ${state.status}`);
  }

  await core.orchestrator.recordQualityGate({
    orchestrationId,
    subject: { kind: "orchestration", id: orchestrationId },
    result: "pass",
    decision: "publish",
    reviewResults: [{ artifact_id: orchestrationId, result: "pass" }],
    validationResults: [],
    notes: "Smoke settle gate",
  });

  state = await core.orchestrator.readState(orchestrationId);
  if (state.status !== "succeeded") {
    throw new Error(`Expected succeeded, got ${state.status}`);
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
