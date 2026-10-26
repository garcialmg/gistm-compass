"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertInstallationOwnership } from "@/lib/context";
import { auth } from "@/auth";
import type { ActionPriority, ActionStatus } from "@prisma/client";

function revalidateAction(installationId: string, requirementId?: string) {
  revalidatePath(`/instalacoes/${installationId}/planos-de-acao`);
  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath("/instalacoes");
  if (requirementId) {
    revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
  }
}

const STATUS_LABELS: Record<ActionStatus, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

async function requireSessionName(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");
  return session.user.name ?? session.user.email ?? "Usuário";
}

export async function createAction(formData: FormData) {
  const installationId = String(formData.get("installationId"));
  const assessmentId = String(formData.get("assessmentId"));
  const requirementId = String(formData.get("requirementId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const responsible = String(formData.get("responsible") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const priority = String(formData.get("priority") ?? "MEDIA") as ActionPriority;
  const dependsOnId = String(formData.get("dependsOnId") ?? "").trim();

  if (!description) throw new Error("Descreva a ação corretiva.");
  if (!responsible) throw new Error("Informe o responsável pela ação.");

  const actorName = await requireSessionName();
  await assertInstallationOwnership(installationId);
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.installationId !== installationId) {
    throw new Error("Avaliação não encontrada nesta instalação.");
  }

  const action = await prisma.action.create({
    data: {
      assessmentId,
      description,
      responsible,
      area: area || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      priority,
      dependsOnId: dependsOnId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      assessmentId,
      actor: responsible,
      action: "ACAO_CRIADA",
      note: description,
    },
  });

  await prisma.actionLog.create({
    data: {
      actionId: action.id,
      actor: actorName,
      event: "ACAO_CRIADA",
      note: `Responsável: ${responsible}.`,
    },
  });

  revalidateAction(installationId, requirementId || undefined);
}

export async function updateActionStatus(
  actionId: string,
  status: ActionStatus,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

  const closureEvidence = String(formData.get("closureEvidence") ?? "").trim();

  const current = await prisma.action.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      dependsOn: { select: { status: true, description: true } },
      assessment: { select: { installation: { select: { organizationId: true } } } },
    },
  });
  if (current.assessment.installation.organizationId !== session.user.organizationId) {
    throw new Error("Ação não encontrada.");
  }

  if (
    (status === "EM_ANDAMENTO" || status === "CONCLUIDA") &&
    current.dependsOn &&
    current.dependsOn.status !== "CONCLUIDA"
  ) {
    throw new Error(
      `Esta ação depende de "${current.dependsOn.description}", que ainda não foi concluída.`
    );
  }
  if (status === "CONCLUIDA" && !closureEvidence) {
    throw new Error("Informe a evidência de encerramento para concluir a ação.");
  }

  const action = await prisma.action.update({
    where: { id: actionId },
    data: {
      status,
      closureEvidence: status === "CONCLUIDA" ? closureEvidence || null : undefined,
    },
    include: { assessment: { select: { installationId: true, requirementId: true } } },
  });

  await prisma.actionLog.create({
    data: {
      actionId: action.id,
      actor: session.user.name ?? session.user.email ?? "Usuário",
      event: "STATUS_ALTERADO",
      note:
        `Status alterado de "${STATUS_LABELS[current.status]}" para "${STATUS_LABELS[status]}".` +
        (status === "CONCLUIDA" && closureEvidence ? ` Evidência de encerramento: ${closureEvidence}` : ""),
    },
  });

  revalidateAction(action.assessment.installationId, action.assessment.requirementId);
}

export async function addActionComment(formData: FormData) {
  const installationId = String(formData.get("installationId"));
  const actionId = String(formData.get("actionId"));
  const requirementId = String(formData.get("requirementId") ?? "");
  const author = String(formData.get("author") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!author) throw new Error("Informe seu nome para comentar.");
  if (!text) throw new Error("Escreva um comentário.");

  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

  const action = await prisma.action.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      assessment: { select: { installation: { select: { organizationId: true } } } },
    },
  });
  if (action.assessment.installation.organizationId !== session.user.organizationId) {
    throw new Error("Ação não encontrada.");
  }

  await prisma.actionComment.create({ data: { actionId, author, text } });

  revalidatePath(`/instalacoes/${installationId}/planos-de-acao`);
  if (requirementId) {
    revalidatePath(`/instalacoes/${installationId}/requisitos/${requirementId}`);
  }
}

export async function deleteAction(actionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

  const existing = await prisma.action.findUniqueOrThrow({
    where: { id: actionId },
    include: {
      assessment: { select: { installation: { select: { organizationId: true } } } },
    },
  });
  if (existing.assessment.installation.organizationId !== session.user.organizationId) {
    throw new Error("Ação não encontrada.");
  }

  const action = await prisma.action.delete({
    where: { id: actionId },
    include: { assessment: { select: { installationId: true, requirementId: true } } },
  });

  revalidateAction(action.assessment.installationId, action.assessment.requirementId);
}
