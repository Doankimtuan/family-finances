import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/** Next.js `server-only` throws in non-RSC contexts; unit tests import leaves. */
vi.mock("server-only", () => ({}));
