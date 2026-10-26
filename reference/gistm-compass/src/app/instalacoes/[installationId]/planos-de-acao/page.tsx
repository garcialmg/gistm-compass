import Link from "next/link";
import { isBefore } from "date-fns";
import { ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { PageHeader, PageBody, Card, CardHeader, EmptyState, ClassificationBadge, CriticalityBadge } from "@/components/ui";
import { ActionItem } from "@/components/ActionItem";
import { CycleSwitcher } from "@/components/CycleSwitcher";

const CRITICALITY_ORDER: Record<string, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2, NAO_SE_APLICA: 3 };

export const dynamic = "force-dynamic";

const COLUMNS: { status: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA"; label: string }[] = [
  { status: "ABERTA", label: "Abertas" },
  { status: "EM_ANDAMENTO", label: "Em andamento" },
  { status: "CONCLUIDA", label: "Concluídas" },
];

export default async function PlanosDeAcaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { installationId } = await params;
  const { cycle: cycleParam } = await searchParams;
  const { installation, cycle, allCycles, isLatestCycle } = await getInstallationContext(
    installationId,
    cycleParam
  );

  const actions = await prisma.action.findMany({
    where: {
      assessment: { installationId: installation.id, cycleId: cycle.id },
    },
    include: {
      assessment: { include: { requirement: true } },
      dependsOn: { select: { id: true, description: true, status: true } },
      comments: { orderBy: { createdAt: "desc" } },
      logs: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  // Gaps já validados que ainda não viraram ação — é aqui que a sugestão
  // pré-preenchida (descrição, prioridade e prazo a partir do gap) fica
  // disponível, dentro da página do requisito.
  const gapsWithoutAction = isLatestCycle
    ? (
        await prisma.assessment.findMany({
          where: {
            installationId: installation.id,
            cycleId: cycle.id,
            finalClassification: { in: ["NAO_ATENDE", "ATENDE_PARCIALMENTE"] },
            actions: { none: {} },
          },
          include: { requirement: true },
        })
      ).sort(
        (a, b) =>
          (CRITICALITY_ORDER[a.finalCriticality ?? "NAO_SE_APLICA"] ?? 3) -
          (CRITICALITY_ORDER[b.finalCriticality ?? "NAO_SE_APLICA"] ?? 3)
      )
    : [];

  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Plano de ação"
        description="Gaps identificados na avaliação transformados em ações rastreáveis, com responsável, prazo, prioridade e status."
        action={<CycleSwitcher cycles={allCycles} currentCycleId={cycle.id} />}
      />

      <PageBody className="space-y-6">
        {!isLatestCycle && (
          <div className="rounded-lg border border-state-warn-line bg-state-warn-soft px-4 py-3 text-sm text-state-warn">
            Você está visualizando um ciclo encerrado ({cycle.name}), somente leitura.
          </div>
        )}

      {gapsWithoutAction.length > 0 && (
        <div>
          <Card>
            <CardHeader
              title="Ações sugeridas pendentes"
              subtitle={`${gapsWithoutAction.length} gap(s) já validado(s) ainda sem ação registrada — a sugestão (descrição, prioridade e prazo a partir do gap) está pronta dentro de cada requisito.`}
            />
            <ul className="divide-y divide-mineral-100">
              {gapsWithoutAction.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-mineral-800">
                      {assessment.requirement.code} — {assessment.requirement.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <ClassificationBadge value={assessment.finalClassification} />
                      <CriticalityBadge value={assessment.finalCriticality} />
                    </div>
                  </div>
                  <Link
                    href={`/instalacoes/${installation.id}/requisitos/${assessment.requirementId}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                  >
                    <Sparkles size={12} />
                    Ver sugestão
                    <ArrowRight size={12} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = actions.filter((a) => a.status === col.status);
          return (
            <Card key={col.status} className="flex flex-col">
              <div className="flex items-center justify-between border-b border-mineral-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-mineral-900">{col.label}</h2>
                <span className="rounded-full bg-mineral-100 px-2 py-0.5 text-xs font-medium text-mineral-500">
                  {items.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 px-4 py-4">
                {items.length === 0 ? (
                  <EmptyState>Nenhuma ação nesta coluna.</EmptyState>
                ) : (
                  items.map((action) => {
                    const overdue = Boolean(
                      action.status !== "CONCLUIDA" && action.dueDate && isBefore(action.dueDate, now)
                    );
                    return (
                      <ActionItem
                        key={action.id}
                        action={action}
                        requirementCode={action.assessment.requirement.code}
                        requirementHref={`/instalacoes/${installation.id}/requisitos/${action.assessment.requirementId}`}
                        installationId={installation.id}
                        requirementId={action.assessment.requirementId}
                        overdue={overdue}
                        readOnly={!isLatestCycle}
                      />
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>
      </PageBody>
    </div>
  );
}
