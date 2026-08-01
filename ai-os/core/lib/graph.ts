import { AiosError } from "../lib/errors";
import type { DependencyGraphPayload } from "../schemas/plan";
import type { EdgeType } from "../schemas/common";

export type GraphEdge = {
  predecessor: string;
  successor: string;
  type: EdgeType;
  hard?: boolean;
};

export type WavePlan = {
  waves: string[][];
  acyclic: boolean;
};

function isHard(edge: GraphEdge): boolean {
  if (edge.type === "informs") return false;
  return edge.hard !== false;
}

/**
 * Kahn topological sort into parallel waves.
 * Only hard edges (blocks/feeds with hard!==false) constrain ordering.
 */
export function computeWaves(
  nodeIds: string[],
  edges: GraphEdge[],
): WavePlan {
  const nodes = new Set(nodeIds);
  for (const e of edges) {
    if (!nodes.has(e.predecessor) || !nodes.has(e.successor)) {
      throw new AiosError(
        "graph-unknown-node",
        `Edge references unknown node: ${e.predecessor} → ${e.successor}`,
      );
    }
  }

  const hardEdges = edges.filter(isHard);
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of nodes) {
    indegree.set(id, 0);
    adj.set(id, []);
  }
  for (const e of hardEdges) {
    adj.get(e.predecessor)!.push(e.successor);
    indegree.set(e.successor, (indegree.get(e.successor) ?? 0) + 1);
  }

  const waves: string[][] = [];
  let remaining = new Set(nodes);

  while (remaining.size > 0) {
    const wave = [...remaining].filter((id) => (indegree.get(id) ?? 0) === 0);
    if (wave.length === 0) {
      return { waves, acyclic: false };
    }
    waves.push(wave.sort());
    for (const id of wave) {
      remaining.delete(id);
      for (const succ of adj.get(id) ?? []) {
        indegree.set(succ, (indegree.get(succ) ?? 0) - 1);
      }
    }
  }

  return { waves, acyclic: true };
}

export function assertAcyclic(graph: DependencyGraphPayload): void {
  const nodeIds = graph.nodes.map((n) => n.id);
  const result = computeWaves(nodeIds, graph.edges);
  if (!result.acyclic) {
    throw new AiosError(
      "cyclic-dependency-graph",
      "Hard dependency edges contain a cycle",
    );
  }
}
