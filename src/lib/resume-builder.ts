// Monta uma versão ATS friendly do currículo a partir do texto colado pelo usuário.
// Regra fundamental: nada é inventado — apenas reorganizamos e formatamos o conteúdo original.

export type ResumeSection = { title: string; lines: string[] };

const HEADING_MAP: { title: string; pattern: RegExp }[] = [
  { title: "RESUMO PROFISSIONAL", pattern: /^(resumo|perfil|objetivo|sobre mim|summary)/i },
  {
    title: "EXPERIÊNCIA PROFISSIONAL",
    pattern: /^(experi[êe]ncia|hist[óo]rico profissional|trajet[óo]ria|atua[çc][ãa]o)/i,
  },
  {
    title: "FORMAÇÃO ACADÊMICA",
    pattern: /^(forma[çc][ãa]o|educa[çc][ãa]o|escolaridade|gradua[çc][ãa]o)/i,
  },
  {
    title: "HABILIDADES",
    pattern: /^(habilidades|compet[êe]ncias|skills|conhecimentos|tecnologias)/i,
  },
  {
    title: "CERTIFICAÇÕES E IDIOMAS",
    pattern: /^(certifica|cursos|idiomas|licen[çc]as?)/i,
  },
  { title: "PROJETOS", pattern: /^(projetos|portf[óo]lio)/i },
];

const ORDER = [
  "RESUMO PROFISSIONAL",
  "EXPERIÊNCIA PROFISSIONAL",
  "PROJETOS",
  "FORMAÇÃO ACADÊMICA",
  "HABILIDADES",
  "CERTIFICAÇÕES E IDIOMAS",
  "INFORMAÇÕES ADICIONAIS",
];

function isHeading(line: string) {
  const clean = line.trim().replace(/[:•\-–]+$/, "");
  if (!clean || clean.length > 45) return null;
  const match = HEADING_MAP.find((h) => h.pattern.test(clean));
  return match ? match.title : null;
}

function normalizeBullet(line: string) {
  const trimmed = line.trim();
  if (/^[-•*·]\s*/.test(trimmed)) return `• ${trimmed.replace(/^[-•*·]\s*/, "")}`;
  return trimmed;
}

export type BuiltResume = {
  name: string;
  contact: string[];
  sections: ResumeSection[];
  /** Palavras-chave da vaga ainda ausentes — sugestões, nunca inseridas automaticamente. */
  suggestions: string[];
  text: string;
};

export function buildAdjustedResume(
  resume: string,
  missingKeywords: string[],
  foundKeywords: string[],
): BuiltResume {
  const rawLines = resume
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/g, ""))
    .filter((l, i, arr) => !(l.trim() === "" && arr[i - 1]?.trim() === ""));

  const name = rawLines.find((l) => l.trim())?.trim() ?? "";
  const contact: string[] = [];
  const sections: ResumeSection[] = [];
  let current: ResumeSection | null = null;
  let seenSection = false;

  rawLines.slice(1).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const heading = isHeading(trimmed);
    if (heading) {
      seenSection = true;
      current = sections.find((s) => s.title === heading) ?? null;
      if (!current) {
        current = { title: heading, lines: [] };
        sections.push(current);
      }
      return;
    }

    const looksLikeContact =
      /@|linkedin|github|\(\d{2}\)|\+55|\b\d{4,5}-\d{4}\b|^[\wÀ-ú\s]+,\s?[A-Z]{2}$/.test(trimmed);

    if (!seenSection && looksLikeContact) {
      trimmed
        .split(/\s*[|•]\s*/)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => contact.push(p));
      return;
    }

    if (!current) {
      current = { title: "INFORMAÇÕES ADICIONAIS", lines: [] };
      sections.push(current);
    }
    current.lines.push(normalizeBullet(trimmed));
  });

  // Garante uma seção de habilidades com as palavras-chave já presentes no currículo.
  if (foundKeywords.length) {
    const skills = sections.find((s) => s.title === "HABILIDADES");
    const line = foundKeywords
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(" · ");
    if (skills) {
      if (!skills.lines.length) skills.lines.push(line);
    } else {
      sections.push({ title: "HABILIDADES", lines: [line] });
    }
  }

  sections.sort((a, b) => ORDER.indexOf(a.title) - ORDER.indexOf(b.title));

  const text = [
    name,
    contact.join(" | "),
    "",
    ...sections.flatMap((s) => [s.title, ...s.lines, ""]),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { name, contact, sections, suggestions: missingKeywords, text };
}

export function downloadTxt(built: BuiltResume) {
  const blob = new Blob([built.text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, fileName(built.name, "txt"));
}

export async function downloadPdf(built: BuiltResume) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginX = 20;
  const marginTop = 20;
  const marginBottom = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;
  let y = marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const write = (
    text: string,
    opts: { size: number; style?: "normal" | "bold"; indent?: number; gap?: number },
  ) => {
    doc.setFont("helvetica", opts.style ?? "normal");
    doc.setFontSize(opts.size);
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(text, usableWidth - indent) as string[];
    const lineHeight = opts.size * 0.52;
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    });
    y += opts.gap ?? 0;
  };

  if (built.name) write(built.name, { size: 18, style: "bold", gap: 1 });
  if (built.contact.length) write(built.contact.join(" | "), { size: 10, gap: 2 });

  built.sections.forEach((section) => {
    ensureSpace(14);
    y += 3;
    write(section.title, { size: 11.5, style: "bold", gap: 1 });
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(marginX, y - 1.5, pageWidth - marginX, y - 1.5);
    y += 1.5;
    section.lines.forEach((line) => {
      const bullet = line.startsWith("• ");
      write(bullet ? line.replace("• ", "\u2022 ") : line, {
        size: 10.5,
        style: bullet ? "normal" : "normal",
        indent: bullet ? 3 : 0,
        gap: 0.8,
      });
    });
  });

  doc.save(fileName(built.name, "pdf"));
}

function fileName(name: string, ext: string) {
  const slug =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "curriculo";
  return `curriculo-ats-${slug}.${ext}`;
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
