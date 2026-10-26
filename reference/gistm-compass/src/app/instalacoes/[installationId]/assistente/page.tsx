import { getInstallationContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default async function AssistentePage({
  params,
}: {
  params: Promise<{ installationId: string }>;
}) {
  const { installationId } = await params;
  const { installation } = await getInstallationContext(installationId);

  const documentCount = await prisma.documentFile.count({ where: { installationId } });

  return (
    <div>
      <PageHeader
        title="Assistente"
        description={`Pergunte em linguagem natural sobre ${installation.name} — as respostas são geradas a partir dos ${documentCount} documento(s) enviados, com as fontes citadas.`}
      />
      <div className="mx-auto w-full max-w-3xl px-8 py-8">
        <ChatPanel installationId={installation.id} />
      </div>
    </div>
  );
}
