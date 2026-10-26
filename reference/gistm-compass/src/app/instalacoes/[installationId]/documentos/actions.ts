"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/text-extraction";
import { assertInstallationOwnership } from "@/lib/context";
import { assertUploadAllowed } from "@/lib/upload-limits";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function revalidateInstallation(installationId: string) {
  revalidatePath(`/instalacoes/${installationId}/documentos`);
  revalidatePath(`/instalacoes/${installationId}/requisitos`);
  revalidatePath(`/instalacoes/${installationId}/dashboard`);
  revalidatePath("/instalacoes");
}

export async function uploadDocument(installationId: string, formData: FormData) {
  await assertInstallationOwnership(installationId);

  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const areaResponsible = String(formData.get("areaResponsible") ?? "").trim();
  const confidentiality = String(formData.get("confidentiality") ?? "INTERNO");
  const targetAudience = String(formData.get("targetAudience") ?? "").trim();
  const validUntilRaw = String(formData.get("validUntil") ?? "");
  const previousVersionId = String(formData.get("previousVersionId") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecione um arquivo para enviar.");
  }
  if (!title) {
    throw new Error("Informe um título para o documento.");
  }

  const ext = path.extname(file.name).toLowerCase();
  assertUploadAllowed(file, ext);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const storedFileName = `${randomUUID()}${ext}`;
  const storedFilePath = path.join(UPLOAD_DIR, storedFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedFilePath, buffer);

  const extractedText = await extractText(buffer, ext);

  await prisma.documentFile.create({
    data: {
      title,
      type: type || "Documento",
      version: version || null,
      areaResponsible: areaResponsible || null,
      confidentiality,
      targetAudience: targetAudience || null,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
      previousVersionId: previousVersionId || null,
      fileName: file.name,
      filePath: storedFileName,
      mimeType: file.type || "application/octet-stream",
      extractedText,
      installationId,
    },
  });

  revalidateInstallation(installationId);
}

export async function importFolder(installationId: string, formData: FormData) {
  await assertInstallationOwnership(installationId);

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const type = String(formData.get("type") ?? "").trim() || "Outro";
  const areaResponsible = String(formData.get("areaResponsible") ?? "").trim();
  const confidentiality = String(formData.get("confidentiality") ?? "INTERNO");

  if (files.length === 0) {
    throw new Error("Selecione uma pasta que contenha ao menos um arquivo.");
  }

  for (const file of files) {
    assertUploadAllowed(file, path.extname(file.name).toLowerCase());
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    const storedFileName = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, storedFileName), buffer);

    const extractedText = await extractText(buffer, ext);
    const title = path.basename(file.name, ext);

    await prisma.documentFile.create({
      data: {
        title,
        type,
        areaResponsible: areaResponsible || null,
        confidentiality,
        fileName: file.name,
        filePath: storedFileName,
        mimeType: file.type || "application/octet-stream",
        extractedText,
        installationId,
      },
    });
  }

  revalidateInstallation(installationId);
}

async function assertDocumentBelongsToInstallation(installationId: string, documentId: string) {
  const document = await prisma.documentFile.findUnique({ where: { id: documentId } });
  if (!document || document.installationId !== installationId) {
    throw new Error("Documento não encontrado nesta instalação.");
  }
}

export async function deleteDocument(installationId: string, documentId: string) {
  await assertInstallationOwnership(installationId);
  await assertDocumentBelongsToInstallation(installationId, documentId);

  const document = await prisma.documentFile.findUniqueOrThrow({ where: { id: documentId } });

  await prisma.evidence.deleteMany({ where: { documentId } });
  await prisma.documentFile.delete({ where: { id: documentId } });

  try {
    await unlink(path.join(UPLOAD_DIR, document.filePath));
  } catch {
    // Arquivo já ausente do disco (ex.: removido manualmente) — a exclusão
    // do registro no banco já é o que importa para o usuário.
  }

  revalidateInstallation(installationId);
}

export async function approveDisclosure(
  installationId: string,
  documentId: string,
  formData: FormData
) {
  await assertInstallationOwnership(installationId);
  await assertDocumentBelongsToInstallation(installationId, documentId);

  const approvedBy = String(formData.get("approvedBy") ?? "").trim();
  if (!approvedBy) throw new Error("Informe quem está aprovando a divulgação.");

  await prisma.documentFile.update({
    where: { id: documentId },
    data: {
      disclosureApproved: true,
      disclosureApprovedBy: approvedBy,
      disclosureApprovedAt: new Date(),
    },
  });

  revalidateInstallation(installationId);
}
