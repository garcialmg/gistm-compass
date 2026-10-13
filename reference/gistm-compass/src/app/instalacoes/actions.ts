"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function createInstallation(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name) throw new Error("Informe o nome da instalação/estrutura.");

  const installation = await prisma.installation.create({
    data: {
      name: location ? `${name} — ${location}` : name,
      organizationId: session.user.organizationId,
    },
  });

  const year = new Date().getFullYear();
  await prisma.cycle.create({
    data: { name: `Ciclo ${year}.1`, installationId: installation.id },
  });

  revalidatePath("/instalacoes");
  redirect(`/instalacoes/${installation.id}/dashboard`);
}

export async function deleteInstallation(installationId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    throw new Error("Apenas administradores da organização podem remover instalações.");
  }

  const installation = await prisma.installation.findUnique({ where: { id: installationId } });
  if (!installation || installation.organizationId !== session.user.organizationId) {
    notFound();
  }

  const assessmentIds = (
    await prisma.assessment.findMany({
      where: { installationId },
      select: { id: true },
    })
  ).map((a) => a.id);

  const actionIds = (
    await prisma.action.findMany({
      where: { assessmentId: { in: assessmentIds } },
      select: { id: true },
    })
  ).map((a) => a.id);

  const documents = await prisma.documentFile.findMany({
    where: { installationId },
    select: { filePath: true },
  });

  await prisma.$transaction([
    prisma.actionComment.deleteMany({ where: { actionId: { in: actionIds } } }),
    prisma.actionLog.deleteMany({ where: { actionId: { in: actionIds } } }),
    prisma.comment.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
    prisma.assessmentRevision.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
    prisma.auditLog.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
    prisma.action.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
    prisma.evidence.deleteMany({ where: { document: { installationId } } }),
    prisma.externalAnalysis.deleteMany({ where: { installationId } }),
    prisma.assessment.deleteMany({ where: { installationId } }),
    prisma.documentFile.deleteMany({ where: { installationId } }),
    prisma.cycle.deleteMany({ where: { installationId } }),
    prisma.installation.delete({ where: { id: installationId } }),
  ]);

  // Remove arquivos em disco associados à instalação (após a transação DB).
  const { unlink } = await import("node:fs/promises");
  const path = await import("node:path");
  const uploadDir = path.join(process.cwd(), "uploads");
  await Promise.all(
    documents.map(async (doc) => {
      try {
        await unlink(path.join(uploadDir, doc.filePath));
      } catch {
        // Arquivo já ausente — ok em cleanup.
      }
    })
  );

  revalidatePath("/instalacoes");
}
