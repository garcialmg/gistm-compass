import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function DisclosurePackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { installationId } = await params;
  const { cycle: cycleParam } = await searchParams;
  const { installation, cycle } = await getInstallationContext(installationId, cycleParam);

  const documents = await prisma.documentFile.findMany({
    where: { installationId: installation.id, confidentiality: "PUBLICO", disclosureApproved: true },
    orderBy: [{ targetAudience: "asc" }, { title: "asc" }],
  });

  const groups = new Map<string, typeof documents>();
  for (const doc of documents) {
    const key = doc.targetAudience?.trim() || "Público geral";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(doc);
  }

  return (
    <div className="print:bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-8 pt-6 print:hidden">
        <Link
          href={`/instalacoes/${installation.id}/documentos`}
          className="flex items-center gap-1.5 text-sm text-mineral-500 hover:text-mineral-700"
        >
          <ArrowLeft size={14} />
          Voltar para documentos
        </Link>
        <PrintButton />
      </div>

      <header className="mt-6 bg-brand-800 px-8 py-10 text-white print:mt-0 print:break-after-page">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-300">
            GISTM Compass · Pacote de divulgação pública
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-balance">
            {installation.name}
          </h1>
          <p className="mt-2 text-sm text-mineral-300">
            {cycle.name} · gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
          </p>
          <p className="mt-4 max-w-2xl text-sm text-mineral-300">
            Documentos já aprovados para divulgação pública, organizados por público de destino —
            em linha com os compromissos de transparência e acesso à informação previstos no
            GISTM (Princípio 15). Documentos de uso interno ou ainda não aprovados não aparecem
            aqui.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-10 print:px-0 print:py-8">
        {documents.length === 0 ? (
          <p className="text-sm text-mineral-500">
            Nenhum documento aprovado para divulgação pública ainda. Aprove documentos em{" "}
            <Link href={`/instalacoes/${installation.id}/documentos`} className="text-brand-700 hover:underline">
              Gestão documental
            </Link>
            .
          </p>
        ) : (
          [...groups.entries()].map(([audience, docs]) => (
            <section key={audience} className="mb-9 break-inside-avoid">
              <h2 className="mb-3 border-b border-mineral-200 pb-2 font-display text-lg font-semibold text-mineral-900 print:border-black">
                {audience}
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mineral-200 text-left text-xs text-mineral-500 print:border-black print:text-black">
                    <th className="py-1.5 pr-3 font-medium">Documento</th>
                    <th className="py-1.5 pr-3 font-medium">Tipo</th>
                    <th className="py-1.5 pr-3 font-medium">Versão</th>
                    <th className="py-1.5 font-medium">Aprovado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mineral-100 print:divide-mineral-300">
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="py-2 pr-3 text-mineral-800 print:text-black">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={13} className="shrink-0 text-state-ok print:hidden" />
                          {doc.title}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-mineral-600 print:text-black">{doc.type}</td>
                      <td className="py-2 pr-3 text-mineral-600 print:text-black">{doc.version ?? "—"}</td>
                      <td className="py-2 text-xs text-mineral-500 print:text-black">
                        {doc.disclosureApprovedBy}
                        {doc.disclosureApprovedAt && ` · ${format(doc.disclosureApprovedAt, "dd/MM/yyyy")}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}

        <footer className="mt-12 border-t border-mineral-200 pt-4 text-xs text-mineral-500 print:text-black">
          GISTM Compass — pacote de divulgação gerado automaticamente a partir dos documentos
          aprovados para divulgação pública em {installation.name}.
        </footer>
      </div>
    </div>
  );
}
