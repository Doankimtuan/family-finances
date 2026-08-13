import { describe, expect, it } from "vitest";
import {
  HOME_GREETING_PERIOD,
  homeGreetingPeriod,
} from "@/modules/home/application/home-constants";

describe("homeGreetingPeriod", () => {
  it("uses the canonical Vietnam-local time boundaries", () => {
    expect(homeGreetingPeriod(new Date("2026-08-13T09:00:00+07:00"))).toBe(
      HOME_GREETING_PERIOD.MORNING,
    );
    expect(homeGreetingPeriod(new Date("2026-08-13T14:00:00+07:00"))).toBe(
      HOME_GREETING_PERIOD.AFTERNOON,
    );
    expect(homeGreetingPeriod(new Date("2026-08-13T19:00:00+07:00"))).toBe(
      HOME_GREETING_PERIOD.EVENING,
    );
  });
});
