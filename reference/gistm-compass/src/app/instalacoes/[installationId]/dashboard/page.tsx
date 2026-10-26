import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, AlertTriangle, Clock, FileWarning, HelpCircle, RefreshCw } from "lucide-react";
import { computeInstallationReport } from "@/lib/report";
import { PageHeader, PageBody, Card, CardHeader, StatTile, StatGrid, EmptyState, ClassificationBadge, CriticalityBadge } from "@/components/ui";
import { StatusDistributionBar, RankedBarList, CriticalityBars } from "@/components/charts";
import { CycleSwitcher } from "@/components/CycleSwitcher";
import { CompassWheel } from "@/components/CompassWheel";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { LangSwitcher } from "@/components/LangSwitcher";
import { PainelTabs } from "@/components/PainelTabs";
import { startNewCycle } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<{ cycle?: string; lang?: string }>;
}) {
  const { installationId } = await params;
  const { cycle: cycleParam, lang: langParam } = await searchParams;
  const lang = langParam === "en" ? "en" : "pt";
  const report = await computeInstallationReport(installationId, cycleParam, lang);
  const { installation, cycle } = report;

  const notificationCount =
    report.overdueActions.length +
    report.upcomingActions.length +
    report.expiredDocuments.length +
    report.expiringDocuments.length +
    report.pendingAiReview.length +
    report.insufficientInfo.length +
    report.pendingRevalidation.length;

  return (
    <div>
      <PageHeader
        toolbar={<PainelTabs installationId={installation.id} search={cycleParam ? `cycle=${cycleParam}` : undefined} />}
        title="Painel"
        description={`${installation.name} · ${cycle.name} — visão consolidada do nível de aderência ao GISTM.`}
        action={
          <div className="flex items-center gap-3">
            <CycleSwitcher cycles={report.allCycles} currentCycleId={cycle.id} />
            <LangSwitcher lang={lang} extraParams={{ cycle: cycleParam }} />
            {report.nextRequirement && report.isLatestCycle && (
              <Link
                href={`/instalacoes/${installation.id}/requisitos/${report.nextRequirement.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Continuar avaliação
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        }
      />

      <PageBody className="space-y-6">
        {!report.isLatestCycle && (
          <div className="rounded-lg border border-state-warn-line bg-state-warn-soft px-4 py-3 text-sm text-state-warn">
            Você está visualizando um ciclo encerrado ({cycle.name}), somente leitura. Use o
            seletor de ciclo acima para voltar ao ciclo ativo.
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr]">
            <div className="flex items-center justify-center border-b border-mineral-100 p-8 lg:border-b-0 lg:border-r">
              <CompassWheel
                themes={report.wheelThemes}
                installationId={installation.id}
                center={<ReadinessGauge score={report.readinessScore} />}
                lang={lang}
              />
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-mineral-500">
                Bússola GISTM
              </p>
              <h2 className="mt-1 text-lg font-semibold text-mineral-900">
                Índice de Prontidão para Auditoria
              </h2>
              <p className="mt-2 max-w-md text-sm text-mineral-600">
                Nota única de 0 a 100 combinando cobertura da avaliação, nível de atendimento,
                gaps de criticidade alta, ações vencidas e documentos vencidos. Cada fatia da
                bússola é um princípio do GISTM — clique em qualquer uma para abrir os requisitos
                daquele princípio.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-mineral-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3f6212" }} />
                  Boa aderência
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#c2870f" }} />
                  Requer atenção
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#a52a2a" }} />
                  Crítico
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-mineral-300" />
                  Sem avaliação
                </span>
              </div>
            </div>
          </div>
        </Card>

        <StatGrid>
          <StatTile
            label="Atendimento geral"
            value={report.overallCompliance !== null ? `${report.overallCompliance}%` : "—"}
            hint={`${report.totalmente} de ${report.applicable} requisitos aplicáveis`}
            tone="good"
          />
          <StatTile
            label="Requisitos avaliados"
            value={`${report.validatedCount}/${report.totalRequirements}`}
            hint={`${report.pendingReview} pendente(s) de revisão`}
          />
          <StatTile
            label="Gaps de criticidade alta"
            value={String(report.criticalityCounts.alta)}
            hint="Requerem priorização imediata"
            tone={report.criticalityCounts.alta > 0 ? "critical" : "default"}
          />
          <StatTile
            label="Ações vencidas"
            value={String(report.overdueActions.length)}
            hint={`${report.openActions.length} ação(ões) em aberto no total`}
            tone={report.overdueActions.length > 0 ? "critical" : "good"}
          />
        </StatGrid>

        {report.previousCycleComparison && (
          <Card className="px-5 py-4">
            <p className="text-xs font-medium text-mineral-500">
              Comparação com {report.previousCycleComparison.previousCycleName}
            </p>
            <p className="mt-1 text-sm text-mineral-700">
              {report.previousCycleComparison.delta === null ? (
                "Ciclo anterior ainda sem requisitos validados o suficiente para comparação."
              ) : report.previousCycleComparison.delta === 0 ? (
                "Atendimento geral estável em relação ao ciclo anterior."
              ) : (
                <>
                  Atendimento geral{" "}
                  <span
                    className={
                      report.previousCycleComparison.delta > 0
                        ? "font-semibold text-state-ok"
                        : "font-semibold text-state-bad"
                    }
                  >
                    {report.previousCycleComparison.delta > 0 ? "subiu" : "caiu"}{" "}
                    {Math.abs(report.previousCycleComparison.delta)} ponto(s) percentual(is)
                  </span>{" "}
                  em relação ao ciclo anterior ({report.previousCycleComparison.previousCompliance}%
                  → {report.overallCompliance}%).
                </>
              )}
            </p>
          </Card>
        )}

        {/* Leitura e alertas lado a lado: a síntese é texto corrido (pede
            largura) e a lista de notificações é curta (2/3 + 1/3). */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Síntese executiva"
            subtitle="Gerada automaticamente a partir dos dados do ciclo (não é texto redigido por IA)"
          />
          <p className="px-5 py-4 text-sm leading-relaxed text-mineral-700">
            {report.executiveSummary}
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Notificações e acompanhamento"
            subtitle={`${notificationCount} alerta(s) ativo(s)`}
          />
          {notificationCount === 0 ? (
            <EmptyState>Nenhum alerta no momento. 👍</EmptyState>
          ) : (
            <ul className="divide-y divide-mineral-100 text-sm">
              {report.overdueActions.length > 0 && (
                <NotificationRow
                  icon={<AlertTriangle size={15} className="text-state-bad" />}
                  text={`${report.overdueActions.length} ação(ões) corretiva(s) vencida(s)`}
                  href={`/instalacoes/${installation.id}/planos-de-acao`}
                />
              )}
              {report.upcomingActions.length > 0 && (
                <NotificationRow
                  icon={<Clock size={15} className="text-state-warn" />}
                  text={`${report.upcomingActions.length} ação(ões) vencendo nos próximos 7 dias`}
                  href={`/instalacoes/${installation.id}/planos-de-acao`}
                />
              )}
              {report.expiredDocuments.length > 0 && (
                <NotificationRow
                  icon={<FileWarning size={15} className="text-state-bad" />}
                  text={`${report.expiredDocuments.length} documento(s) com validade vencida`}
                  href={`/instalacoes/${installation.id}/documentos`}
                />
              )}
              {report.expiringDocuments.length > 0 && (
                <NotificationRow
                  icon={<FileWarning size={15} className="text-state-warn" />}
                  text={`${report.expiringDocuments.length} documento(s) vencendo nos próximos 30 dias`}
                  href={`/instalacoes/${installation.id}/documentos`}
                />
              )}
              {report.pendingAiReview.length > 0 && (
                <NotificationRow
                  icon={<Clock size={15} className="text-mineral-500" />}
                  text={`${report.pendingAiReview.length} sugestão(ões) da IA aguardando revisão técnica`}
                  href={`/instalacoes/${installation.id}/requisitos`}
                />
              )}
              {report.insufficientInfo.length > 0 && (
                <NotificationRow
                  icon={<HelpCircle size={15} className="text-state-warn" />}
                  text={`${report.insufficientInfo.length} requisito(s) validado(s) com informação insuficiente`}
                  href={`/instalacoes/${installation.id}/requisitos`}
                />
              )}
              {report.pendingRevalidation.length > 0 && (
                <NotificationRow
                  icon={<RefreshCw size={15} className="text-state-warn" />}
                  text={`${report.pendingRevalidation.length} requisito(s) validado(s) com documento substituído por versão mais nova`}
                  href={`/instalacoes/${installation.id}/documentos`}
                />
              )}
            </ul>
          )}
        </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Distribuição por classificação"
              subtitle={`${report.validatedCount} requisito(s) validado(s)`}
            />
            <div className="px-5 py-5">
              {report.validatedCount === 0 ? (
                <EmptyState>
                  Nenhum requisito validado ainda. Avalie requisitos na aba Requisitos.
                </EmptyState>
              ) : (
                <StatusDistributionBar
                  segments={report.distributionSegments}
                  total={report.validatedCount}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Criticidade dos gaps" subtitle="Entre os requisitos validados" />
            <div className="px-5 py-5">
              {report.criticalityCounts.alta + report.criticalityCounts.media + report.criticalityCounts.baixa === 0 ? (
                <EmptyState>Nenhum gap registrado ainda.</EmptyState>
              ) : (
                <CriticalityBars
                  alta={report.criticalityCounts.alta}
                  media={report.criticalityCounts.media}
                  baixa={report.criticalityCounts.baixa}
                />
              )}
            </div>
          </Card>
        </div>

        {/* 6 tópicos (rótulos curtos) x 15 princípios (rótulos longos) —
            1/3 + 2/3 em vez de dois blocos full-width empilhados, que
            deixavam os "0%" a 1200px de distância do rótulo. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader
              title="Atendimento por área temática (tópico GISTM)"
              subtitle="Percentual de requisitos aplicáveis classificados como 'Atende totalmente'"
            />
            <div className="px-5 py-5">
              <RankedBarList items={report.principleBars} maxValue={100} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Atendimento por princípio"
              subtitle="Detalhado por princípio, com selo de maturidade: Inicial · Em desenvolvimento · Gerenciado · Otimizado"
            />
            <div className="px-5 py-5">
              <RankedBarList items={report.themeBars} maxValue={100} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Requisitos com maior gap"
            subtitle="Ordenados por criticidade — os primeiros candidatos a plano de ação"
          />
          {report.topGaps.length === 0 ? (
            <EmptyState>Nenhum gap identificado até o momento.</EmptyState>
          ) : (
            <ul className="divide-y divide-mineral-100">
              {report.topGaps.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link
                    href={`/instalacoes/${installation.id}/requisitos/${g.id}`}
                    className="min-w-0 flex-1 truncate text-mineral-700 hover:text-brand-700"
                  >
                    <span className="mr-2 text-xs text-mineral-500">{g.code}</span>
                    {g.title}
                  </Link>
                  <CriticalityBadge value={g.criticality} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Lista consolidada de lacunas"
            subtitle={`${report.gapsList.length} requisito(s) com atendimento parcial ou não atendido`}
          />
          {report.gapsList.length === 0 ? (
            <EmptyState>Nenhuma lacuna registrada até o momento.</EmptyState>
          ) : (
            <ul className="max-h-96 divide-y divide-mineral-100 overflow-y-auto">
              {report.gapsList.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <Link
                    href={`/instalacoes/${installation.id}/requisitos/${g.id}`}
                    className="min-w-0 flex-1 truncate text-mineral-700 hover:text-brand-700"
                  >
                    <span className="mr-2 text-xs text-mineral-500">{g.code}</span>
                    {g.title}
                  </Link>
                  <ClassificationBadge value={g.classification} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>

        {report.pendingRevalidation.length > 0 && (
          <Card>
            <CardHeader
              title="Requisitos pendentes de revalidação"
              subtitle="Validados com base em uma versão de documento que já foi substituída"
            />
            <ul className="divide-y divide-mineral-100">
              {report.pendingRevalidation.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link
                    href={`/instalacoes/${installation.id}/requisitos/${r.id}`}
                    className="min-w-0 flex-1 truncate text-mineral-700 hover:text-brand-700"
                  >
                    <span className="mr-2 text-xs text-mineral-500">{r.code}</span>
                    {r.title}
                  </Link>
                  <ClassificationBadge value={r.classification} />
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Ações vencidas"
            subtitle={`${report.overdueActions.length} ação(ões) com prazo expirado`}
          />
          {report.overdueActions.length === 0 ? (
            <EmptyState>Nenhuma ação vencida. 👍</EmptyState>
          ) : (
            <ul className="divide-y divide-mineral-100">
              {report.overdueActions.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-mineral-700">{a.description}</span>
                  <span className="text-xs font-medium text-state-bad">
                    venceu em {format(a.dueDate!, "dd/MM/yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {report.isLatestCycle && (
          <Card>
            <CardHeader
              title="Gestão de ciclos"
              subtitle="Encerrar o ciclo atual e iniciar um novo ciclo de avaliação (para comparar evolução ao longo do tempo)"
            />
            <form
              action={startNewCycle.bind(null, installation.id, cycle.id)}
              className="flex flex-wrap items-end gap-3 px-5 py-4"
            >
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-mineral-600">
                  Nome do novo ciclo
                </span>
                <input name="name" required className="input w-56" placeholder="Ex.: Ciclo 2027.1" />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-mineral-300 px-4 py-2 text-sm font-medium text-mineral-700 hover:bg-mineral-50"
              >
                Encerrar ciclo atual e iniciar novo
              </button>
            </form>
          </Card>
        )}

        <p className="text-xs text-mineral-500">
          Base documental: {report.documentsCount} documento(s) enviados para {installation.name}.
        </p>
      </PageBody>
    </div>
  );
}

function NotificationRow({
  icon,
  text,
  href,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-2.5 px-5 py-3 hover:bg-mineral-50">
        {icon}
        <span className="text-mineral-700">{text}</span>
      </Link>
    </li>
  );
}
