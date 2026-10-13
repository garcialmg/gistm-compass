import Link from "next/link";
import { CompassMark } from "@/components/CompassMark";
import { signupAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-brand-800 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-white">
          <CompassMark className="text-brand-400" size={36} />
          <h1 className="font-display text-2xl font-semibold">Criar organização</h1>
          <p className="text-center text-sm text-mineral-500">
            Cria a conta da sua empresa e o primeiro usuário administrador
          </p>
        </div>

        <form action={signupAction} className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Nome da organização</span>
            <input name="orgName" required autoFocus className="input" placeholder="Ex.: Mineradora Exemplo S.A." />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Seu nome</span>
            <input name="name" required className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Email</span>
            <input type="email" name="email" required className="input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mineral-600">Senha</span>
            <input type="password" name="password" required minLength={8} className="input" />
            <span className="mt-1 block text-xs text-mineral-500">Mínimo de 8 caracteres.</span>
          </label>
          <SubmitButton
            pendingLabel="Criando..."
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Criar organização
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-mineral-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-brand-300 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
