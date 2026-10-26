import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { changeOwnPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { sucesso } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-8 py-8">
      <Link
        href="/instalacoes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-mineral-500 hover:text-mineral-700"
      >
        <ArrowLeft size={14} />
        Voltar para instalações
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-mineral-900">Minha conta</h1>
        <p className="text-sm text-mineral-500">Dados de acesso e segurança da sua conta.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Perfil" />
          <div className="space-y-1 px-5 py-5 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-mineral-800">
              {user.name}
              {user.role === "ADMIN" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                  <ShieldCheck size={10} />
                  Administrador
                </span>
              )}
            </p>
            <p className="text-mineral-500">{user.email}</p>
            <p className="text-mineral-500">{organization.name}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Trocar senha" subtitle="A nova senha vale para o próximo login." />
          <form action={changeOwnPassword} className="space-y-3 px-5 py-5">
            {sucesso === "1" && (
              <p className="rounded-lg bg-state-ok-soft px-3 py-2 text-sm text-state-ok">
                Senha alterada com sucesso.
              </p>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Senha atual</span>
              <input type="password" name="currentPassword" required className="input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">Nova senha</span>
              <input type="password" name="newPassword" required minLength={8} className="input" />
              <span className="mt-1 block text-xs text-mineral-500">Mínimo de 8 caracteres.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mineral-600">
                Confirmar nova senha
              </span>
              <input type="password" name="confirmPassword" required minLength={8} className="input" />
            </label>
            <SubmitButton
              pendingLabel="Salvando..."
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Salvar nova senha
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
