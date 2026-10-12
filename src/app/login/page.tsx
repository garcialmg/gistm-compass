import Link from "next/link";
import { CompassMark } from "@/components/CompassMark";
import { loginAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-brand-800 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <CompassMark className="text-brand-400" size={36} />
          <h1 className="font-display text-2xl font-semibold">GISTM Compass</h1>
          <p className="text-sm text-mineral-500">Entre com sua conta para continuar</p>
        </div>

        <form action={loginAction} className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
          {erro === "bloqueado" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Muitas tentativas incorretas seguidas. Esta conta foi bloqueada
              temporariamente — tente novamente em alguns minutos.
            </p>
          )}
          {erro === "1" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Email ou senha incorretos.
            </p>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Email</span>
            <input type="email" name="email" required autoFocus className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Senha</span>
            <input type="password" name="password" required className="input" />
          </label>
          <SubmitButton
            pendingLabel="Entrando..."
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Entrar
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-mineral-500">
          Ainda não tem uma conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand-300 hover:underline">
            Criar organização
          </Link>
        </p>
      </div>
    </div>
  );
}
