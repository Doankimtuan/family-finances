import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/shared-kernel/app-path";
import { ProductRouteTransition } from "@/shared/patterns/product-route-transition";
import { motionTokens } from "@/shared/motion";

const state = vi.hoisted(() => ({
  pathname: "",
  enabled: true,
  mounted: true,
}));
vi.mock("@/i18n/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/shared/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/motion")>()),
  useMotionPolicy: () => state,
}));

function Content() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

beforeEach(() => {
  state.pathname = APP_PATH.MONEY_ADD;
  state.enabled = true;
  state.mounted = true;
});

describe("product navigation fade", () => {
  it("includes Record and preserves content state as streamed children update", () => {
    const { container, rerender } = render(
      <ProductRouteTransition>
        <Content />
      </ProductRouteTransition>,
    );
    expect(container.firstElementChild).toHaveStyle({
      opacity: motionTokens.opacity.transitionStart,
    });
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    rerender(
      <ProductRouteTransition>
        <Content />
      </ProductRouteTransition>,
    );
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });

  it.each([
    { enabled: false, mounted: true },
    { enabled: true, mounted: false },
  ])("renders without entry motion when policy is %j", (policy) => {
    Object.assign(state, policy);
    const { container } = render(
      <ProductRouteTransition>
        <Content />
      </ProductRouteTransition>,
    );
    expect(container.firstElementChild).toHaveStyle({ opacity: 1 });
  });
});
