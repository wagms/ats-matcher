import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Lightbulb,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";

import { analyze, SAMPLES, type Keyword } from "@/lib/ats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATS Match — Otimizador de Currículo para ATS" },
      {
        name: "description",
        content:
          "Cole seu currículo e a descrição da vaga e receba a pontuação ATS, palavras-chave faltantes e sugestões de reescrita. Grátis e sem cadastro.",
      },
      { property: "og:title", content: "ATS Match — Otimizador de Currículo para ATS" },
      {
        property: "og:description",
        content:
          "Compare currículo e vaga, veja sua pontuação de 0 a 100 e as palavras-chave que faltam para passar pelos filtros automáticos.",
      },
    ],
  }),
  component: Index,
});

const CATEGORY_LABEL: Record<Keyword["category"], string> = {
  tecnica: "Skill técnica",
  ferramenta: "Ferramenta",
  soft: "Soft skill",
};

function scoreTone(score: number) {
  if (score >= 75) return { text: "text-success", ring: "text-success", label: "Ótima aderência" };
  if (score >= 50) return { text: "text-warning", ring: "text-warning", label: "Aderência média" };
  return { text: "text-destructive", ring: "text-destructive", label: "Aderência baixa" };
}

function ScoreRing({ score }: { score: number }) {
  const tone = scoreTone(score);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="14"
          className="stroke-muted"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700", tone.ring)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display text-4xl font-bold", tone.text)}>{score}%</span>
        <span className="mt-1 text-xs text-muted-foreground">ATS Match</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Tag({ keyword, variant }: { keyword: Keyword; variant: "found" | "missing" }) {
  return (
    <span
      title={CATEGORY_LABEL[keyword.category]}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize",
        variant === "found"
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {variant === "found" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {keyword.term}
      {variant === "found" && keyword.occurrences > 1 ? (
        <span className="opacity-70">×{keyword.occurrences}</span>
      ) : null}
    </span>
  );
}

function Index() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<"todas" | Keyword["category"]>("todas");

  const analysis = useMemo(() => analyze(resume, job), [resume, job]);
  const ready = resume.trim().length > 40 && job.trim().length > 40;
  const showResults = submitted && ready;

  const filtered = (list: Keyword[]) =>
    filter === "todas" ? list : list.filter((k) => k.category === filter);

  const loadSample = (key: keyof typeof SAMPLES) => {
    setResume(SAMPLES[key].resume);
    setJob(SAMPLES[key].job);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-bold text-foreground">ATS Match</p>
              <p className="text-xs text-muted-foreground">Otimizador de currículo</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground sm:inline-flex">
            <BadgeCheck className="h-4 w-4" /> Grátis e sem cadastro
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-12 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Seu currículo passa pelo filtro do ATS?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Cole o texto do seu currículo e a descrição da vaga. Em segundos você recebe a pontuação
          de compatibilidade, as palavras-chave que faltam e sugestões prontas de reescrita.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Testar com exemplo:</span>
          {(Object.keys(SAMPLES) as (keyof typeof SAMPLES)[]).map((key) => (
            <button
              key={key}
              onClick={() => loadSample(key)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {SAMPLES[key].label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-5 px-5 lg:grid-cols-2">
        {[
          {
            title: "Seu currículo",
            icon: FileText,
            value: resume,
            set: setResume,
            placeholder: "Cole aqui todo o texto do seu currículo…",
          },
          {
            title: "Descrição da vaga",
            icon: Target,
            value: job,
            set: setJob,
            placeholder: "Cole aqui a descrição completa da vaga…",
          },
        ].map((field) => (
          <div
            key={field.title}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <field.icon className="h-4 w-4 text-primary" />
                {field.title}
              </h2>
              <span className="text-xs text-muted-foreground">
                {field.value.trim() ? field.value.trim().split(/\s+/).length : 0} palavras
              </span>
            </div>
            <textarea
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              rows={14}
              className="w-full resize-y rounded-xl border border-input bg-background p-4 font-sans text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
        ))}
      </section>

      <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center gap-3 px-5">
        <button
          onClick={() => setSubmitted(true)}
          disabled={!ready}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analisar compatibilidade <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setResume("");
            setJob("");
            setSubmitted(false);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" /> Limpar
        </button>
        {!ready ? (
          <p className="text-sm text-muted-foreground">
            Cole os dois textos (ou use um exemplo) para liberar a análise.
          </p>
        ) : null}
      </div>

      {showResults ? (
        <section className="mx-auto mt-12 max-w-6xl space-y-5 px-5 pb-20">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:flex-row sm:text-left lg:col-span-1">
              <ScoreRing score={analysis.score} />
              <div>
                <p className="font-display text-lg font-semibold text-foreground">
                  {scoreTone(analysis.score).label}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {analysis.found.length} de {analysis.keywords.length} palavras-chave da vaga
                  aparecem no seu currículo.
                </p>
              </div>
            </div>

            <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                Como a nota é composta
              </h2>
              <MetricBar label="Palavras-chave (peso 60%)" value={analysis.keywordScore} />
              <MetricBar label="Estrutura das seções (peso 25%)" value={analysis.structureScore} />
              <MetricBar label="Densidade e resultados (peso 15%)" value={analysis.densityScore} />
              <p className="text-xs text-muted-foreground">
                Currículo com {analysis.words} palavras — o intervalo ideal para triagem automática
                fica entre 300 e 900.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-foreground">
                Palavras-chave
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {(["todas", "tecnica", "ferramenta", "soft"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f === "todas" ? "Todas" : CATEGORY_LABEL[f] + "s"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Encontradas (
                  {filtered(analysis.found).length})
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {filtered(analysis.found).length ? (
                    filtered(analysis.found).map((k) => (
                      <Tag key={k.term} keyword={k} variant="found" />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma nesta categoria.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <XCircle className="h-4 w-4" /> Faltantes ({filtered(analysis.missing).length})
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {filtered(analysis.missing).length ? (
                    filtered(analysis.missing).map((k) => (
                      <Tag key={k.term} keyword={k} variant="missing" />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tudo coberto nesta categoria. Excelente!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="font-display text-base font-semibold text-foreground">
                Estrutura do currículo
              </h2>
              <ul className="mt-4 space-y-3">
                {analysis.sections.map((s) => (
                  <li key={s.name} className="flex items-start gap-3">
                    {s.found ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      {!s.found ? (
                        <p className="text-xs text-muted-foreground">{s.hint}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Lightbulb className="h-4 w-4 text-primary" /> Recomendações
              </h2>
              <ol className="mt-4 space-y-3">
                {analysis.recommendations.map((r, i) => (
                  <li key={r} className="flex gap-3 text-sm text-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-base font-semibold text-foreground">
              Sugestões de reescrita
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Troque frases genéricas por versões com verbo de ação, ferramenta e resultado.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {analysis.rewrites.map((r) => (
                <div key={r.before} className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Antes
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground line-through">{r.before}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-success">
                    Depois
                  </p>
                  <p className="mt-1 text-sm text-foreground">{r.after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="h-20" />
      )}

      <footer className="border-t border-border bg-surface py-6 text-center text-xs text-muted-foreground">
        ATS Match · análise feita no seu navegador, nenhum texto é armazenado.
      </footer>
    </main>
  );
}
