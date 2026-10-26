"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertInstallationOwnership } from "@/lib/context";

export async function startNewCycle(
  installationId: string,
  currentCycleId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Informe um nome para o novo ciclo de avaliação.");

  await assertInstallationOwnership(installationId);
  const currentCycle = await prisma.cycle.findUnique({ where: { id: currentCycleId } });
  if (!currentCycle || currentCycle.installationId !== installationId) {
    throw new Error("Ciclo não encontrado nesta instalação.");
  }

  await prisma.cycle.update({
    where: { id: currentCycleId },
    data: { closedAt: new Date() },
  });

  const newCycle = await prisma.cycle.create({
    data: { name, installationId },
  });

  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath(`/instalacoes/${installationId}/requisitos`);
  revalidatePath(`/instalacoes/${installationId}/planos-de-acao`);
  revalidatePath("/instalacoes");

  redirect(`/instalacoes/${installationId}/dashboard?cycle=${newCycle.id}`);
}
