import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ThemeProvider,
  THEME_STORAGE_KEY,
  useTheme,
} from "@/providers/theme-provider";

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <output data-testid="theme-value">{theme}</output>
      <button onClick={() => setTheme("dark")}>Set dark</button>
      <button onClick={() => setTheme("light")}>Set light</button>
    </>
  );
}

describe("ThemeProvider storage fallback", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      (media: string) =>
        ({
          matches: false,
          media,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("keeps the latest choice when writes fail but reads return a stale value", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    vi.spyOn(window.localStorage, "setItem").mockImplementationOnce(() => {
      throw new DOMException("Storage is unavailable", "SecurityError");
    });

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");

    fireEvent.click(screen.getByRole("button", { name: "Set dark" }));
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    vi.restoreAllMocks();
    fireEvent.click(screen.getByRole("button", { name: "Set light" }));
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
  });
});
