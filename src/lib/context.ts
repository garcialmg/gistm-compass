import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Toda página/ação dentro de /instalacoes/[installationId] recebe o id da
 * instalação pela própria URL (nunca por cookie/sessão global) — importante
 * para uso com dezenas de estruturas em paralelo: um auditor pode manter
 * várias abas abertas, cada uma para uma instalação diferente, sem risco de
 * misturar dados entre elas.
 *
 * O ciclo de avaliação é opcionalmente selecionável via querystring
 * (?cycle=<id>) para permitir visualizar ciclos anteriores; sem isso, usa o
 * ciclo mais recente (o "ciclo ativo").
 *
 * Esta função é o ÚNICO ponto de checagem de sessão + organização para todas
 * as páginas/ações escopadas por instalação — se a instalação pertencer a
 * outra organização, retorna 404 (não 403, para não revelar que ela existe).
 */
export async function getInstallationContext(installationId: string, cycleId?: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });
  if (!installation || installation.organizationId !== session.user.organizationId) {
    notFound();
  }

  const cycle = cycleId
    ? await prisma.cycle.findFirst({ where: { id: cycleId, installationId } })
    : await prisma.cycle.findFirst({
        where: { installationId },
        orderBy: { startedAt: "desc" },
      });
  if (!cycle) notFound();

  const allCycles = await prisma.cycle.findMany({
    where: { installationId },
    orderBy: { startedAt: "desc" },
  });

  const isLatestCycle = allCycles[0]?.id === cycle.id;

  return { installation, cycle, allCycles, isLatestCycle };
}

/**
 * Checagem enxuta para Server Actions que recebem installationId diretamente
 * (sem precisar do contexto de ciclo completo) — garante que quem está
 * autenticado só consegue mutar dados de instalações da própria organização,
 * mesmo conhecendo o id de uma instalação de outra organização.
 */
export async function assertInstallationOwnership(installationId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });
  if (!installation || installation.organizationId !== session.user.organizationId) {
    notFound();
  }
}
