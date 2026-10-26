"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-brand-800 px-6 text-center text-white">
      <AlertTriangle className="text-state-warn" size={48} strokeWidth={1.5} />
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-300">
          Algo deu errado
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-balance">
          Não foi possível concluir essa ação
        </h1>
        <p className="mt-2 max-w-md text-sm text-mineral-500">
          {error.message || "Tente novamente. Se o problema continuar, verifique se os dados informados estão corretos antes de tentar de novo."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Tentar novamente
        </button>
        <Link
          href="/instalacoes"
          className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-mineral-300 hover:bg-white/5"
        >
          Voltar para instalações
        </Link>
      </div>
    </div>
  );
}
