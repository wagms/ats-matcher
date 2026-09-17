// Análise ATS local (sem backend): comparação de palavras-chave, estrutura e recomendações.

export type KeywordCategory = "tecnica" | "ferramenta" | "soft";

export type Keyword = {
  term: string;
  category: KeywordCategory;
  found: boolean;
  occurrences: number;
};

export type SectionCheck = {
  name: string;
  found: boolean;
  hint: string;
};

export type Analysis = {
  score: number;
  keywordScore: number;
  structureScore: number;
  densityScore: number;
  keywords: Keyword[];
  found: Keyword[];
  missing: Keyword[];
  sections: SectionCheck[];
  recommendations: string[];
  rewrites: { before: string; after: string }[];
  words: number;
};

const TECH_TERMS = [
  "javascript","typescript","react","next.js","vue","angular","node.js","html","css","sass","tailwind",
  "graphql","rest","api","sql","postgresql","mysql","mongodb","python","java","c#",".net","php","ruby",
  "docker","kubernetes","aws","azure","gcp","ci/cd","testes unitários","jest","cypress","git","redux",
  "acessibilidade","performance","responsivo","design system","seo","microfrontend","react native",
  "ux","ui","wireframe","prototipagem","design thinking","pesquisa com usuários","usabilidade",
  "arquitetura da informação","design responsivo","teste a/b","métricas","kpi","scrum","kanban","agile",
];

const TOOL_TERMS = [
  "figma","sketch","adobe xd","photoshop","illustrator","miro","notion","jira","confluence","trello",
  "github","gitlab","bitbucket","storybook","vs code","postman","hotjar","google analytics","mixpanel",
  "maze","zeplin","webpack","vite","npm","yarn","slack","asana","looker","power bi","excel",
];

const SOFT_TERMS = [
  "comunicação","liderança","trabalho em equipe","colaboração","proatividade","organização",
  "resolução de problemas","pensamento crítico","adaptabilidade","autonomia","empatia","mentoria",
  "negociação","gestão de tempo","atenção aos detalhes","inglês","espanhol","apresentação",
  "storytelling","foco no cliente","pensamento analítico",
];

const SECTIONS: { name: string; patterns: RegExp; hint: string }[] = [
  {
    name: "Contato",
    patterns:
      /(contato|e-?mail|telefone|linkedin|celular|@[\w.-]+\.\w{2,}|\(\d{2}\)\s?\d)/i,
    hint: "Inclua e-mail, telefone e LinkedIn no topo do currículo.",
  },
  {
    name: "Resumo",
    patterns: /(resumo|perfil profissional|objetivo|sobre mim|summary)/i,
    hint: "Adicione um resumo de 3 linhas com cargo-alvo e principais resultados.",
  },
  {
    name: "Experiência",
    patterns: /(experi[êe]ncia|hist[óo]rico profissional|trajet[óo]ria|atua[çc][ãa]o profissional)/i,
    hint: "Crie a seção 'Experiência Profissional' com empresa, cargo e período.",
  },
  {
    name: "Educação",
    patterns: /(forma[çc][ãa]o|educa[çc][ãa]o|escolaridade|gradua[çc][ãa]o|bacharel|tecn[óo]logo)/i,
    hint: "Inclua 'Formação Acadêmica' com curso, instituição e ano de conclusão.",
  },
  {
    name: "Habilidades",
    patterns: /(habilidades|compet[êe]ncias|skills|conhecimentos t[ée]cnicos|tecnologias)/i,
    hint: "Liste uma seção 'Habilidades' com as tecnologias e ferramentas da vaga.",
  },
  {
    name: "Certificações / Cursos",
    patterns: /(certifica|cursos|idiomas|licen[çc]a)/i,
    hint: "Cursos e certificações relevantes reforçam palavras-chave do ATS.",
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function countOccurrences(haystack: string, term: string) {
  const t = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`, "g");
  return (haystack.match(re) || []).length;
}

export function analyze(resume: string, job: string): Analysis {
  const nResume = normalize(resume);
  const nJob = normalize(job);
  const words = resume.trim() ? resume.trim().split(/\s+/).length : 0;

  const dictionary: { term: string; category: KeywordCategory }[] = [
    ...TECH_TERMS.map((term) => ({ term, category: "tecnica" as KeywordCategory })),
    ...TOOL_TERMS.map((term) => ({ term, category: "ferramenta" as KeywordCategory })),
    ...SOFT_TERMS.map((term) => ({ term, category: "soft" as KeywordCategory })),
  ];

  const keywords: Keyword[] = dictionary
    .filter((d) => countOccurrences(nJob, d.term) > 0)
    .map((d) => {
      const occurrences = countOccurrences(nResume, d.term);
      return { term: d.term, category: d.category, found: occurrences > 0, occurrences };
    });

  const found = keywords.filter((k) => k.found);
  const missing = keywords.filter((k) => !k.found);

  const keywordScore = keywords.length
    ? Math.round((found.length / keywords.length) * 100)
    : 0;

  const sections = SECTIONS.map((s) => ({
    name: s.name,
    found: s.patterns.test(resume),
    hint: s.hint,
  }));
  const structureScore = Math.round(
    (sections.filter((s) => s.found).length / sections.length) * 100,
  );

  // Densidade/legibilidade: currículos entre 300 e 900 palavras performam melhor em ATS.
  let densityScore = 100;
  if (words < 120) densityScore = 35;
  else if (words < 250) densityScore = 65;
  else if (words > 1200) densityScore = 70;
  const hasNumbers = /\d+\s?%|\bR\$|\d+\s?(mil|milh|clientes|usu[áa]rios|projetos)/i.test(resume);
  if (!hasNumbers) densityScore -= 15;
  densityScore = Math.max(0, Math.min(100, densityScore));

  const score =
    !resume.trim() || !job.trim()
      ? 0
      : Math.round(keywordScore * 0.6 + structureScore * 0.25 + densityScore * 0.15);

  const recommendations: string[] = [];
  const topMissing = missing.slice(0, 6).map((m) => m.term);
  if (topMissing.length) {
    recommendations.push(
      `Inclua naturalmente estas palavras-chave da vaga: ${topMissing.join(", ")}.`,
    );
  }
  sections.filter((s) => !s.found).forEach((s) => recommendations.push(s.hint));
  if (!hasNumbers) {
    recommendations.push(
      "Quantifique resultados (%, valores, número de usuários) em cada experiência.",
    );
  }
  if (words < 250) {
    recommendations.push(
      "Seu currículo está curto: detalhe responsabilidades e entregas de cada cargo.",
    );
  }
  if (words > 1200) {
    recommendations.push("Reduza o texto: mantenha 1 a 2 páginas com foco nos últimos 10 anos.");
  }
  if (found.some((k) => k.occurrences > 6)) {
    recommendations.push(
      "Evite repetir o mesmo termo em excesso; distribua-o entre resumo, experiências e habilidades.",
    );
  }
  recommendations.push(
    "Envie em .docx ou PDF com texto selecionável, sem tabelas, colunas, ícones ou imagens.",
  );
  recommendations.push(
    "Use o título exato da vaga no seu resumo profissional para melhorar a correspondência.",
  );

  const rewrites = [
    {
      before: "Responsável pelo desenvolvimento de telas do sistema.",
      after: `Desenvolvi ${
        topMissing[0] ? `interfaces em ${topMissing[0]}` : "interfaces reutilizáveis"
      } para 12 telas críticas, reduzindo o tempo de carregamento em 35%.`,
    },
    {
      before: "Trabalhei em equipe com outros times.",
      after:
        "Colaborei com times de Produto e Design em ritual semanal de Scrum, entregando 4 releases por mês sem retrabalho.",
    },
    {
      before: "Conhecimento em diversas ferramentas.",
      after: `Habilidades: ${(found.slice(0, 4).map((k) => k.term).join(", ") ||
        "React, TypeScript, Figma")}${topMissing[1] ? `, ${topMissing[1]}` : ""}.`,
    },
  ];

  return {
    score,
    keywordScore,
    structureScore,
    densityScore,
    keywords,
    found,
    missing,
    sections,
    recommendations,
    rewrites,
    words,
  };
}

export const SAMPLES = {
  frontend: {
    label: "Desenvolvedor Front-end",
    resume: `João Almeida
São Paulo, SP | joao.almeida@email.com | (11) 98888-1234 | linkedin.com/in/joaoalmeida

Resumo Profissional
Desenvolvedor Front-end com 5 anos de experiência em aplicações React e TypeScript, focado em performance e acessibilidade.

Experiência Profissional
Desenvolvedor Front-end Sênior — Fintech Nova (2022 - atual)
- Desenvolvi interfaces em React e TypeScript para o app de investimentos com 400 mil usuários.
- Reduzi o tempo de carregamento em 38% otimizando bundle com Vite e code splitting.
- Implementei design system com Storybook, adotado por 3 squads.

Desenvolvedor Front-end — Agência Pixel (2019 - 2022)
- Criei sites responsivos com HTML, CSS e JavaScript para 20 clientes.
- Integrei APIs REST e GraphQL e escrevi testes com Jest.

Formação Acadêmica
Bacharelado em Ciência da Computação — Universidade Mackenzie, 2019

Habilidades
React, TypeScript, JavaScript, HTML, CSS, Tailwind, Git, Jest, Vite, comunicação, trabalho em equipe`,
    job: `Vaga: Desenvolvedor(a) Front-end Sênior

Buscamos profissional com sólida experiência em React, TypeScript e Next.js para evoluir nosso design system.

Requisitos:
- React, TypeScript, Next.js, HTML, CSS e Tailwind
- Consumo de APIs REST e GraphQL
- Testes unitários com Jest e Cypress
- Acessibilidade, performance e design responsivo
- Versionamento com Git e GitHub, CI/CD
- Vivência com Storybook e design system
- Metodologias ágeis (Scrum)

Desejável: Docker, AWS, React Native

Soft skills: comunicação, colaboração, autonomia, resolução de problemas, inglês intermediário`,
  },
  designer: {
    label: "Product Designer",
    resume: `Marina Costa
Rio de Janeiro, RJ | marina.costa@email.com | (21) 97777-4321 | linkedin.com/in/marinacosta

Perfil Profissional
Product Designer com 6 anos de atuação em produtos digitais B2B, de pesquisa com usuários à entrega em design system.

Experiência Profissional
Product Designer — SaaS Cloud (2021 - atual)
- Conduzi pesquisa com usuários e testes de usabilidade que elevaram a conversão do onboarding em 27%.
- Criei protótipos no Figma e documentei componentes do design system.
- Acompanhei métricas e KPI de produto junto ao time de dados.

Designer de Produto — Startup Vento (2018 - 2021)
- Redesenhei o fluxo de checkout, reduzindo abandono em 19%.
- Trabalhei com wireframe, prototipagem e teste A/B.

Formação Acadêmica
Bacharelado em Design — PUC-Rio, 2018

Habilidades
Figma, prototipagem, pesquisa com usuários, usabilidade, design system, comunicação, colaboração`,
    job: `Vaga: Product Designer (Sênior)

Você vai atuar na descoberta e entrega de soluções para nosso produto de gestão financeira.

Requisitos:
- Experiência com UX e UI em produtos digitais
- Pesquisa com usuários, usabilidade e teste A/B
- Wireframe, prototipagem e design system
- Arquitetura da informação e design responsivo
- Domínio de Figma; desejável Miro e Maze
- Leitura de métricas, KPI e ferramentas como Google Analytics ou Mixpanel
- Rotina em Scrum e Jira

Soft skills: comunicação, storytelling, colaboração, pensamento analítico, foco no cliente, mentoria`,
  },
} as const;
