import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/form";

describe("shared/ui Pattern v1", () => {
  it("renders StatusAlert compound", () => {
    render(
      <StatusAlert
        variant="danger"
        title="Auth error"
        description="Check credentials"
      />,
    );

    expect(screen.getByText("Auth error")).toBeInTheDocument();
    expect(screen.getByText("Check credentials")).toBeInTheDocument();
  });

  it("renders TextField with label and error", () => {
    render(
      <TextField
        id="email"
        label="Email"
        error="Enter a valid email"
        defaultValue=""
      />,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("renders Button smoke", () => {
    render(<Button>Continue</Button>);
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });
});
