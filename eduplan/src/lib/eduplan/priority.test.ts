import { describe, it, expect } from "vitest";
import { priorityLevel, weeklyLoad, type Activity } from "./priority";
const today = new Date(2026, 10, 21);
const base: Activity = { id: "1", title: "x", course: "c", kind: "tarea", due: "2026-11-22", weight: 30, difficulty: 3, status: "pendiente" };
describe("priorización", () => {
  it("entrega mañana, peso alto y difícil = alta", () => expect(priorityLevel(base, today)).toBe("alta"));
  it("lejana, poco peso y fácil = baja", () => expect(priorityLevel({ ...base, due: "2026-12-30", weight: 5, difficulty: 1 }, today)).toBe("baja"));
  it("ajuste manual prevalece", () => expect(priorityLevel({ ...base, manualPriority: "baja" }, today)).toBe("baja"));
  it("semana con carga >= 7 se marca sobrecargada", () => {
    const w = weeklyLoad([base, { ...base, id: "2" }, { ...base, id: "3", difficulty: 1 }], 1, today);
    expect(w[0]?.overloaded).toBe(true);
  });
});
