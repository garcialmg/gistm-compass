// Popula um cenário de demonstração realista nas 3 instalações:
// - Barragem Norte: base documental completa; um revisor humano avalia os 77
//   requisitos, concordando com a IA nos casos claros e confirmando
//   conformidade em boa parte dos demais (com uma dúzia de gaps reais
//   mantidos de propósito) — estrutura "madura, com plano de ação ativo".
// - Barragem Sul: subconjunto de documentos, ~metade dos requisitos revisados,
//   mistura mais equilibrada — estrutura "em andamento".
// - Pilha de Rejeitos Leste: intocada — estrutura "ainda não iniciada".
//
// A sugestão da IA (campos ai*) sempre reflete a leitura real e determinística
// do simulador; a decisão final (campos final*) simula a revisão humana, que
// pode confirmar, ajustar ou (com mais frequência que a IA sozinha) validar
// conformidade total quando a evidência documental de fato cobre o tema —
// exatamente o "humano sempre decide por último" que a plataforma promete.

import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "../src/lib/text-extraction.ts";
import { simulateAiReading } from "../src/lib/ai-simulator.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "..", "..", "Documentos de Teste GISTM");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const prisma = new PrismaClient();

const SUL_SUBSET = [
  { file: "Plano de Acao de Emergencia (PAE).docx", type: "Plano de ação", area: "Segurança" },
  { file: "Matriz de Risco da Estrutura de Disposicao de Rejeitos.xlsx", type: "Matriz de risco", area: "Geotecnia" },
  { file: "Planilha de Leituras de Instrumentacao Geotecnica.xlsx", type: "Registro de monitoramento", area: "Geotecnia" },
  { file: "Carta de Nomeacao e Relatorio Anual do Engenheiro de Registro.docx", type: "Outro", area: "Engenharia" },
  { file: "Politica Corporativa de Gestao de Rejeitos e Barragens.docx", type: "Política corporativa", area: "Diretoria" },
  { file: "Relatorio de Revisao Tecnica Independente (ITRB).docx", type: "Relatório técnico", area: "Governança" },
];

const PROFILES = {
  ATENDE_TOTALMENTE: {
    robustness: "ROBUSTA",
    criticality: "NAO_SE_APLICA",
    infoSufficiency: "SUFICIENTE",
    justification: (req) =>
      `Revisão técnica confirma que a documentação disponível evidencia de forma consistente o atendimento ao requisito "${req.title}". Nenhuma pendência identificada neste ciclo.`,
  },
  ATENDE_PARCIALMENTE: {
    robustness: "PARCIAL",
    criticality: "MEDIA",
    infoSufficiency: "SUFICIENTE",
    justification: (req) =>
      `A documentação atual cobre parte do requisito "${req.title}", mas o revisor técnico identificou lacunas que precisam ser endereçadas antes do próximo ciclo. Ação corretiva registrada.`,
  },
  NAO_ATENDE: {
    robustness: "AUSENTE",
    criticality: "ALTA",
    infoSufficiency: "INSUFICIENTE",
    justification: (req) =>
      `Não foi localizada evidência documental suficiente para o requisito "${req.title}" neste ciclo. Gap priorizado no plano de ação.`,
  },
};

/** Padrão determinístico: ~79% totalmente, ~11% parcialmente, ~10% não atende. */
function maturePattern(i) {
  if (i % 10 === 0) return "NAO_ATENDE";
  if (i % 9 === 0) return "ATENDE_PARCIALMENTE";
  return "ATENDE_TOTALMENTE";
}

/** Padrão mais equilibrado, para uma instalação "em andamento". */
function partialPattern(i) {
  if (i % 6 === 0) return "NAO_ATENDE";
  if (i % 3 === 0) return "ATENDE_PARCIALMENTE";
  return "ATENDE_TOTALMENTE";
}

async function applyDemoAssessment(requirement, documents, installationId, cycleId, index, pattern, validate) {
  const suggestion = simulateAiReading(requirement, documents);

  await prisma.evidence.deleteMany({ where: { requirementId: requirement.id, aiGenerated: true } });
  if (suggestion.evidences.length > 0) {
    await prisma.evidence.createMany({
      data: suggestion.evidences.map((e) => ({
        requirementId: requirement.id,
        documentId: e.documentId,
        excerpt: e.excerpt,
        aiGenerated: true,
      })),
    });
  }

  const existing = await prisma.assessment.findUnique({
    where: { requirementId_installationId_cycleId: { requirementId: requirement.id, installationId, cycleId } },
  });
  const assessment = existing
    ? existing
    : await prisma.assessment.create({ data: { requirementId: requirement.id, installationId, cycleId } });

  const data = {
    aiClassification: suggestion.classification,
    aiRobustness: suggestion.robustness,
    aiCriticality: suggestion.criticality,
    aiInfoSufficiency: suggestion.infoSufficiency,
    aiJustification: suggestion.justification,
    aiConfidence: suggestion.confidence,
    status: "EM_REVISAO",
  };

  let finalClassification = null;
  if (validate) {
    finalClassification = pattern(index);
    const profile = PROFILES[finalClassification];
    data.finalClassification = finalClassification;
    data.finalRobustness = profile.robustness;
    data.finalCriticality = profile.criticality;
    data.finalInfoSufficiency = profile.infoSufficiency;
    data.finalJustification = profile.justification(requirement);
    data.status = "VALIDADO";
    data.reviewedBy = "Equipe Técnica (demonstração)";
    data.reviewedAt = new Date();
  }

  await prisma.assessment.update({ where: { id: assessment.id }, data });

  await prisma.auditLog.create({
    data: {
      assessmentId: assessment.id,
      actor: validate ? "Equipe Técnica (demonstração)" : "IA (simulada)",
      action: validate ? "AVALIACAO_VALIDADA" : "SUGESTAO_IA_GERADA",
      note: `Classificação: ${validate ? finalClassification : suggestion.classification}.`,
    },
  });

  return { assessmentId: assessment.id, finalClassification };
}

async function createDemoActions(gaps, installationId) {
  const templates = [
    {
      description: "Atualizar estudo de ruptura hipotética e revisar zoneamento da Zona de Autossalvamento.",
      responsible: "Eng. Camila Rocha",
      area: "Geotecnia",
      priority: "ALTA",
      status: "EM_ANDAMENTO",
      dueOffsetDays: -5,
    },
    {
      description: "Recalibrar piezômetros com calibração vencida e atualizar registro de manutenção.",
      responsible: "Equipe de Instrumentação",
      area: "Geotecnia",
      priority: "ALTA",
      status: "ABERTA",
      dueOffsetDays: 10,
    },
    {
      description: "Formalizar plano de treinamento anual da brigada de emergência para o próximo ciclo.",
      responsible: "Segurança do Trabalho",
      area: "Segurança",
      priority: "MEDIA",
      status: "ABERTA",
      dueOffsetDays: 30,
    },
    {
      description: "Revisar e republicar a política de canal de denúncias com nova identidade visual.",
      responsible: "Compliance",
      area: "Governança",
      priority: "BAIXA",
      status: "CONCLUIDA",
      dueOffsetDays: -20,
      closureEvidence: "Política revisada publicada no portal interno em 05/06/2026, com ata de aprovação da diretoria.",
    },
  ];

  const now = Date.now();
  for (let i = 0; i < templates.length && i < gaps.length; i++) {
    const t = templates[i];
    await prisma.action.create({
      data: {
        assessmentId: gaps[i].assessmentId,
        description: t.description,
        responsible: t.responsible,
        area: t.area,
        priority: t.priority,
        status: t.status,
        dueDate: new Date(now + t.dueOffsetDays * 86400000),
        closureEvidence: t.closureEvidence ?? null,
      },
    });
  }
}

async function main() {
  const requirements = await prisma.requirement.findMany();

  // --- Barragem Norte: 17 documentos, revisão completa (padrão maduro) ---
  const norte = await prisma.installation.findFirstOrThrow({ where: { name: { contains: "Barragem Norte" } } });
  const norteCycle = await prisma.cycle.findFirstOrThrow({ where: { installationId: norte.id }, orderBy: { startedAt: "desc" } });
  const norteDocs = await prisma.documentFile.findMany({ where: { installationId: norte.id } });
  console.log(`Barragem Norte: ${norteDocs.length} documento(s), revisando os 77 requisitos...`);
  const norteGaps = [];
  for (let i = 0; i < requirements.length; i++) {
    const result = await applyDemoAssessment(requirements[i], norteDocs, norte.id, norteCycle.id, i, maturePattern, true);
    if (result.finalClassification && result.finalClassification !== "ATENDE_TOTALMENTE") {
      norteGaps.push(result);
    }
  }
  await createDemoActions(norteGaps, norte.id);
  console.log(`  -> ${norteGaps.length} gap(s), ${Math.min(4, norteGaps.length)} ação(ões) criada(s).`);

  // --- Barragem Sul: subconjunto de documentos, revisão parcial ---
  const sul = await prisma.installation.findFirstOrThrow({ where: { name: { contains: "Barragem Sul" } } });
  const sulCycle = await prisma.cycle.findFirstOrThrow({ where: { installationId: sul.id }, orderBy: { startedAt: "desc" } });
  const existingSulDocs = await prisma.documentFile.count({ where: { installationId: sul.id } });
  if (existingSulDocs === 0) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    for (const { file, type, area } of SUL_SUBSET) {
      const buffer = await readFile(path.join(SOURCE_DIR, file));
      const ext = path.extname(file);
      const storedFileName = `${randomUUID()}${ext}`;
      await writeFile(path.join(UPLOAD_DIR, storedFileName), buffer);
      const extractedText = await extractText(buffer, ext);
      await prisma.documentFile.create({
        data: {
          title: file.replace(ext, ""),
          type,
          areaResponsible: area,
          confidentiality: "INTERNO",
          fileName: file,
          filePath: storedFileName,
          mimeType:
            ext === ".docx"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          extractedText,
          installationId: sul.id,
        },
      });
    }
  }
  const sulDocs = await prisma.documentFile.findMany({ where: { installationId: sul.id } });
  console.log(`Barragem Sul: ${sulDocs.length} documento(s), revisando ~metade dos 77...`);
  const sulGaps = [];
  for (let i = 0; i < requirements.length; i++) {
    const validate = i % 2 === 0;
    const result = await applyDemoAssessment(requirements[i], sulDocs, sul.id, sulCycle.id, i, partialPattern, validate);
    if (validate && result.finalClassification !== "ATENDE_TOTALMENTE") sulGaps.push(result);
  }
  console.log(`  -> ${sulGaps.length} gap(s) identificado(s) até o momento.`);

  // --- Pilha de Rejeitos Leste: intocada de propósito ---
  console.log("Pilha de Rejeitos Leste: mantida sem avaliação (estrutura recém-cadastrada).");

  console.log("\nCenário de demonstração populado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
