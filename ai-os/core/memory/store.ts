import { AiosError } from "../lib/errors";
import { nowIso } from "../lib/hash";

export type MemoryEntry = {
  key: string;
  value: unknown;
  updatedAt: string;
  tags?: string[];
};

/**
 * Working memory for an orchestration session.
 * In-process map; not a substitute for durable artifacts.
 */
export class WorkingMemory {
  private readonly store = new Map<string, MemoryEntry>();

  constructor(readonly namespace: string) {
    if (!namespace.trim()) {
      throw new AiosError("invalid-memory-namespace", "Memory namespace is required");
    }
  }

  private k(key: string): string {
    return `${this.namespace}::${key}`;
  }

  set(key: string, value: unknown, tags?: string[]): MemoryEntry {
    const entry: MemoryEntry = {
      key,
      value,
      updatedAt: nowIso(),
      tags,
    };
    this.store.set(this.k(key), entry);
    return entry;
  }

  get<T = unknown>(key: string): T | undefined {
    const entry = this.store.get(this.k(key));
    return entry?.value as T | undefined;
  }

  has(key: string): boolean {
    return this.store.has(this.k(key));
  }

  delete(key: string): boolean {
    return this.store.delete(this.k(key));
  }

  clear(): void {
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(`${this.namespace}::`)) this.store.delete(key);
    }
  }

  list(): MemoryEntry[] {
    const prefix = `${this.namespace}::`;
    return [...this.store.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v);
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.list().map((e) => [e.key, e.value]));
  }
}

export class MemoryManager {
  private readonly namespaces = new Map<string, WorkingMemory>();

  forNamespace(namespace: string): WorkingMemory {
    let mem = this.namespaces.get(namespace);
    if (!mem) {
      mem = new WorkingMemory(namespace);
      this.namespaces.set(namespace, mem);
    }
    return mem;
  }

  dropNamespace(namespace: string): void {
    this.namespaces.get(namespace)?.clear();
    this.namespaces.delete(namespace);
  }
}
