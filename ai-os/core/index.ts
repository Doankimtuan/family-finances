import { ArtifactStore } from "./artifacts";
import { createDefaultConfig, type AiosCoreConfig } from "./configs";
import { KnowledgeBase } from "./knowledge";
import { MemoryManager } from "./memory";
import { Orchestrator } from "./orchestrator";
import { Planner } from "./planner";
import { TemplateLoader } from "./templates";

export type AiosCoreEngine = {
  config: AiosCoreConfig;
  artifacts: ArtifactStore;
  knowledge: KnowledgeBase;
  memory: MemoryManager;
  templates: TemplateLoader;
  planner: Planner;
  orchestrator: Orchestrator;
};

/** Construct the Core Engine (no workers). */
export function createAiosCore(
  overrides: Partial<AiosCoreConfig> = {},
): AiosCoreEngine {
  const config = createDefaultConfig(overrides);
  const knowledge = new KnowledgeBase(config.aiosRoot);
  const artifacts = new ArtifactStore(config.runtimeRoot, {
    assertArtifactType: (typeId) => knowledge.assertArtifactType(typeId),
  });
  const memory = new MemoryManager();
  const templates = new TemplateLoader(config.aiosRoot);
  const planner = new Planner(config, artifacts, knowledge);
  const orchestrator = new Orchestrator(
    config,
    artifacts,
    knowledge,
    planner,
    memory,
  );

  return {
    config,
    artifacts,
    knowledge,
    memory,
    templates,
    planner,
    orchestrator,
  };
}

export * from "./configs";
export * from "./artifacts";
export * from "./memory";
export * from "./knowledge";
export * from "./planner";
export * from "./orchestrator";
export * from "./templates";
export * from "./schemas";
export { AiosError, isAiosError } from "./lib/errors";
export { createArtifactId, isArtifactId } from "./lib/ids";
export { contentHash, nowIso } from "./lib/hash";
export { computeWaves, assertAcyclic } from "./lib/graph";
