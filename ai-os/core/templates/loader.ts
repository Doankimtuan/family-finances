import { promises as fs } from "node:fs";
import path from "node:path";
import { AiosError } from "../lib/errors";

export type TemplateKind =
  | "artifact"
  | "plan"
  | "task"
  | "validation"
  | "review"
  | "run"
  | "skill"
  | "worker";

/**
 * Loads markdown/JSON starters from ai-os/templates.
 * Core engine does not mutate templates; it only reads them.
 */
export class TemplateLoader {
  constructor(private readonly aiosRoot: string) {}

  root(): string {
    return path.join(this.aiosRoot, "templates");
  }

  async readText(kind: TemplateKind, filename: string): Promise<string> {
    const abs = path.join(this.root(), kind, filename);
    try {
      return await fs.readFile(abs, "utf8");
    } catch (error) {
      throw new AiosError("template-not-found", `Missing template ${kind}/${filename}`, {
        cause: error,
        details: { abs },
      });
    }
  }

  async readJson<T = unknown>(kind: TemplateKind, filename: string): Promise<T> {
    const text = await this.readText(kind, filename);
    return JSON.parse(text) as T;
  }

  async list(kind: TemplateKind): Promise<string[]> {
    const dir = path.join(this.root(), kind);
    try {
      return await fs.readdir(dir);
    } catch (error) {
      throw new AiosError("template-dir-missing", `Missing template dir ${kind}`, {
        cause: error,
      });
    }
  }
}
