import { describe, expect, it } from "vitest";
import {
  CLIENT_MESSAGE_NAMESPACES,
  selectClientMessages,
} from "@/i18n/client-messages";

describe("selectClientMessages", () => {
  it("keeps only the namespaces selected for a route family", () => {
    const messages = {
      a11y: { back: "Back" },
      auth: { login: "Log in" },
      money: { title: "Money" },
    };

    expect(
      selectClientMessages(messages, CLIENT_MESSAGE_NAMESPACES.AUTH),
    ).toEqual({
      a11y: messages.a11y,
      auth: messages.auth,
    });
  });
});
