import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { documentId } = await params;
  const document = await prisma.documentFile.findUnique({
    where: { id: documentId },
    include: { installation: { select: { organizationId: true } } },
  });

  if (!document || document.installation.organizationId !== session.user.organizationId) {
    return new Response("Documento não encontrado.", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(path.join(UPLOAD_DIR, document.filePath));
  } catch {
    return new Response("Arquivo não encontrado no armazenamento.", { status: 404 });
  }

  const asciiFallback = document.fileName.replace(/[^\x20-\x7E]/g, "_");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
