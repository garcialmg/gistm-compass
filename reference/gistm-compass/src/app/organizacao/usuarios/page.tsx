import Link from "next/link";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus, Trash2, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { createOrgUser, removeOrgUser, resetUserPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrganizationUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/instalacoes");

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });
  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-8">
      <Link
        href="/instalacoes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-mineral-500 hover:text-mineral-700"
      >
        <ArrowLeft size={14} />
        Voltar para instalações
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-mineral-900">Usuários da organização</h1>
        <p className="text-sm text-mineral-500">
          {organization.name} · {users.length} usuário(s) com acesso às instalações desta
          organização.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <CardHeader title="Adicionar usuário" />
          <form action={createOrgUser} className="space-y-3 px-5 py-5">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Nome</span>
              <input name="name" required className="input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Email</span>
              <input type="email" name="email" required className="input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Senha provisória</span>
              <input type="password" name="password" required minLength={8} className="input" />
              <span className="mt-1 block text-xs text-mineral-500">Mínimo de 8 caracteres.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Papel</span>
              <select name="role" className="input" defaultValue="MEMBER">
                <option value="MEMBER">Membro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <UserPlus size={16} />
              Criar usuário
            </button>
          </form>
        </Card>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader title="Usuários" subtitle={`${users.length} usuário(s)`} />
          {users.length === 0 ? (
            <EmptyState>Nenhum usuário cadastrado.</EmptyState>
          ) : (
            <ul className="divide-y divide-mineral-100">
              {users.map((user) => {
                const isLocked = user.lockedUntil !== null && user.lockedUntil > new Date();
                return (
                  <li key={user.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-mineral-800">
                          {user.name}
                          {user.role === "ADMIN" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                              <ShieldCheck size={10} />
                              Administrador
                            </span>
                          )}
                          {isLocked && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600"
                              title={`Bloqueado até ${format(user.lockedUntil!, "dd/MM/yyyy HH:mm")} por tentativas de login incorretas`}
                            >
                              <Lock size={10} />
                              Bloqueado
                            </span>
                          )}
                          {user.id === session.user.id && (
                            <span className="text-[10px] text-mineral-500">(você)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-mineral-500">{user.email}</p>
                        <p className="text-xs text-mineral-500">
                          Desde {format(user.createdAt, "dd/MM/yyyy")}
                        </p>
                      </div>
                      {user.id !== session.user.id && (
                        <form action={removeOrgUser.bind(null, user.id)}>
                          <button
                            type="submit"
                            className="rounded p-1.5 text-mineral-300 hover:bg-red-50 hover:text-red-600"
                            title="Remover usuário"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      )}
                    </div>
                    {user.id !== session.user.id && (
                      <details className="mt-2">
                        <summary className="flex w-fit cursor-pointer items-center gap-1 text-[11px] text-mineral-500 hover:text-mineral-600">
                          <KeyRound size={11} />
                          Redefinir senha
                        </summary>
                        <form
                          action={resetUserPassword.bind(null, user.id)}
                          className="mt-2 flex items-end gap-2"
                        >
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-medium text-mineral-600">
                              Nova senha provisória
                            </span>
                            <input
                              type="password"
                              name="newPassword"
                              required
                              minLength={8}
                              className="input w-52 text-[11px]"
                            />
                          </label>
                          <button
                            type="submit"
                            className="rounded-lg border border-mineral-300 px-3 py-2 text-[11px] font-medium text-mineral-700 hover:bg-mineral-50"
                          >
                            Redefinir
                          </button>
                        </form>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
