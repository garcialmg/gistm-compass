"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";

/**
 * Troca de instalação sem sair da página em que você está.
 *
 * Antes, mudar de estrutura custava duas telas: voltar para /instalacoes e
 * escolher de novo — e você caía no dashboard, mesmo que estivesse revisando
 * requisitos. Quem cuida de cinco barragens faz esse caminho o dia inteiro.
 *
 * Aqui o trecho da URL depois do id é preservado: de Requisitos da Norte
 * você vai direto para Requisitos da Sul.
 */
export function InstallationSwitcher({
  installations,
  currentId,
}: {
  installations: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (installations.length < 2) return null;

  function go(nextId: string) {
    if (nextId === currentId) return;
    // /instalacoes/<id>/<resto> -> troca só o id, mantém o resto
    const resto = pathname.split("/").slice(3).join("/");
    router.push(`/instalacoes/${nextId}${resto ? `/${resto}` : "/dashboard"}`);
  }

  return (
    <label className="relative flex items-center">
      <span className="sr-only">Trocar de instalação</span>
      <select
        value={currentId}
        onChange={(e) => go(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-md border border-brand-700 bg-brand-900/60 py-1.5 pl-2.5 pr-7 font-medium text-white
                   hover:border-brand-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
        style={{ fontSize: "var(--text-small)" }}
      >
        {installations.map((i) => (
          <option key={i.id} value={i.id} className="bg-white text-mineral-900">
            {i.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown
        size={13}
        className="pointer-events-none absolute right-2 text-brand-200"
        aria-hidden
      />
    </label>
  );
}
