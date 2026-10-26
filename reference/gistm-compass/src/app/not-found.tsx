import Link from "next/link";
import { CompassMark } from "@/components/CompassMark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-brand-800 px-6 text-center text-white">
      <CompassMark className="text-brand-400" size={48} />
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-300">Erro 404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-balance">
          Não encontramos essa página
        </h1>
        <p className="mt-2 max-w-md text-sm text-mineral-500">
          O link pode ter mudado, ou o item que você procura pode ter sido removido.
        </p>
      </div>
      <Link
        href="/instalacoes"
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Voltar para instalações
      </Link>
    </div>
  );
}
