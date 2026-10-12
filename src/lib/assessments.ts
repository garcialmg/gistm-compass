import { prisma } from "@/lib/prisma";

export async function getOrCreateAssessment(
  requirementId: string,
  installationId: string,
  cycleId: string
) {
  const existing = await prisma.assessment.findUnique({
    where: {
      requirementId_installationId_cycleId: {
        requirementId,
        installationId,
        cycleId,
      },
    },
  });
  if (existing) return existing;

  return prisma.assessment.create({
    data: { requirementId, installationId, cycleId },
  });
}
