import { prisma } from "@/lib/prisma";
import { computeReadinessScore } from "@/lib/readiness-score";

export interface PrincipleBreakdown {
  number: number;
  name: string;
  pct: number | null;
  validatedCount: number;
}

export interface InstallationStats {
  cycleName: string | null;
  validatedCount: number;
  totalRequirements: number;
  compliancePct: number | null;
  criticalGaps: number;
  overdueActions: number;
  readinessScore: number;
  principleBreakdown: PrincipleBreakdown[];
}

let principlesCache: Awaited<ReturnType<typeof loadPrinciples>> | null = null;
async function loadPrinciples() {
  return prisma.principle.findMany({
    orderBy: { number: "asc" },
    include: { themes: { include: { requirements: { select: { id: true } } } } },
  });
}
async function getPrinciples() {
  if (!principlesCache) principlesCache = await loadPrinciples();
  return principlesCache;
}

export async function computeInstallationStats(installationId: string): Promise<InstallationStats> {
  const [totalRequirements, cycle, principles] = await Promise.all([
    prisma.requirement.count(),
    prisma.cycle.findFirst({
      where: { installationId },
      orderBy: { startedAt: "desc" },
    }),
    getPrinciples(),
  ]);

  const emptyBreakdown: PrincipleBreakdown[] = principles.map((p) => ({
    number: p.number,
    name: p.name,
    pct: null,
    validatedCount: 0,
  }));

  if (!cycle) {
    return {
      cycleName: null,
      validatedCount: 0,
      totalRequirements,
      compliancePct: null,
      criticalGaps: 0,
      overdueActions: 0,
      readinessScore: 0,
      principleBreakdown: emptyBreakdown,
    };
  }

  const [validated, overdueActions, expiredDocuments, pendingAiReview] = await Promise.all([
    prisma.assessment.findMany({
      where: { installationId, cycleId: cycle.id, status: "VALIDADO" },
      select: { requirementId: true, finalClassification: true, finalCriticality: true },
    }),
    prisma.action.count({
      where: {
        status: { not: "CONCLUIDA" },
        dueDate: { lt: new Date() },
        assessment: { installationId, cycleId: cycle.id },
      },
    }),
    prisma.documentFile.count({
      where: { installationId, validUntil: { lt: new Date() } },
    }),
    prisma.assessment.count({
      where: { installationId, cycleId: cycle.id, status: "EM_REVISAO" },
    }),
  ]);

  const compliant = validated.filter((a) => a.finalClassification === "ATENDE_TOTALMENTE").length;
  const applicable = validated.filter((a) => a.finalClassification !== "NAO_SE_APLICA").length;
  const criticalGaps = validated.filter((a) => a.finalCriticality === "ALTA").length;
  const compliancePct = applicable > 0 ? Math.round((compliant / applicable) * 100) : null;

  const principleBreakdown: PrincipleBreakdown[] = principles.map((p) => {
    const reqIds = new Set(p.themes.flatMap((t) => t.requirements.map((r) => r.id)));
    const pValidated = validated.filter((a) => reqIds.has(a.requirementId));
    const pApplicable = pValidated.filter((a) => a.finalClassification !== "NAO_SE_APLICA");
    const pCompliant = pValidated.filter((a) => a.finalClassification === "ATENDE_TOTALMENTE");
    return {
      number: p.number,
      name: p.name,
      pct: pApplicable.length > 0 ? Math.round((pCompliant.length / pApplicable.length) * 100) : null,
      validatedCount: pValidated.length,
    };
  });

  const readinessScore = computeReadinessScore({
    validatedCount: validated.length,
    totalRequirements,
    overallCompliance: compliancePct,
    criticalGaps,
    overdueActions,
    expiredDocuments,
    pendingAiReview,
  });

  return {
    cycleName: cycle.name,
    validatedCount: validated.length,
    totalRequirements,
    compliancePct,
    criticalGaps,
    overdueActions,
    readinessScore,
    principleBreakdown,
  };
}
