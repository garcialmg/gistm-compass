"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getInstallationContext, assertInstallationOwnership } from "@/lib/context";
import { getOrCreateAssessment } from "@/lib/assessments";
import { simulateAiReading } from "@/lib/ai-simulator";
import { generateRealAiAssessment } from "@/lib/ai-evidence";
import type {
  DocumentFile,
  EvidenceRobustness,
  FinalClassification,
  GapCriticality,
  InfoSufficiency,
  Requirement,
} from "@prisma/client";

async function assertAssessmentBelongsToInstallation(installationId: string, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.installationId !== installationId) {
    throw new Error("Avaliação não encontrada nesta instalação.");
  }
}

function revalidateRequirement(installationId: string, requirementId: string) {
  revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
  revalidatePath(`/instalacoes/${installationId}/requisitos`);
  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath("/instalacoes");
}

async function applyAiSuggestion(
  requirement: Pick<Requirement, "id" | "code" | "title" | "description" | "expectedEvidence">,
  documents: Pick<DocumentFile, "id" | "title" | "extractedText">[],
  installationId: string,
  cycleId: string,
  useRealAi: boolean
) {
  const assessment = await getOrCreateAssessment(requirement.id, installationId, cycleId);
  const suggestion = simulateAiReading(requirement, documents);

  // A heurística determinística é sempre calculada primeiro — é o fallback
  // garantido. Quando pedido, a Claude de verdade decide a classificação
  // inteira (não só o texto) com base no conteúdo real dos documentos; se a
  // chamada falhar por qualquer motivo, fica valendo a sugestão heurística
  // sem quebrar o fluxo de avaliação.
  let classification = suggestion.classification;
  let robustness = suggestion.robustness;
  let criticality = suggestion.criticality;
  let infoSufficiency = suggestion.infoSufficiency;
  let confidence = suggestion.confidence;
  let justification = suggestion.justification;
  let evidences = suggestion.evidences;
  let usedRealAi = false;

  if (useRealAi) {
    // Se houver uma análise externa (Gap Analysis de consultoria) importada
    // para este requisito nesta instalação, passa como referência para a IA
    // ponderar — ver ExternalAnalysis / seed-metalkol-gap-analysis.mjs.
    const prior = await prisma.externalAnalysis.findFirst({
      where: { installationId, requirementId: requirement.id },
      orderBy: { updatedAt: "desc" },
      select: { content: true },
    });
    const real = await generateRealAiAssessment(requirement, installationId, prior?.content ?? null);
    if (real) {
      classification = real.classification;
      robustness = real.robustness;
      criticality = real.criticality;
      infoSufficiency = real.infoSufficiency;
      confidence = real.confidence;
      justification = real.justification;
      evidences = real.evidences.length > 0 ? real.evidences : suggestion.evidences;
      usedRealAi = true;
    }
  }

  // Remove sugestões anteriores da IA apenas desta instalação (mantém
  // evidências anexadas manualmente por um revisor humano) e recria a partir
  // da nova leitura. Escopo por document.installationId evita apagar
  // evidências de outras estruturas/orgs no mesmo requisito.
  await prisma.evidence.deleteMany({
    where: {
      requirementId: requirement.id,
      aiGenerated: true,
      document: { installationId },
    },
  });
  if (evidences.length > 0) {
    await prisma.evidence.createMany({
      data: evidences.map((e) => ({
        requirementId: requirement.id,
        documentId: e.documentId,
        excerpt: e.excerpt,
        aiGenerated: true,
      })),
    });
  }

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      aiClassification: classification,
      aiRobustness: robustness,
      aiCriticality: criticality,
      aiInfoSufficiency: infoSufficiency,
      aiJustification: justification,
      aiConfidence: confidence,
      status: assessment.status === "VALIDADO" ? "VALIDADO" : "EM_REVISAO",
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId: assessment.id,
      actor: usedRealAi ? "IA (Claude)" : "IA (simulada)",
      action: "SUGESTAO_IA_GERADA",
      note: `Classificação sugerida: ${classification}. Confiança: ${Math.round(
        confidence * 100
      )}%.`,
    },
  });
}

export async function runAiSimulation(installationId: string, requirementId: string) {
  const { installation, cycle } = await getInstallationContext(installationId);

  const requirement = await prisma.requirement.findUniqueOrThrow({
    where: { id: requirementId },
  });
  const documents = await prisma.documentFile.findMany({
    where: { installationId: installation.id },
  });

  await applyAiSuggestion(requirement, documents, installation.id, cycle.id, true);

  revalidateRequirement(installation.id, requirementId);
}

export async function runAiSimulationForAll(installationId: string) {
  const { installation, cycle, isLatestCycle } = await getInstallationContext(installationId);
  if (!isLatestCycle) {
    throw new Error("Não é possível rodar a IA em um ciclo encerrado.");
  }

  const [requirements, documents] = await Promise.all([
    prisma.requirement.findMany(),
    prisma.documentFile.findMany({ where: { installationId: installation.id } }),
  ]);

  for (const requirement of requirements) {
    await applyAiSuggestion(requirement, documents, installation.id, cycle.id, false);
  }

  revalidatePath(`/instalacoes/${installation.id}/requisitos`);
  revalidatePath(`/instalacoes/${installation.id}/dashboard`);
  revalidatePath("/instalacoes");
}

export async function validateAssessment(formData: FormData) {
  const installationId = String(formData.get("installationId"));
  const assessmentId = String(formData.get("assessmentId"));
  const requirementId = String(formData.get("requirementId"));
  const themeId = String(formData.get("themeId") ?? "");
  const finalClassification = String(formData.get("finalClassification")) as FinalClassification;
  const finalRobustness = String(formData.get("finalRobustness")) as EvidenceRobustness;
  const finalCriticality = String(formData.get("finalCriticality")) as GapCriticality;
  const finalInfoSufficiency = String(formData.get("finalInfoSufficiency")) as InfoSufficiency;
  const finalJustification = String(formData.get("finalJustification") ?? "").trim();
  const reviewedBy = String(formData.get("reviewedBy") ?? "").trim() || "Revisor técnico";
  const saveAsTemplate = formData.get("saveAsTemplate") === "on";
  const templateTitle = String(formData.get("templateTitle") ?? "").trim();

  if (!finalJustification) {
    throw new Error("A justificativa técnica final é obrigatória para validar a avaliação.");
  }

  await assertInstallationOwnership(installationId);
  await assertAssessmentBelongsToInstallation(installationId, assessmentId);

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      finalClassification,
      finalRobustness,
      finalCriticality,
      finalInfoSufficiency,
      finalJustification,
      status: "VALIDADO",
      reviewedBy,
      reviewedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId,
      actor: reviewedBy,
      action: "AVALIACAO_VALIDADA",
      note: `Classificação final: ${finalClassification}.`,
    },
  });

  // Snapshot estruturado da decisão (versionamento de decisões, não só o
  // log textual) — permite comparar exatamente o que mudou entre validações.
  const lastRevision = await prisma.assessmentRevision.findFirst({
    where: { assessmentId },
    orderBy: { version: "desc" },
  });
  await prisma.assessmentRevision.create({
    data: {
      assessmentId,
      version: (lastRevision?.version ?? 0) + 1,
      finalClassification,
      finalRobustness,
      finalCriticality,
      finalInfoSufficiency,
      finalJustification,
      reviewedBy,
    },
  });

  if (saveAsTemplate && themeId) {
    const { installation } = await assertInstallationOwnership(installationId);
    await prisma.justificationTemplate.create({
      data: {
        themeId,
        organizationId: installation.organizationId,
        title: templateTitle || `Modelo — ${finalClassification}`,
        text: finalJustification,
        createdBy: reviewedBy,
      },
    });
  }

  revalidateRequirement(installationId, requirementId);
}

export async function addComment(formData: FormData) {
  const installationId = String(formData.get("installationId"));
  const assessmentId = String(formData.get("assessmentId"));
  const requirementId = String(formData.get("requirementId"));
  const author = String(formData.get("author") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!author) throw new Error("Informe seu nome para comentar.");
  if (!text) throw new Error("Escreva um comentário.");

  await assertInstallationOwnership(installationId);
  await assertAssessmentBelongsToInstallation(installationId, assessmentId);

  await prisma.comment.create({ data: { assessmentId, author, text } });

  revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
}


export async function addManualEvidence(formData: FormData) {
  const installationId = String(formData.get("installationId"));
  const requirementId = String(formData.get("requirementId"));
  const documentId = String(formData.get("documentId"));
  const excerpt = String(formData.get("excerpt") ?? "").trim();

  if (!documentId) throw new Error("Selecione um documento.");
  if (!excerpt) throw new Error("Descreva o trecho de evidência.");

  await assertInstallationOwnership(installationId);
  const document = await prisma.documentFile.findUnique({ where: { id: documentId } });
  if (!document || document.installationId !== installationId) {
    throw new Error("Documento não encontrado nesta instalação.");
  }

  await prisma.evidence.create({
    data: { requirementId, documentId, excerpt, aiGenerated: false },
  });

  revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
}

export async function removeEvidence(
  installationId: string,
  requirementId: string,
  evidenceId: string
) {
  await assertInstallationOwnership(installationId);
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { document: true },
  });
  if (!evidence || evidence.document.installationId !== installationId) {
    throw new Error("Evidência não encontrada nesta instalação.");
  }

  await prisma.evidence.delete({ where: { id: evidenceId } });
  revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
}
