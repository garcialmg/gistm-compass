"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ListChecks,
  FileStack,
  ClipboardList,
  ArrowLeft,
  FileBarChart,
  MessageCircleQuestion,
  Megaphone,
  LogOut,
} from "lucide-react";
import { CompassMark } from "@/components/CompassMark";
import { InstallationSwitcher } from "@/components/InstallationSwitcher";
import { logoutAction } from "@/lib/auth-actions";

/**
 * Menu lateral do contexto de uma instalação.
 *
 * Três decisões de estrutura:
 *
 * 1. `sticky top-0 h-screen` — as páginas passam de 3000px; com o menu
 *    rolando junto, o usuário ficava sem navegação no fim da página.
 * 2. Trilho de ícones abaixo de `lg` (1024px) — em tablet os 256px fixos
 *    comiam a largura útil. 1024 e não 1280: o notebook de 1280 é o mais
 *    comum e merece o menu por extenso.
 * 3. Itens agrupados por intenção. Sete links no mesmo nível, dois deles
 *    chamados "Dashboard", obrigavam a ler a lista inteira toda vez.
 *    "Dashboard técnico" virou aba dentro do Painel — são duas leituras
 *    do mesmo dado, não dois lugares diferentes.
 */
export function Sidebar({
  installationId,
  installationName,
  userName,
  installations,
}: {
  installationId: string;
  installationName: string;
  userName: string;
  installations: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const base = `/instalacoes/${installationId}`;

  const GRUPOS: { titulo: string; itens: { href: string; label: string; icon: typeof ListChecks }[] }[] = [
    {
      titulo: "Acompanhar",
      itens: [
        { href: `${base}/dashboard`, label: "Painel", icon: LayoutDashboard },
        { href: `${base}/requisitos`, label: "Requisitos", icon: ListChecks },
        { href: `${base}/planos-de-acao`, label: "Plano de ação", icon: ClipboardList },
      ],
    },
    {
      titulo: "Acervo",
      itens: [
        { href: `${base}/documentos`, label: "Documentos", icon: FileStack },
        { href: `${base}/assistente`, label: "Assistente", icon: MessageCircleQuestion },
      ],
    },
    {
      titulo: "Entregáveis",
      itens: [
        { href: `${base}/relatorio`, label: "Relatório", icon: FileBarChart },
        { href: `${base}/documentos/divulgacao`, label: "Divulgação", icon: Megaphone },
      ],
    },
  ];

  function ativo(href: string) {
    if (href.endsWith("/dashboard")) {
      // O Painel cobre as duas abas (executiva e técnica).
      return pathname === href || pathname.startsWith(`${base}/dashboard-tecnico`);
    }
    if (href.endsWith("/documentos")) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-16 shrink-0 flex-col bg-brand-800 text-mineral-100 lg:w-64 print:hidden">
      {/* marca */}
      <div className="relative flex items-center gap-3 overflow-hidden px-3 pt-5 pb-4 lg:px-4">
        <svg
          className="pointer-events-none absolute -left-7 -top-7 opacity-[0.10]"
          width="120" height="120" viewBox="0 0 120 120" aria-hidden
        >
          <circle cx="60" cy="60" r="52" fill="none" stroke="#74b0bd" strokeWidth="1" />
          {Array.from({ length: 16 }).map((_, i) => {
            const rad = ((i * 360) / 16) * (Math.PI / 180);
            const long = i % 4 === 0;
            const r1 = long ? 44 : 48;
            return (
              <line
                key={i}
                x1={60 + r1 * Math.cos(rad)} y1={60 + r1 * Math.sin(rad)}
                x2={60 + 52 * Math.cos(rad)} y2={60 + 52 * Math.sin(rad)}
                stroke="#74b0bd" strokeWidth={long ? 1.5 : 0.75}
              />
            );
          })}
        </svg>
        <CompassMark className="relative mx-auto shrink-0 text-brand-300 lg:mx-0" size={24} />
        <p className="relative hidden font-display text-[1rem] font-semibold leading-tight tracking-tight lg:block">
          GISTM Compass
        </p>
      </div>

      {/* troca de instalação */}
      <div className="px-2 pb-3 lg:px-4">
        <div className="hidden lg:block">
          <InstallationSwitcher installations={installations} currentId={installationId} />
        </div>
        <div
          className="flex h-8 items-center justify-center rounded-md bg-brand-900/60 font-mono text-[11px] font-semibold text-brand-200 lg:hidden"
          title={installationName}
        >
          {installationName.trim().charAt(0).toUpperCase()}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 lg:px-3">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="mb-4">
            <p className="mb-1 hidden px-2 font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-brand-300/70 lg:block">
              {grupo.titulo}
            </p>
            <div className="space-y-0.5">
              {grupo.itens.map(({ href, label, icon: Icon }) => {
                const on = ativo(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-current={on ? "page" : undefined}
                    className={clsx(
                      "flex items-center justify-center gap-3 rounded-md px-2.5 py-2 font-medium transition-colors lg:justify-start",
                      on
                        ? "bg-brand-500 text-white"
                        : "text-mineral-300 hover:bg-brand-700 hover:text-white"
                    )}
                    style={{ fontSize: "var(--text-small)" }}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-brand-700 px-2 py-2.5 lg:px-3">
        <Link
          href="/instalacoes"
          title="Todas as instalações"
          className="mb-1 flex items-center justify-center gap-2 rounded-md px-2.5 py-1.5 text-mineral-400 hover:bg-brand-700 hover:text-white lg:justify-start"
          style={{ fontSize: "var(--text-small)" }}
        >
          <ArrowLeft size={14} className="shrink-0" />
          <span className="hidden lg:inline">Todas as instalações</span>
        </Link>
        <div className="flex flex-col items-center gap-1 lg:flex-row lg:justify-between lg:px-2.5">
          <Link
            href="/conta"
            className="truncate text-mineral-300 hover:text-white hover:underline"
            style={{ fontSize: "var(--text-small)" }}
            title={`${userName} — Minha conta`}
          >
            <span className="hidden lg:inline">{userName}</span>
            <span className="lg:hidden">{userName.trim().charAt(0).toUpperCase() || "?"}</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-mineral-400 hover:bg-brand-700 hover:text-white"
              style={{ fontSize: "var(--text-small)" }}
              title="Sair"
            >
              <LogOut size={13} className="shrink-0" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          </form>
        </div>
      </div>

      {/* Declaração de confiança — decisão de produto registrada no README:
          o rodapé diz o que a plataforma faz e o que ela nunca faz sozinha. */}
      <div
        className="hidden border-t border-brand-700 px-3 py-2.5 leading-snug text-mineral-400 lg:block"
        style={{ fontSize: "var(--text-micro)" }}
      >
        Leitura assistida por IA · validação técnica sempre humana
      </div>
    </aside>
  );
}
