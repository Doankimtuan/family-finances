import { useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertVariant } from "@/shared/ui/alert";
import {
  StatusAlertHost,
  StatusAlertProvider,
  useStatusAlert,
} from "@/providers/status-alert-provider";

function renderController(ui: ReactNode) {
  return render(
    <StatusAlertProvider>
      {ui}
      <StatusAlertHost />
    </StatusAlertProvider>,
  );
}

function AlertControls() {
  const statusAlert = useStatusAlert();

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          statusAlert.show({
            variant: AlertVariant.DANGER,
            title: "Auth error",
            description: "Check credentials",
          })
        }
      >
        Show danger
      </button>
      <button
        type="button"
        onClick={() =>
          statusAlert.show({
            variant: AlertVariant.SUCCESS,
            title: "Saved",
            description: "Preferences updated",
          })
        }
      >
        Show success
      </button>
      <button type="button" onClick={() => statusAlert.hide()}>
        Hide
      </button>
    </div>
  );
}

function RevokeFlow({
  action,
}: {
  action: () => Promise<{ ok: true } | { ok: false; code: string }>;
}) {
  const statusAlert = useStatusAlert();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        statusAlert.hide();
        setPending(true);
        void action().then((result) => {
          setPending(false);
          if (result.ok) return;
          statusAlert.show({
            variant: AlertVariant.DANGER,
            title: "pendingTitle",
            description: `errors.${result.code}`,
          });
        });
      }}
    >
      Revoke
    </button>
  );
}

describe("StatusAlert controller", () => {
  it("show() renders the requested alert", () => {
    renderController(<AlertControls />);

    expect(screen.queryByTestId("status-alert-host")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show danger" }));

    expect(screen.getByTestId("status-alert-host")).toBeInTheDocument();
    expect(screen.getByText("Auth error")).toBeInTheDocument();
    expect(screen.getByText("Check credentials")).toBeInTheDocument();
  });

  it("calling show() again replaces the current alert", () => {
    renderController(<AlertControls />);

    fireEvent.click(screen.getByRole("button", { name: "Show danger" }));
    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Preferences updated")).toBeInTheDocument();
    expect(screen.queryByText("Auth error")).not.toBeInTheDocument();
    expect(screen.queryByText("Check credentials")).not.toBeInTheDocument();
  });

  it("hide() removes the alert", () => {
    renderController(<AlertControls />);

    fireEvent.click(screen.getByRole("button", { name: "Show danger" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByTestId("status-alert-host")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth error")).not.toBeInTheDocument();
  });

  it("preserves variant, title, and description", () => {
    renderController(<AlertControls />);

    fireEvent.click(screen.getByRole("button", { name: "Show danger" }));

    const host = screen.getByTestId("status-alert-host");
    expect(host).toHaveTextContent("Auth error");
    expect(host).toHaveTextContent("Check credentials");
    expect(host).toHaveAttribute("data-variant", AlertVariant.DANGER);
  });

  it("shows the expected alert from a mutation error result", async () => {
    renderController(
      <RevokeFlow
        action={async () => ({ ok: false, code: "not_found" })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    expect(await screen.findByText("pendingTitle")).toBeInTheDocument();
    expect(screen.getByText("errors.not_found")).toBeInTheDocument();
  });

  it("throws when the hook is used without a provider", () => {
    function MissingProvider() {
      useStatusAlert();
      return null;
    }

    expect(() => render(<MissingProvider />)).toThrow(
      /useStatusAlert must be used within StatusAlertProvider/,
    );
  });
});
