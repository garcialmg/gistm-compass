import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeInstallationStats } from "@/lib/installation-stats";
import { createInstallation, deleteInstallation } from "./actions";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { ReadinessGauge } from "@/components/ReadinessGauge";
import { CompassMark } from "@/components/CompassMark";
import { Plus, Trash2, BarChart3, LogOut, Users } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function InstalacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q = "" } = await searchParams;

  const installations = await prisma.installation.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(q ? { name: { contains: q } } : {}),
    },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    installations.map(async (installation) => ({
      installation,
      stats: await computeInstallationStats(installation.id),
    }))
  );

  return (
    <div className="content-shell py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompassMark className="text-brand-600" size={28} />
          <div>
            <h1 className="text-xl font-semibold text-mineral-900">GISTM Compass</h1>
            <p className="text-sm text-mineral-500">
              Visão corporativa — todas as instalações/estruturas de disposição de rejeitos.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {rows.length >= 2 && (
            <Link
              href="/instalacoes/comparar"
              className="flex items-center gap-2 rounded-lg border border-mineral-300 px-4 py-2 text-sm font-medium text-mineral-700 hover:bg-mineral-50"
            >
              <BarChart3 size={16} />
              Comparar instalações
            </Link>
          )}
          {session.user.role === "ADMIN" && (
            <Link
              href="/organizacao/usuarios"
              className="flex items-center gap-2 rounded-lg border border-mineral-300 px-4 py-2 text-sm font-medium text-mineral-700 hover:bg-mineral-50"
            >
              <Users size={16} />
              Usuários
            </Link>
          )}
          <Link href="/conta" className="text-right text-xs text-mineral-500 hover:text-mineral-700">
            <p className="font-medium text-mineral-700 hover:underline">{session.user.name}</p>
            <p>{session.user.email}</p>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-mineral-300 px-3 py-2 text-xs font-medium text-mineral-600 hover:bg-mineral-50"
              title="Sair"
            >
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader title="Nova instalação" />
          <form action={createInstallation} className="space-y-3 px-5 py-5">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">
                Nome da estrutura
              </span>
              <input
                name="name"
                required
                className="input"
                placeholder="Ex.: Barragem Norte"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">
                Local (opcional)
              </span>
              <input name="location" className="input" placeholder="Ex.: Ouro Preto/MG" />
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Criar instalação
            </button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Instalações"
            subtitle={`${installations.length} estrutura(s) cadastrada(s)`}
            action={
              <form method="get" className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nome..."
                  className="input w-56"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-mineral-300 px-3 py-2 text-xs font-medium text-mineral-700 hover:bg-mineral-50"
                >
                  Buscar
                </button>
              </form>
            }
          />
          {rows.length === 0 ? (
            <EmptyState>
              {q
                ? "Nenhuma instalação encontrada para essa busca."
                : "Nenhuma instalação cadastrada ainda. Crie a primeira ao lado."}
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mineral-100 text-left text-xs text-mineral-500">
                    <th className="px-5 py-2 font-medium">Instalação</th>
                    <th className="px-3 py-2 text-center font-medium">Prontidão</th>
                    <th className="px-5 py-2 font-medium">Ciclo ativo</th>
                    <th className="px-5 py-2 font-medium">Atendimento</th>
                    <th className="px-5 py-2 font-medium">Avaliados</th>
                    <th className="px-5 py-2 font-medium">Gaps altos</th>
                    <th className="px-5 py-2 font-medium">Ações vencidas</th>
                    {session.user.role === "ADMIN" && <th className="px-5 py-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-mineral-100">
                  {rows.map(({ installation, stats }) => (
                    <tr key={installation.id} className="hover:bg-mineral-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/instalacoes/${installation.id}/dashboard`}
                          className="font-medium text-mineral-800 hover:text-brand-700"
                        >
                          {installation.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          <ReadinessGauge score={stats.readinessScore} size={48} showLabel={false} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-mineral-500">{stats.cycleName ?? "—"}</td>
                      <td className="px-5 py-3 font-medium tabular-nums text-mineral-800">
                        {stats.compliancePct !== null ? `${stats.compliancePct}%` : "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-mineral-500">
                        {stats.validatedCount}/{stats.totalRequirements}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {stats.criticalGaps > 0 ? (
                          <span className="font-medium text-state-bad">{stats.criticalGaps}</span>
                        ) : (
                          <span className="text-mineral-500">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {stats.overdueActions > 0 ? (
                          <span className="font-medium text-state-bad">
                            {stats.overdueActions}
                          </span>
                        ) : (
                          <span className="text-mineral-500">0</span>
                        )}
                      </td>
                      {session.user.role === "ADMIN" && (
                        <td className="px-5 py-3 text-right">
                          <form action={deleteInstallation.bind(null, installation.id)}>
                            <button
                              type="submit"
                              className="rounded p-1.5 text-mineral-300 hover:bg-red-50 hover:text-red-600"
                              title="Remover instalação"
                            >
                              <Trash2 size={14} />
                            </button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
