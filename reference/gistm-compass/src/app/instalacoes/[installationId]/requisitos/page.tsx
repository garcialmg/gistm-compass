import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInstallationContext } from "@/lib/context";
import { PageHeader, PageBody, ClassificationBadge, CriticalityBadge, Card, CardHeader, EmptyState } from "@/components/ui";
import { CycleSwitcher } from "@/components/CycleSwitcher";
import { LangSwitcher } from "@/components/LangSwitcher";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusDistributionBar, CriticalityBars, STATUS_COLORS } from "@/components/charts";
import { runAiSimulationForAll } from "./actions";
import type { FinalClassification } from "@prisma/client";

const CLASSIFICATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todas as classificações" },
  { value: "ATENDE_TOTALMENTE", label: "Atende totalmente" },
  { value: "ATENDE_PARCIALMENTE", label: "Atende parcialmente" },
  { value: "NAO_ATENDE", label: "Não atende" },
  { value: "NAO_SE_APLICA", label: "Não se aplica" },
  { value: "NAO_AVALIADO", label: "Não avaliado" },
];

export default async function RequisitosPage({
  params,
  searchParams,
}: {
  params: Promise<{ installationId: string }>;
  searchParams: Promise<{
    q?: string;
    classification?: string;
    cycle?: string;
    theme?: string;
    lang?: string;
  }>;
}) {
  const { installationId } = await params;
  const {
    q = "",
    classification = "",
    cycle: cycleParam,
    theme: themeParam,
    lang: langParam,
  } = await searchParams;
  const lang = langParam === "en" ? "en" : "pt";
  const pick = (pt: string, en: string | null | undefined) => (lang === "en" ? en ?? pt : pt);
  const { installation, cycle, allCycles, isLatestCycle } = await getInstallationContext(
    installationId,
    cycleParam
  );

  const principles = await prisma.principle.findMany({
    orderBy: { number: "asc" },
    include: {
      themes: {
        orderBy: { number: "asc" },
        include: {
          requirements: {
            orderBy: { code: "asc" },
          },
        },
      },
    },
  });

  const assessments = await prisma.assessment.findMany({
    where: { installationId: installation.id, cycleId: cycle.id },
  });
  const assessmentByRequirement = new Map(assessments.map((a) => [a.requirementId, a]));

  const query = q.trim().toLowerCase();

  // Busca ampliada: além de código/título do requisito, também procura o
  // termo no conteúdo das evidências vinculadas (trechos + texto extraído
  // dos documentos), para achar requisitos pela evidência, não só pelo nome.
  let requirementIdsMatchingContent = new Set<string>();
  if (query) {
    const evidences = await prisma.evidence.findMany({
      where: { document: { installationId: installation.id } },
      select: { requirementId: true, excerpt: true, document: { select: { extractedText: true, title: true } } },
    });
    requirementIdsMatchingContent = new Set(
      evidences
        .filter(
          (e) =>
            e.excerpt.toLowerCase().includes(query) ||
            e.document.title.toLowerCase().includes(query) ||
            (e.document.extractedText ?? "").toLowerCase().includes(query)
        )
        .map((e) => e.requirementId)
    );
  }

  const totalRequirements = principles
    .flatMap((p) => p.themes)
    .flatMap((t) => t.requirements).length;
  const aiAnalyzed = assessments.filter((a) => a.aiClassification !== null);
  const aiCountBy = (cls: string) => aiAnalyzed.filter((a) => a.aiClassification === cls).length;
  const aiDistribution = [
    { key: "total", label: "Atende totalmente", value: aiCountBy("ATENDE_TOTALMENTE"), color: STATUS_COLORS.good },
    { key: "parcial", label: "Atende parcialmente", value: aiCountBy("ATENDE_PARCIALMENTE"), color: STATUS_COLORS.warning },
    { key: "nao", label: "Não atende", value: aiCountBy("NAO_ATENDE"), color: STATUS_COLORS.critical },
    { key: "na", label: "Não se aplica", value: aiCountBy("NAO_SE_APLICA"), color: STATUS_COLORS.muted },
  ];
  const aiCriticality = {
    alta: aiAnalyzed.filter((a) => a.aiCriticality === "ALTA").length,
    media: aiAnalyzed.filter((a) => a.aiCriticality === "MEDIA").length,
    baixa: aiAnalyzed.filter((a) => a.aiCriticality === "BAIXA").length,
  };

  // Primeiro tópico que ainda tem requisito sem validar — é o único que
  // abre sozinho na lista (ver a regra de `open` mais abaixo).
  const primeiroTopicoPendente = principles.findIndex((pr) =>
    pr.themes
      .flatMap((t) => t.requirements)
      .some((r) => assessmentByRequirement.get(r.id)?.status !== "VALIDADO")
  );

  return (
    <div>
      <PageHeader
        title="Base de requisitos GISTM"
        description={`Visão técnica por área temática e princípio — ${installation.name} · ${cycle.name}.`}
        action={
          <div className="flex items-center gap-3">
            <CycleSwitcher cycles={allCycles} currentCycleId={cycle.id} />
            <LangSwitcher lang={lang} extraParams={{ cycle: cycleParam, theme: themeParam, q, classification }} />
          </div>
        }
        toolbar={
          <form method="get" className="flex flex-wrap items-center gap-2">
            {cycleParam && <input type="hidden" name="cycle" value={cycleParam} />}
            {themeParam && <input type="hidden" name="theme" value={themeParam} />}
            {lang === "en" && <input type="hidden" name="lang" value="en" />}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por código, título ou conteúdo de evidência..."
              className="input max-w-[22rem]"
            />
            <select name="classification" defaultValue={classification} className="input max-w-[14rem]">
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn-primary"
            >
              Filtrar
            </button>
            {(q || classification || themeParam) && (
              <Link
                href={`/instalacoes/${installation.id}/requisitos${lang === "en" ? "?lang=en" : ""}`}
                className="btn-quiet"
              >
                Limpar filtros
              </Link>
            )}
          </form>
        }
      />

      <PageBody>
        {!isLatestCycle && (
          <div className="mb-6 rounded-lg border border-state-warn-line bg-state-warn-soft px-4 py-3 text-sm text-state-warn">
            Você está visualizando um ciclo encerrado ({cycle.name}), somente leitura.
          </div>
        )}

        {isLatestCycle && (
          <Card className="mb-6">
            <CardHeader
              title="Leitura em lote (IA)"
              subtitle={
                aiAnalyzed.length > 0
                  ? `${aiAnalyzed.length} de ${totalRequirements} requisitos com sugestão da IA gerada`
                  : "Nenhum requisito analisado pela IA ainda"
              }
              action={
                <form action={runAiSimulationForAll.bind(null, installation.id)}>
                  <SubmitButton
                    pendingLabel={`Analisando os ${totalRequirements} requisitos...`}
                    className="flex items-center gap-2 rounded-lg bg-mineral-900 px-3 py-2 text-xs font-medium text-white hover:bg-mineral-700"
                  >
                    <Sparkles size={14} />
                    Simular leitura por IA em todos os requisitos
                  </SubmitButton>
                </form>
              }
            />
            <div className="px-5 py-5">
              {aiAnalyzed.length === 0 ? (
                <EmptyState>
                  Roda a leitura de IA (simulada) em todos os requisitos de uma vez, usando a base
                  documental desta instalação. Cada sugestão ainda precisa de validação humana
                  individual — isto só acelera a primeira leitura.
                </EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-mineral-500">
                      Distribuição das classificações sugeridas
                    </p>
                    <StatusDistributionBar segments={aiDistribution} total={aiAnalyzed.length} />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-mineral-500">
                      Criticidade dos gaps sugeridos
                    </p>
                    <CriticalityBars
                      alta={aiCriticality.alta}
                      media={aiCriticality.media}
                      baixa={aiCriticality.baixa}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {themeParam &&
          (() => {
            const matchedTheme = principles.flatMap((p) => p.themes).find((t) => t.id === themeParam);
            if (!matchedTheme) return null;
            return (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
                <span>
                  Filtrando pelo princípio da bússola: <strong>Princípio {matchedTheme.number} · {pick(matchedTheme.name, matchedTheme.nameEn)}</strong>
                </span>
                <Link
                  href={`/instalacoes/${installation.id}/requisitos?${new URLSearchParams({
                    ...(cycleParam ? { cycle: cycleParam } : {}),
                    ...(lang === "en" ? { lang: "en" } : {}),
                  }).toString()}`}
                  className="font-medium hover:underline"
                >
                  Ver todos os princípios
                </Link>
              </div>
            );
          })()}


        <div className="space-y-3">
          {principles.map((principle, principleIndex) => {
            const allRequirements = principle.themes.flatMap((t) => t.requirements);
            const validated = allRequirements.filter(
              (r) => assessmentByRequirement.get(r.id)?.status === "VALIDADO"
            );
            const compliant = validated.filter(
              (r) => assessmentByRequirement.get(r.id)?.finalClassification === "ATENDE_TOTALMENTE"
            );
            const pct = validated.length
              ? Math.round((compliant.length / validated.length) * 100)
              : 0;
            const coverage = allRequirements.length
              ? Math.round((validated.length / allRequirements.length) * 100)
              : 0;

            const visibleThemes = principle.themes
              .filter((theme) => !themeParam || theme.id === themeParam)
              .map((theme) => ({
                ...theme,
                requirements: theme.requirements.filter((r) => {
                  const assessment = assessmentByRequirement.get(r.id);
                  const matchesQuery =
                    !query ||
                    r.code.toLowerCase().includes(query) ||
                    r.title.toLowerCase().includes(query) ||
                    (r.titleEn ?? "").toLowerCase().includes(query) ||
                    requirementIdsMatchingContent.has(r.id);
                  const effectiveClassification: string =
                    assessment?.finalClassification ?? "NAO_AVALIADO";
                  const matchesClassification =
                    !classification || effectiveClassification === classification;
                  return matchesQuery && matchesClassification;
                }),
              }))
              .filter((t) => t.requirements.length > 0);

            if (visibleThemes.length === 0) return null;

            // Com filtro ativo, abre tudo: o usuário está procurando algo
            // específico e não quer caçar em qual tópico caiu.
            // Sem filtro, abre só o primeiro tópico com trabalho pendente — é
            // o "continue de onde parou". Abrir todos os que têm pendência
            // (a primeira versão desta regra) abria os 6 numa instalação que
            // mal começou, e a página ficava mais longa que antes.
            const hasFilter = Boolean(query || classification || themeParam);
            const abrirPorPadrao = principleIndex === primeiroTopicoPendente;

            return (
              <details
                key={principle.id}
                open={hasFilter || abrirPorPadrao}
                className="group overflow-hidden rounded-lg border border-mineral-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-mineral-50 [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-mineral-400 transition-transform group-open:rotate-90"
                  />
                  <h2
                    className="min-w-0 flex-1 truncate text-mineral-900"
                    style={{ fontSize: "var(--text-title)" }}
                  >
                    <span className="text-mineral-400">{principle.number}</span>{" "}
                    {pick(principle.name, principle.nameEn)}
                  </h2>

                  <div className="hidden items-center gap-2.5 sm:flex">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mineral-200">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: coverage + "%" }}
                      />
                    </div>
                    <span
                      className="tabular-nums text-mineral-600"
                      style={{ fontSize: "var(--text-small)" }}
                    >
                      {validated.length}/{allRequirements.length}
                    </span>
                  </div>
                  <span
                    className="w-14 shrink-0 text-right font-medium tabular-nums text-mineral-900"
                    style={{ fontSize: "var(--text-small)" }}
                    title="Atendimento entre os requisitos já avaliados"
                  >
                    {validated.length > 0 ? pct + "%" : "—"}
                  </span>
                </summary>

                <div className="border-t border-mineral-100">
                  {visibleThemes.map((theme) => (
                    <div key={theme.id}>
                      {/* "Princípio N" vira etiqueta curta e o enunciado fica em
                          caixa normal. Em caixa alta, o enunciado inteiro (uma
                          frase longa) virava um bloco que gritava mais alto que
                          os requisitos que ele agrupa. */}
                      <div className="flex gap-2 bg-mineral-50 px-4 py-2">
                        <span className="label-caps shrink-0 pt-px">
                          Princípio {theme.number}
                        </span>
                        <p
                          className="min-w-0 text-mineral-600"
                          style={{ fontSize: "var(--text-small)" }}
                        >
                          {pick(theme.name, theme.nameEn)}
                        </p>
                      </div>

                      <ul className="divide-y divide-mineral-100">
                        {theme.requirements.map((req) => {
                          const assessment = assessmentByRequirement.get(req.id);
                          return (
                            <li key={req.id}>
                              <Link
                                href={`/instalacoes/${installation.id}/requisitos/${req.id}?${new URLSearchParams(
                                  {
                                    ...(cycleParam ? { cycle: cycleParam } : {}),
                                    ...(lang === "en" ? { lang: "en" } : {}),
                                  }
                                ).toString()}`}
                                className="flex gap-3 px-4 py-3 hover:bg-mineral-50"
                              >
                                <span
                                  className="w-10 shrink-0 font-mono tabular-nums text-mineral-500"
                                  style={{ fontSize: "var(--text-small)" }}
                                >
                                  {req.code}
                                </span>

                                {/* `title` no banco é um resumo de 90 caracteres
                                    cortado com reticências (prisma/seed.ts:92).
                                    Para diferenciar dois requisitos é preciso o
                                    texto oficial — `description`, em 2 linhas. */}
                                <span
                                  className="min-w-0 flex-1 text-mineral-800"
                                  style={{
                                    fontSize: "var(--text-body)",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {pick(req.description, req.descriptionEn) ||
                                    pick(req.title, req.titleEn)}
                                </span>

                                <span className="flex shrink-0 flex-wrap items-start justify-end gap-1.5">
                                  <ClassificationBadge
                                    value={
                                      assessment?.finalClassification as FinalClassification | null
                                    }
                                  />
                                  {assessment?.finalCriticality && (
                                    <CriticalityBadge value={assessment.finalCriticality} />
                                  )}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </PageBody>
    </div>
  );
}
