import { describe, it, expect } from "vitest";
import { validate } from "./functionSafetyValidator";
import type { InteractiveSnapshot } from "./pageSnapshot";

function snap(over: Partial<InteractiveSnapshot> = {}): InteractiveSnapshot {
  return {
    visibleButtons: 10,
    visibleLinks: 30,
    visibleInputs: 5,
    visibleForms: 2,
    bodyVisible: true,
    scrollWidth: 1200,
    clientWidth: 1200,
    scrollRatio: 1,
    interactiveAreas: [1000, 1000, 1000],
    bodyPointerEventsNone: false,
    ...over,
  };
}

describe("functionSafetyValidator", () => {
  it("passes when nothing changed", () => {
    const r = validate(snap(), snap());
    expect(r.severity).toBe("safe");
    expect(r.passed).toBe(true);
  });

  it("blocks when buttons are hidden (>5% drop)", () => {
    const before = snap({ visibleButtons: 10 });
    const after = snap({ visibleButtons: 4 });
    const r = validate(before, after);
    expect(r.passed).toBe(false);
    expect(r.severity).toBe("blocked");
    expect(r.checks.find((c) => c.id === "buttons")?.passed).toBe(false);
  });

  it("blocks when body becomes invisible", () => {
    const r = validate(snap(), snap({ bodyVisible: false }));
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "body-visible")?.passed).toBe(false);
  });

  it("blocks when pointer-events:none is applied to body", () => {
    const r = validate(snap(), snap({ bodyPointerEventsNone: true }));
    expect(r.passed).toBe(false);
  });

  it("flags runaway horizontal scroll", () => {
    const before = snap({ scrollRatio: 1 });
    const after = snap({ scrollRatio: 2 });
    const r = validate(before, after);
    expect(r.checks.find((c) => c.id === "hscroll")?.passed).toBe(false);
  });

  it("tolerates pre-existing horizontal overflow", () => {
    const before = snap({ scrollRatio: 1.4 });
    const after = snap({ scrollRatio: 1.6 });
    const r = validate(before, after);
    expect(r.checks.find((c) => c.id === "hscroll")?.passed).toBe(true);
  });

  it("allows a tiny drop within 5% tolerance", () => {
    const before = snap({ visibleLinks: 100 });
    const after = snap({ visibleLinks: 97 });
    const r = validate(before, after);
    expect(r.checks.find((c) => c.id === "links")?.passed).toBe(true);
  });
});
