import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { PageHeader, PageBody, Card, CardHeader, EmptyState } from "@/components/ui";
import { uploadDocument, deleteDocument, approveDisclosure, importFolder } from "./actions";
import { FileText, Trash2, UploadCloud, ShieldCheck, AlertTriangle, FolderInput, ExternalLink, Download } from "lucide-react";
import { format, isBefore } from "date-fns";
import clsx from "clsx";

export const dynamic = "force-dynamic";

const DOCUMENT_TYPES = [
  "Manual operacional",
  "Procedimento",
  "Relatório técnico",
  "Plano de ação",
  "Matriz de risco",
  "Registro de monitoramento",
  "Política corporativa",
  "Evidência fotográfica",
  "Registro de auditoria",
  "Outro",
];

export default async function DocumentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<{ q?: string; type?: string; confidentiality?: string }>;
}) {
  const { installationId } = await params;
  const { q = "", type = "", confidentiality = "" } = await searchParams;
  const { installation } = await getInstallationContext(installationId);

  const allDocuments = await prisma.documentFile.findMany({
    where: { installationId: installation.id },
    orderBy: { uploadedAt: "desc" },
    include: {
      _count: { select: { evidences: true } },
      previousVersion: { select: { id: true, title: true } },
      nextVersions: { select: { id: true, title: true } },
    },
  });

  const query = q.trim().toLowerCase();
  const documents = allDocuments.filter((doc) => {
    const matchesQuery =
      !query ||
      doc.title.toLowerCase().includes(query) ||
      (doc.extractedText ?? "").toLowerCase().includes(query);
    const matchesType = !type || doc.type === type;
    const matchesConfidentiality = !confidentiality || doc.confidentiality === confidentiality;
    return matchesQuery && matchesType && matchesConfidentiality;
  });

  const now = new Date();
  const expiredCount = allDocuments.filter((d) => d.validUntil && isBefore(d.validUntil, now)).length;
  const disclosurePackage = allDocuments.filter(
    (d) => d.confidentiality === "PUBLICO" && d.disclosureApproved
  );

  return (
    <div>
      <PageHeader
        title="Gestão documental"
        description="Envie os documentos que servirão de base para a avaliação de conformidade (manuais, procedimentos, relatórios, planos, matrizes de risco e demais evidências)."
      />

      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="h-fit">
            <CardHeader title="Enviar documento" />
            <form
              action={uploadDocument.bind(null, installation.id)}
              className="space-y-4 px-5 py-5"
            >
              <Field label="Título do documento">
                <input
                  name="title"
                  required
                  className="input"
                  placeholder="Ex.: Manual de Operação Rev. 3"
                />
              </Field>
              <Field label="Tipo documental">
                <select name="type" className="input" defaultValue={DOCUMENT_TYPES[0]}>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Versão">
                  <input name="version" className="input" placeholder="Rev. 3" />
                </Field>
                <Field label="Área responsável">
                  <input name="areaResponsible" className="input" placeholder="Engenharia" />
                </Field>
              </div>
              <Field label="Válido até (opcional)">
                <input type="date" name="validUntil" className="input" />
              </Field>
              {allDocuments.length > 0 && (
                <Field label="Nova versão de (opcional)">
                  <select name="previousVersionId" className="input" defaultValue="">
                    <option value="">Não substitui nenhum documento</option>
                    {allDocuments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Nível de confidencialidade">
                <select name="confidentiality" className="input" defaultValue="INTERNO">
                  <option value="INTERNO">Uso interno</option>
                  <option value="PUBLICO">Divulgação pública</option>
                </select>
              </Field>
              <Field label="Público de destino (opcional)">
                <input
                  name="targetAudience"
                  className="input"
                  placeholder="Ex.: Investidores, comunidade, órgão regulador"
                />
              </Field>
              <Field label="Arquivo">
                <input
                  type="file"
                  name="file"
                  required
                  className="block w-full text-sm text-mineral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-mineral-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-mineral-700"
                />
                <p className="mt-1 text-xs text-mineral-500">
                  Arquivos .txt, .md, .docx, .xlsx e .pdf têm o conteúdo lido pela IA simulada.
                  Outros formatos são indexados apenas por metadados (título/tipo).
                </p>
              </Field>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                <UploadCloud size={16} />
                Enviar documento
              </button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Importar pasta"
              subtitle="Envia todos os arquivos de uma pasta local de uma vez"
            />
            <form
              action={importFolder.bind(null, installation.id)}
              className="space-y-4 px-5 py-5"
            >
              <Field label="Pasta">
                <input
                  type="file"
                  name="files"
                  required
                  multiple
                  className="block w-full text-sm text-mineral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-mineral-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-mineral-700"
                  {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                />
                <p className="mt-1 text-xs text-mineral-500">
                  Abre o seletor de pasta do sistema operacional. Todos os arquivos dentro dela
                  (e subpastas) são enviados e classificados com os mesmos metadados abaixo.
                </p>
              </Field>
              <Field label="Tipo documental (aplicado a todos)">
                <select name="type" className="input" defaultValue="Outro">
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Área responsável">
                  <input name="areaResponsible" className="input" placeholder="Engenharia" />
                </Field>
                <Field label="Confidencialidade">
                  <select name="confidentiality" className="input" defaultValue="INTERNO">
                    <option value="INTERNO">Uso interno</option>
                    <option value="PUBLICO">Divulgação pública</option>
                  </select>
                </Field>
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-mineral-300 px-4 py-2.5 text-sm font-medium text-mineral-700 hover:bg-mineral-50"
              >
                <FolderInput size={16} />
                Importar todos os arquivos da pasta
              </button>
            </form>
          </Card>

          <Card>
            <CardHeader
              title="Pacote de divulgação"
              subtitle={`${disclosurePackage.length} documento(s) público(s) aprovado(s)`}
              action={
                disclosurePackage.length > 0 && (
                  <Link
                    href={`/instalacoes/${installation.id}/documentos/divulgacao`}
                    className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Ver pacote completo
                    <ExternalLink size={12} />
                  </Link>
                )
              }
            />
            {disclosurePackage.length === 0 ? (
              <EmptyState>
                Nenhum documento aprovado para divulgação pública ainda.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-mineral-100">
                {disclosurePackage.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 px-5 py-3 text-sm">
                    <ShieldCheck size={14} className="shrink-0 text-state-ok" />
                    <span className="truncate text-mineral-700">{d.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader
            title="Base documental"
            subtitle={`${documents.length} de ${allDocuments.length} documento(s) em ${installation.name}${
              expiredCount > 0 ? ` · ${expiredCount} vencido(s)` : ""
            }`}
            action={
              <form method="get" className="flex flex-wrap gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por título ou conteúdo..."
                  className="input w-40"
                />
                <select name="type" defaultValue={type} className="input w-40">
                  <option value="">Todos os tipos</option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select name="confidentiality" defaultValue={confidentiality} className="input w-36">
                  <option value="">Todos</option>
                  <option value="INTERNO">Uso interno</option>
                  <option value="PUBLICO">Divulgação pública</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg border border-mineral-300 px-3 py-2 text-xs font-medium text-mineral-700 hover:bg-mineral-50"
                >
                  Filtrar
                </button>
              </form>
            }
          />
          {documents.length === 0 ? (
            <EmptyState>
              {allDocuments.length === 0
                ? "Nenhum documento enviado ainda."
                : "Nenhum documento corresponde aos filtros."}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-mineral-100">
              {documents.map((doc) => {
                const expired = doc.validUntil ? isBefore(doc.validUntil, now) : false;
                const needsDisclosureApproval =
                  doc.confidentiality === "PUBLICO" && !doc.disclosureApproved;
                return (
                  <li key={doc.id} className="flex items-start gap-3 px-5 py-4">
                    <FileText size={18} className="mt-0.5 shrink-0 text-mineral-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-mineral-900">
                        {doc.title}
                        {expired && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-state-bad-soft px-2 py-0.5 text-[10px] font-medium text-state-bad">
                            <AlertTriangle size={10} /> vencido
                          </span>
                        )}
                        {doc.confidentiality === "PUBLICO" && doc.disclosureApproved && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-state-ok-soft px-2 py-0.5 text-[10px] font-medium text-state-ok">
                            <ShieldCheck size={10} /> aprovado p/ divulgação
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-mineral-500">
                        {doc.type}
                        {doc.version && ` · ${doc.version}`}
                        {doc.areaResponsible && ` · ${doc.areaResponsible}`}
                        {" · "}
                        {doc.confidentiality === "PUBLICO" ? "Divulgação pública" : "Uso interno"}
                        {doc.targetAudience && ` (${doc.targetAudience})`}
                      </p>
                      <p className="mt-0.5 text-xs text-mineral-500">
                        Enviado em {format(doc.uploadedAt, "dd/MM/yyyy HH:mm")} ·{" "}
                        {doc._count.evidences} evidência(s) vinculada(s)
                        {doc.extractedText && " · texto indexado"}
                        {doc.validUntil &&
                          ` · válido até ${format(doc.validUntil, "dd/MM/yyyy")}`}
                      </p>
                      {(doc.previousVersion || doc.nextVersions.length > 0) && (
                        <p className="mt-0.5 text-xs text-mineral-500">
                          {doc.previousVersion && `Nova versão de "${doc.previousVersion.title}". `}
                          {doc.nextVersions.length > 0 &&
                            `Substituído por "${doc.nextVersions[0].title}".`}
                        </p>
                      )}
                      {needsDisclosureApproval && (
                        <form
                          action={approveDisclosure.bind(null, installation.id, doc.id)}
                          className="mt-2 flex gap-2"
                        >
                          <input
                            name="approvedBy"
                            required
                            placeholder="Aprovado por..."
                            className={clsx("input text-xs", "max-w-[160px]")}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-mineral-300 px-2.5 py-1 text-xs font-medium text-mineral-700 hover:bg-mineral-50"
                          >
                            Aprovar para divulgação
                          </button>
                        </form>
                      )}
                    </div>
                    <a
                      href={`/api/documentos/${doc.id}/download`}
                      className="rounded-lg p-2 text-mineral-500 hover:bg-mineral-100 hover:text-mineral-700"
                      title="Baixar arquivo original"
                    >
                      <Download size={16} />
                    </a>
                    <form action={deleteDocument.bind(null, installation.id, doc.id)}>
                      <button
                        type="submit"
                        className="rounded-lg p-2 text-mineral-500 hover:bg-red-50 hover:text-red-600"
                        title="Remover documento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        </div>
      </PageBody>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-mineral-600">{label}</span>
      {children}
    </label>
  );
}
