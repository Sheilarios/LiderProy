export type Kind = "tarea" | "evaluacion" | "proyecto";
export type Status = "pendiente" | "en_curso" | "entregado";
export interface Activity {
  id: string;
  title: string;
  course: string;
  kind: Kind;
  due: string; // YYYY-MM-DD
  weight: number; // % de la nota
  difficulty: 1 | 2 | 3;
  status: Status;
  group?: { member: string; task: string; status: Status }[];
  manualPriority?: "alta" | "media" | "baja" | undefined;
}

export function daysUntil(due: string, today = new Date()): number {
  const d = new Date(due + "T00:00:00");
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

/** Puntaje sugerido 0-100 combinando fecha, peso y dificultad. */
export function priorityScore(a: Activity, today = new Date()): number {
  if (a.status === "entregado") return 0;
  const d = Math.max(0, daysUntil(a.due, today));
  const urgency = Math.max(0, 1 - d / 14); // 0..1
  const weight = Math.min(a.weight, 40) / 40;
  const diff = (a.difficulty - 1) / 2;
  return Math.round(urgency * 55 + weight * 30 + diff * 15);
}

export function priorityLevel(a: Activity, today = new Date()): "alta" | "media" | "baja" {
  if (a.manualPriority) return a.manualPriority;
  const s = priorityScore(a, today);
  return s >= 60 ? "alta" : s >= 35 ? "media" : "baja";
}

/** Carga semanal: suma de dificultad de actividades pendientes por semana (lunes). */
export function weeklyLoad(list: Activity[], weeks = 6, today = new Date()) {
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(monday.getTime() + i * 7 * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    const items = list.filter((a) => {
      const d = new Date(a.due + "T00:00:00");
      return a.status !== "entregado" && d >= start && d < end;
    });
    const load = items.reduce((s, a) => s + a.difficulty, 0);
    return { start, items, load, overloaded: load >= 7 };
  });
}
