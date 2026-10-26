import { addDays, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { STATUS_COLORS, type DistributionSegment, type RankedBarItem } from "@/components/charts";
import { computeReadinessScore } from "@/lib/readiness-score";
import { complianceColor } from "@/lib/compliance-color";
import { maturityLabel } from "@/lib/maturity";
import type { EvidenceRobustness, FinalClassification, GapCriticality } from "@prisma/client";

export interface GapItem {
  id: string;
  code: string;
  title: string;
  classification: FinalClassification;
  robustness: EvidenceRobustness | null;
  criticality: GapCriticality | null;
}

export interface WheelTheme {
  id: string;
  number: number;
  name: string;
  principleNumber: number;
  principleName: string;
  value: number; // % atendimento, 0-100
  validatedCount: number;
  requirementCount: number;
}

export async function computeInstallationReport(
  installationId: string,
  cycleId?: string,
  lang: "pt" | "en" = "pt"
) {
  const { installation, cycle, allCycles, isLatestCycle } = await getInstallationContext(
    installationId,
    cycleId
  );

  const [totalRequirements, assessments, principles, actions, documentsCount, allDocuments] =
    await Promise.all([
      prisma.requirement.count(),
      prisma.assessment.findMany({
        where: { installationId: installation.id, cycleId: cycle.id },
        include: { requirement: { include: { theme: { include: { principle: true } } } } },
      }),
      prisma.principle.findMany({
        orderBy: { number: "asc" },
        include: { themes: { orderBy: { number: "asc" }, include: { requirements: true } } },
      }),
      prisma.action.findMany({
        where: { assessment: { installationId: installation.id, cycleId: cycle.id } },
      }),
      prisma.documentFile.count({ where: { installationId: installation.id } }),
      prisma.documentFile.findMany({ where: { installationId: installation.id } }),
    ]);

  const pick = (pt: string, en: string | null | undefined) => (lang === "en" ? en ?? pt : pt);

  const validated = assessments.filter((a) => a.status === "VALIDADO");
  const pendingReview = totalRequirements - validated.length;

  const countBy = (cls: string) => validated.filter((a) => a.finalClassification === cls).length;
  const totalmente = countBy("ATENDE_TOTALMENTE");
  const parcialmente = countBy("ATENDE_PARCIALMENTE");
  const naoAtende = countBy("NAO_ATENDE");
  const naoSeAplica = countBy("NAO_SE_APLICA");

  const applicable = validated.length - naoSeAplica;
  const overallCompliance = applicable > 0 ? Math.round((totalmente / applicable) * 100) : null;

  const distributionSegments: DistributionSegment[] = [
    { key: "total", label: "Atende totalmente", value: totalmente, color: STATUS_COLORS.good },
    { key: "parcial", label: "Atende parcialmente", value: parcialmente, color: STATUS_COLORS.warning },
    { key: "nao", label: "Não atende", value: naoAtende, color: STATUS_COLORS.critical },
    { key: "na", label: "Não se aplica", value: naoSeAplica, color: STATUS_COLORS.muted },
  ];

  const principleBars: RankedBarItem[] = principles.map((p) => {
    const reqIds = new Set(p.themes.flatMap((t) => t.requirements.map((r) => r.id)));
    const pAssessments = validated.filter((a) => reqIds.has(a.requirementId));
    const pApplicable = pAssessments.filter((a) => a.finalClassification !== "NAO_SE_APLICA");
    const pCompliant = pAssessments.filter((a) => a.finalClassification === "ATENDE_TOTALMENTE");
    const pct = pApplicable.length ? (pCompliant.length / pApplicable.length) * 100 : 0;
    return { key: p.id, label: `${p.number}. ${pick(p.name, p.nameEn)}`, value: pct };
  });

  const themeBars: RankedBarItem[] = principles
    .flatMap((p) => p.themes)
    .map((t) => {
      const reqIds = new Set(t.requirements.map((r) => r.id));
      const tAssessments = validated.filter((a) => reqIds.has(a.requirementId));
      const tApplicable = tAssessments.filter((a) => a.finalClassification !== "NAO_SE_APLICA");
      const tCompliant = tAssessments.filter((a) => a.finalClassification === "ATENDE_TOTALMENTE");
      const pct = tApplicable.length ? (tCompliant.length / tApplicable.length) * 100 : 0;
      const hasData = tAssessments.length > 0;
      return {
        key: t.id,
        label: `${t.number}. ${pick(t.name, t.nameEn)}`,
        value: pct,
        badge: maturityLabel(pct, hasData),
        badgeColor: complianceColor(hasData ? pct : null),
      };
    });

  // Mesmo cálculo de themeBars, mas com os dados extras (id do tema,
  // princípio de origem, contagens) que a Bússola GISTM precisa para
  // colorir e linkar cada fatia.
  const wheelThemes: WheelTheme[] = principles.flatMap((p) =>
    p.themes.map((t) => {
      const reqIds = new Set(t.requirements.map((r) => r.id));
      const tValidated = validated.filter((a) => reqIds.has(a.requirementId));
      const tApplicable = tValidated.filter((a) => a.finalClassification !== "NAO_SE_APLICA");
      const tCompliant = tValidated.filter((a) => a.finalClassification === "ATENDE_TOTALMENTE");
      const pct = tApplicable.length ? (tCompliant.length / tApplicable.length) * 100 : 0;
      return {
        id: t.id,
        number: t.number,
        name: pick(t.name, t.nameEn),
        principleNumber: p.number,
        principleName: pick(p.name, p.nameEn),
        value: pct,
        validatedCount: tValidated.length,
        requirementCount: t.requirements.length,
      };
    })
  );

  const criticalityCounts = {
    alta: validated.filter((a) => a.finalCriticality === "ALTA").length,
    media: validated.filter((a) => a.finalCriticality === "MEDIA").length,
    baixa: validated.filter((a) => a.finalCriticality === "BAIXA").length,
  };

  const gapAssessments = validated.filter(
    (a) => a.finalClassification === "ATENDE_PARCIALMENTE" || a.finalClassification === "NAO_ATENDE"
  );
  const criticalityRank: Record<string, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2, NAO_SE_APLICA: 3 };
  const gapsList: GapItem[] = gapAssessments
    .slice()
    .sort(
      (a, b) =>
        (criticalityRank[a.finalCriticality ?? "NAO_SE_APLICA"] ?? 9) -
        (criticalityRank[b.finalCriticality ?? "NAO_SE_APLICA"] ?? 9)
    )
    .map((a) => ({
      id: a.requirementId,
      code: a.requirement.code,
      title: pick(a.requirement.title, a.requirement.titleEn),
      classification: a.finalClassification!,
      robustness: a.finalRobustness,
      criticality: a.finalCriticality,
    }));
  const topGaps = gapsList.slice(0, 8);

  const now = new Date();
  const overdueActions = actions.filter(
    (a) => a.status !== "CONCLUIDA" && a.dueDate && isBefore(a.dueDate, now)
  );
  const upcomingActions = actions.filter(
    (a) =>
      a.status !== "CONCLUIDA" &&
      a.dueDate &&
      !isBefore(a.dueDate, now) &&
      isBefore(a.dueDate, addDays(now, 7))
  );
  const openActions = actions.filter((a) => a.status !== "CONCLUIDA");

  const expiredDocuments = allDocuments.filter((d) => d.validUntil && isBefore(d.validUntil, now));
  const expiringDocuments = allDocuments.filter(
    (d) => d.validUntil && !isBefore(d.validUntil, now) && isBefore(d.validUntil, addDays(now, 30))
  );

  const pendingAiReview = assessments
    .filter((a) => a.status === "EM_REVISAO")
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

  const insufficientInfo = validated.filter(
    (a) => a.finalInfoSufficiency === "INSUFICIENTE"
  );

  // Alerta de revalidação (item 9.9 da proposta): quando um documento usado
  // como evidência de uma avaliação já validada é substituído por uma versão
  // mais nova, a avaliação pode estar baseada em conteúdo desatualizado.
  const documentsWithVersions = await prisma.documentFile.findMany({
    where: { installationId: installation.id },
    include: { nextVersions: { select: { uploadedAt: true } } },
  });
  const newestVersionDateByDocId = new Map<string, Date>();
  for (const doc of documentsWithVersions) {
    if (doc.nextVersions.length > 0) {
      const newest = doc.nextVersions.reduce((a, b) => (a.uploadedAt > b.uploadedAt ? a : b));
      newestVersionDateByDocId.set(doc.id, newest.uploadedAt);
    }
  }
  const evidenceForInstallation = await prisma.evidence.findMany({
    where: { document: { installationId: installation.id } },
    select: { requirementId: true, documentId: true },
  });
  const pendingRevalidation: GapItem[] = [];
  const revalidationSeen = new Set<string>();
  for (const ev of evidenceForInstallation) {
    if (revalidationSeen.has(ev.requirementId)) continue;
    const newestDate = newestVersionDateByDocId.get(ev.documentId);
    if (!newestDate) continue;
    const assessment = validated.find((a) => a.requirementId === ev.requirementId);
    if (!assessment?.reviewedAt || assessment.reviewedAt >= newestDate) continue;
    revalidationSeen.add(ev.requirementId);
    pendingRevalidation.push({
      id: assessment.requirementId,
      code: assessment.requirement.code,
      title: pick(assessment.requirement.title, assessment.requirement.titleEn),
      classification: assessment.finalClassification!,
      robustness: assessment.finalRobustness,
      criticality: assessment.finalCriticality,
    });
  }

  const nextRequirement = assessments.find((a) => a.status !== "VALIDADO")?.requirement ?? null;

  // Comparação com o ciclo anterior (o item logo depois do atual na lista
  // ordenada por data de início decrescente).
  const currentIndex = allCycles.findIndex((c) => c.id === cycle.id);
  const previousCycle = currentIndex >= 0 ? allCycles[currentIndex + 1] : undefined;
  let previousCycleComparison: {
    previousCycleName: string;
    previousCompliance: number | null;
    delta: number | null;
  } | null = null;

  if (previousCycle) {
    const previousAssessments = await prisma.assessment.findMany({
      where: { installationId: installation.id, cycleId: previousCycle.id, status: "VALIDADO" },
    });
    const prevTotalmente = previousAssessments.filter(
      (a) => a.finalClassification === "ATENDE_TOTALMENTE"
    ).length;
    const prevNaoSeAplica = previousAssessments.filter(
      (a) => a.finalClassification === "NAO_SE_APLICA"
    ).length;
    const prevApplicable = previousAssessments.length - prevNaoSeAplica;
    const previousCompliance =
      prevApplicable > 0 ? Math.round((prevTotalmente / prevApplicable) * 100) : null;
    previousCycleComparison = {
      previousCycleName: previousCycle.name,
      previousCompliance,
      delta:
        overallCompliance !== null && previousCompliance !== null
          ? overallCompliance - previousCompliance
          : null,
    };
  }

  const readinessScore = computeReadinessScore({
    validatedCount: validated.length,
    totalRequirements,
    overallCompliance,
    criticalGaps: criticalityCounts.alta,
    overdueActions: overdueActions.length,
    expiredDocuments: expiredDocuments.length,
    pendingAiReview: pendingAiReview.length,
  });

  const executiveSummary = buildExecutiveSummary({
    installationName: installation.name,
    cycleName: cycle.name,
    validatedCount: validated.length,
    totalRequirements,
    overallCompliance,
    totalmente,
    parcialmente,
    naoAtende,
    criticalGaps: criticalityCounts.alta,
    overdueActionsCount: overdueActions.length,
    previousCycleComparison,
  });

  return {
    installation,
    cycle,
    allCycles,
    isLatestCycle,
    totalRequirements,
    validatedCount: validated.length,
    pendingReview,
    totalmente,
    parcialmente,
    naoAtende,
    naoSeAplica,
    applicable,
    overallCompliance,
    distributionSegments,
    principleBars,
    themeBars,
    wheelThemes,
    readinessScore,
    criticalityCounts,
    topGaps,
    gapsList,
    overdueActions,
    upcomingActions,
    openActions,
    expiredDocuments,
    expiringDocuments,
    pendingAiReview,
    insufficientInfo,
    pendingRevalidation,
    documentsCount,
    nextRequirement,
    previousCycleComparison,
    executiveSummary,
  };
}

function buildExecutiveSummary(input: {
  installationName: string;
  cycleName: string;
  validatedCount: number;
  totalRequirements: number;
  overallCompliance: number | null;
  totalmente: number;
  parcialmente: number;
  naoAtende: number;
  criticalGaps: number;
  overdueActionsCount: number;
  previousCycleComparison: { previousCycleName: string; delta: number | null } | null;
}): string {
  const parts: string[] = [];

  if (input.validatedCount === 0) {
    return (
      `A instalação ${input.installationName} ainda não possui requisitos validados no ` +
      `${input.cycleName}. A avaliação de conformidade com o GISTM está pendente de início.`
    );
  }

  parts.push(
    `A instalação ${input.installationName} apresenta, no ${input.cycleName}, ` +
      `${input.validatedCount} de ${input.totalRequirements} requisitos avaliados` +
      (input.overallCompliance !== null
        ? `, com ${input.overallCompliance}% de atendimento geral entre os requisitos aplicáveis.`
        : ".")
  );

  parts.push(
    `Desses, ${input.totalmente} atendem totalmente, ${input.parcialmente} atendem parcialmente ` +
      `e ${input.naoAtende} não atendem ao requisito avaliado.`
  );

  if (input.criticalGaps > 0) {
    parts.push(
      `Foram identificados ${input.criticalGaps} gap(s) de criticidade alta, que devem ser ` +
        `priorizados no plano de ação` +
        (input.overdueActionsCount > 0
          ? `; atualmente há ${input.overdueActionsCount} ação(ões) corretiva(s) com prazo vencido.`
          : ".")
    );
  } else {
    parts.push("Não há gaps de criticidade alta identificados até o momento.");
  }

  if (input.previousCycleComparison && input.previousCycleComparison.delta !== null) {
    const delta = input.previousCycleComparison.delta;
    const trend = delta > 0 ? "uma evolução de" : delta < 0 ? "uma retração de" : "estabilidade em relação ao";
    parts.push(
      delta === 0
        ? `O atendimento geral permanece estável em relação ao ${input.previousCycleComparison.previousCycleName}.`
        : `Em relação ao ${input.previousCycleComparison.previousCycleName}, observa-se ${trend} ${Math.abs(delta)} ponto(s) percentual(is) no atendimento geral.`
    );
  }

  return parts.join(" ");
}
