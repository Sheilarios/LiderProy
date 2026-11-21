import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, LayoutDashboard, Users, BarChart3, Plus, Sparkles, Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { type Activity, type Kind, type Status, daysUntil, priorityLevel, priorityScore, weeklyLoad } from "@/lib/eduplan/priority";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduPlan — Organiza tu carga académica" },
      { name: "description", content: "Prototipo de EduPlan: registra, prioriza y visualiza tus tareas, evaluaciones y trabajos grupales universitarios." },
      { property: "og:title", content: "EduPlan — Organiza tu carga académica" },
      { property: "og:description", content: "Panel, calendario, priorización asistida, alertas, carga semanal y trabajos grupales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const iso = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const seed = (): Activity[] => [
  { id: "a1", title: "Informe EC3 Liderazgo", course: "Taller de Liderazgo", kind: "proyecto", due: iso(2), weight: 30, difficulty: 3, status: "en_curso",
    group: [{ member: "Sheila", task: "Cap. I–III", status: "entregado" }, { member: "Ariana", task: "Cap. IV–VI", status: "en_curso" }, { member: "Sheila", task: "Referencias APA", status: "pendiente" }] },
  { id: "a2", title: "Práctica calificada 2", course: "Cálculo II", kind: "evaluacion", due: iso(4), weight: 20, difficulty: 3, status: "pendiente" },
  { id: "a3", title: "Lectura capítulo 5", course: "Ética Profesional", kind: "tarea", due: iso(1), weight: 5, difficulty: 1, status: "pendiente" },
  { id: "a4", title: "Laboratorio de base de datos", course: "Base de Datos", kind: "tarea", due: iso(6), weight: 10, difficulty: 2, status: "pendiente" },
  { id: "a5", title: "Examen parcial", course: "Estadística", kind: "evaluacion", due: iso(12), weight: 25, difficulty: 3, status: "pendiente" },
  { id: "a6", title: "Prototipo app móvil", course: "Base de Datos", kind: "proyecto", due: iso(19), weight: 30, difficulty: 3, status: "pendiente",
    group: [{ member: "Luis", task: "Diseño", status: "pendiente" }, { member: "Ariana", task: "Modelo de datos", status: "pendiente" }] },
  { id: "a7", title: "Foro semanal", course: "Ética Profesional", kind: "tarea", due: iso(-2), weight: 3, difficulty: 1, status: "entregado" },
];

const kindLabel: Record<Kind, string> = { tarea: "Tarea", evaluacion: "Evaluación", proyecto: "Proyecto" };
const statusLabel: Record<Status, string> = { pendiente: "Pendiente", en_curso: "En curso", entregado: "Entregado" };
const prioClass = { alta: "bg-destructive text-destructive-foreground", media: "bg-warning text-accent-foreground", baja: "bg-secondary text-secondary-foreground" };
type Tab = "panel" | "calendario" | "carga" | "grupos";

function App() {
  const [list, setList] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>("panel");
  const [alertDays, setAlertDays] = useState(3);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("eduplan");
    setList(raw ? JSON.parse(raw) : seed());
    setAlertDays(Number(localStorage.getItem("eduplan-alert") ?? 3));
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { localStorage.setItem("eduplan", JSON.stringify(list)); localStorage.setItem("eduplan-alert", String(alertDays)); } }, [list, alertDays, loaded]);

  const update = (id: string, p: Partial<Activity>) => {
    if (p.status === "entregado") toast.success("¡Bien hecho! Actividad entregada 🎉");
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...p } : a)));
  };
  const sorted = useMemo(() => [...list].sort((a, b) => priorityScore(b) - priorityScore(a)), [list]);
  const alerts = list.filter((a) => a.status !== "entregado" && daysUntil(a.due) <= alertDays);

  const nav: [Tab, string, typeof LayoutDashboard][] = [["panel", "Panel", LayoutDashboard], ["calendario", "Calendario", CalendarDays], ["carga", "Carga semanal", BarChart3], ["grupos", "Trabajos grupales", Users]];

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-sidebar text-sidebar-foreground md:w-64 md:min-h-screen p-6 flex md:flex-col gap-4 md:gap-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Edu<span className="text-sidebar-primary">Plan</span></h1>
          <p className="text-xs opacity-70 hidden md:block mt-1">Tu carga académica, en un solo lugar</p>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {nav.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${tab === k ? "scale-[1.02] shadow-md " + "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:translate-x-1"}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h2 key={tab} className="font-display text-4xl font-bold animate-fade-up">{nav.find((n) => n[0] === tab)?.[1]}</h2>
          </div>
          <button onClick={() => setOpen(true)} className="group inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 font-semibold shadow-sm transition-all hover:scale-105 hover:shadow-lg active:scale-95">
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /> Nueva actividad
          </button>
        </header>

        {alerts.length > 0 && (
          <div className="mb-8 rounded-xl border border-accent bg-accent/15 p-4 flex gap-3 items-start animate-fade-up" role="alert">
            <Bell className="animate-ring h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">{alerts.length} actividad(es) vencen en {alertDays} días o menos</p>
              <p className="text-muted-foreground">{alerts.map((a) => `${a.title} (${fmtDays(daysUntil(a.due))})`).join(" · ")}</p>
            </div>
            <label className="text-xs flex items-center gap-2">Avisar con
              <select value={alertDays} onChange={(e) => setAlertDays(Number(e.target.value))} className="rounded border bg-card px-1 py-0.5">
                {[1, 2, 3, 5, 7].map((n) => <option key={n} value={n}>{n} días</option>)}
              </select>
            </label>
          </div>
        )}

        <div key={tab} className="animate-fade-up">
        {tab === "panel" && <Panel list={sorted} update={update} remove={(id) => { const old = list; setList((l) => l.filter((a) => a.id !== id)); toast("Actividad eliminada", { action: { label: "Deshacer", onClick: () => setList(old) } }); }} />}
        {tab === "calendario" && <Calendar list={list} />}
        {tab === "carga" && <Load list={list} />}
        {tab === "grupos" && <Groups list={list} update={update} />}
        </div>
      </main>
      {open && <NewActivity onClose={() => setOpen(false)} onSave={(a) => { setList((l) => [...l, a]); setOpen(false); toast.success(`"${a.title}" agregada`); }} />}
    </div>
  );
}

const fmtDays = (d: number) => (d < 0 ? `venció hace ${-d} d` : d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`);

function Panel({ list, update, remove }: { list: Activity[]; update: (id: string, p: Partial<Activity>) => void; remove: (id: string) => void }) {
  const pending = list.filter((a) => a.status !== "entregado");
  const top = pending[0];
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Pendientes" value={pending.length} />
        <Stat label="Prioridad alta" value={pending.filter((a) => priorityLevel(a) === "alta").length} />
        <Stat label="Entregadas" value={list.length - pending.length} />
      </div>
      {top && (
        <div className="rounded-xl bg-primary text-primary-foreground p-5 flex gap-3 animate-fade-up lift">
          <Sparkles className="animate-shimmer h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm"><span className="font-semibold">Sugerencia:</span> empieza por <b>{top.title}</b> ({top.course}). Vence {fmtDays(daysUntil(top.due))}, vale {top.weight}% y es de dificultad {["baja", "media", "alta"][top.difficulty - 1]}. Puedes cambiar la prioridad si lo prefieres.</p>
        </div>
      )}
      <div className="rounded-xl border bg-card divide-y">
        {list.map((a, idx) => {
          const lvl = priorityLevel(a);
          return (
            <div key={a.id} style={{ animationDelay: `${idx * 50}ms` }} className={`animate-fade-up p-4 flex flex-wrap items-center gap-4 transition-colors hover:bg-muted/50 ${a.status === "entregado" ? "opacity-50" : ""}`}>
              <button aria-label="Marcar entregado" onClick={() => update(a.id, { status: a.status === "entregado" ? "pendiente" : "entregado" })} className={`h-6 w-6 rounded-full border-2 border-primary grid place-items-center transition-all hover:scale-110 ${a.status === "entregado" ? "bg-primary text-primary-foreground" : ""}`}>
                {a.status === "entregado" && <Check className="animate-pop h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 min-w-48">
                <p className={`font-semibold ${a.status === "entregado" ? "line-through" : ""}`}>{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.course} · {kindLabel[a.kind]} · {a.weight}% · {fmtDays(daysUntil(a.due))}</p>
              </div>
              {a.status !== "entregado" && <span className="text-xs text-muted-foreground tabular-nums">puntaje {priorityScore(a)}</span>}
              <select aria-label="Prioridad" value={a.manualPriority ?? ""} onChange={(e) => update(a.id, e.target.value ? { manualPriority: e.target.value as "alta" } : { manualPriority: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${prioClass[lvl]}`}>
                <option value="">Auto: {lvl}</option><option value="alta">Alta (manual)</option><option value="media">Media (manual)</option><option value="baja">Baja (manual)</option>
              </select>
              <button aria-label="Eliminar" onClick={() => remove(a.id)} className="text-muted-foreground transition-transform hover:scale-125 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-5 lift animate-fade-up"><p className="text-sm text-muted-foreground">{label}</p><p key={value} className="font-display text-4xl font-bold animate-pop">{value}</p></div>;
}

function Calendar({ list }: { list: Activity[] }) {
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startPad + days }, (_, i) => (i < startPad ? null : i - startPad + 1));
  const todayIso = new Date().toISOString().slice(0, 10);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset(offset - 1)} className="px-3 py-1 rounded transition hover:bg-muted active:scale-90">‹</button>
        <p className="font-display text-xl font-semibold capitalize">{first.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}</p>
        <button onClick={() => setOffset(offset + 1)} className="px-3 py-1 rounded transition hover:bg-muted active:scale-90">›</button>
      </div>
      <div key={offset} className="grid grid-cols-7 gap-1 text-xs animate-fade">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => <div key={d} className="text-center font-semibold text-muted-foreground py-1">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const items = list.filter((a) => a.due === key);
          return (
            <div key={i} className={`min-h-20 rounded-lg border p-1 transition-all hover:-translate-y-0.5 hover:shadow-md ${key === todayIso ? "border-primary border-2" : ""}`}>
              <p className="font-semibold">{d}</p>
              {items.map((a) => <p key={a.id} className={`mt-1 truncate rounded px-1 ${a.status === "entregado" ? "bg-muted line-through" : prioClass[priorityLevel(a)]}`}>{a.title}</p>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Load({ list }: { list: Activity[] }) {
  const weeks = weeklyLoad(list);
  const max = Math.max(8, ...weeks.map((w) => w.load));
  return (
    <div className="rounded-xl border bg-card p-6">
      <p className="text-sm text-muted-foreground mb-6">Suma de dificultad de las actividades pendientes de cada semana. Desde 7 puntos se marca como posible sobrecarga.</p>
      <div className="flex items-end gap-4 h-64">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-sm font-semibold">{w.load}</span>
            <div className={`animate-grow w-full rounded-t-lg transition-opacity hover:opacity-80 ${w.overloaded ? "bg-destructive" : "bg-primary"}`} style={{ height: `${(w.load / max) * 100}%`, minHeight: 4, animationDelay: `${i * 90}ms` }} title={w.items.map((a) => a.title).join(", ")} />
            <span className="text-xs text-muted-foreground">{w.start.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
          </div>
        ))}
      </div>
      {weeks.some((w) => w.overloaded) && <p className="mt-6 text-sm rounded-lg bg-destructive/10 p-3">⚠ Hay semanas con sobrecarga. Considera adelantar actividades de esas semanas.</p>}
    </div>
  );
}

function Groups({ list, update }: { list: Activity[]; update: (id: string, p: Partial<Activity>) => void }) {
  const groups = list.filter((a) => a.group);
  const [draft, setDraft] = useState<Record<string, { member: string; task: string }>>({});
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {groups.length === 0 && <p className="text-muted-foreground">Aún no hay trabajos grupales. Crea una actividad y marca "trabajo grupal".</p>}
      {groups.map((a) => {
        const g = a.group ?? [];
        const done = g.filter((m) => m.status === "entregado").length;
        const d = draft[a.id] ?? { member: "", task: "" };
        return (
          <div key={a.id} className="rounded-xl border bg-card p-5 lift animate-fade-up">
            <p className="font-display text-xl font-semibold">{a.title}</p>
            <p className="text-xs text-muted-foreground mb-3">{a.course} · {fmtDays(daysUntil(a.due))}</p>
            <div className="h-2 rounded-full bg-muted mb-4"><div className="h-2 rounded-full bg-success transition-all duration-700" style={{ width: `${g.length ? (done / g.length) * 100 : 0}%` }} /></div>
            <ul className="space-y-2">
              {g.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-sm animate-fade-up">
                  <span className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-bold">{m.member[0]}</span>
                  <span className="flex-1"><b>{m.member}</b> — {m.task}</span>
                  <select value={m.status} onChange={(e) => update(a.id, { group: g.map((x, j) => (j === i ? { ...x, status: e.target.value as Status } : x)) })} className="rounded border bg-background px-2 py-0.5 text-xs">
                    {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button aria-label="Quitar" onClick={() => update(a.id, { group: g.filter((_, j) => j !== i) })}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </li>
              ))}
            </ul>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!d.member || !d.task) return; update(a.id, { group: [...g, { ...d, status: "pendiente" }] }); setDraft({ ...draft, [a.id]: { member: "", task: "" } }); }}>
              <input placeholder="Integrante" value={d.member} onChange={(e) => setDraft({ ...draft, [a.id]: { ...d, member: e.target.value } })} className="w-28 rounded border bg-background px-2 py-1 text-sm" />
              <input placeholder="Responsabilidad" value={d.task} onChange={(e) => setDraft({ ...draft, [a.id]: { ...d, task: e.target.value } })} className="flex-1 rounded border bg-background px-2 py-1 text-sm" />
              <button className="rounded bg-primary text-primary-foreground px-3 text-sm">Añadir</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

function NewActivity({ onClose, onSave }: { onClose: () => void; onSave: (a: Activity) => void }) {
  const [f, setF] = useState({ title: "", course: "", kind: "tarea" as Kind, due: iso(7), weight: 10, difficulty: 2 as 1 | 2 | 3, grupal: false });
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const input = "w-full rounded-lg border bg-background px-3 py-2 mt-1 transition focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="fixed inset-0 bg-foreground/40 grid place-items-center p-4 z-50 animate-fade backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (!f.title || !f.course) return;
        const { grupal, ...rest } = f; onSave({ ...rest, id: crypto.randomUUID(), status: "pendiente", ...(grupal ? { group: [] } : {}) }); }}
        className="w-full max-w-md rounded-2xl bg-card p-6 space-y-4 shadow-xl animate-modal">
        <h3 className="font-display text-2xl font-bold">Nueva actividad</h3>
        <label className="block text-sm font-medium">Título<input autoFocus required className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label className="block text-sm font-medium">Curso<input required className={input} value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Tipo<select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Kind })}>{Object.entries(kindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="block text-sm font-medium">Fecha límite<input type="date" className={input} value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
          <label className="block text-sm font-medium">Peso (%)<input type="number" min={0} max={100} className={input} value={f.weight} onChange={(e) => setF({ ...f, weight: Number(e.target.value) })} /></label>
          <label className="block text-sm font-medium">Dificultad<select className={input} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) as 1 })}><option value={1}>Baja</option><option value={2}>Media</option><option value={3}>Alta</option></select></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.grupal} onChange={(e) => setF({ ...f, grupal: e.target.checked })} /> Es trabajo grupal</label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 hover:bg-muted">Cancelar</button>
          <button className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-semibold">Guardar</button>
        </div>
      </form>
    </div>
  );
}
