"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/**
 * Executivo e técnico são duas leituras do mesmo ciclo, não dois lugares.
 * Como itens irmãos no menu (ambos chamados "Dashboard") obrigavam a
 * escolher antes de saber a diferença; como abas, a relação fica explícita.
 */
export function PainelTabs({
  installationId,
  search,
}: {
  installationId: string;
  search?: string;
}) {
  const pathname = usePathname();
  const qs = search ? `?${search}` : "";
  const abas = [
    { href: `/instalacoes/${installationId}/dashboard`, label: "Executivo" },
    { href: `/instalacoes/${installationId}/dashboard-tecnico`, label: "Técnico" },
  ];

  return (
    <nav className="flex gap-1" aria-label="Visões do painel">
      {abas.map((a) => {
        const on = pathname === a.href;
        return (
          <Link
            key={a.href}
            href={`${a.href}${qs}`}
            aria-current={on ? "page" : undefined}
            className={clsx(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              on
                ? "bg-brand-50 text-brand-700"
                : "text-mineral-600 hover:bg-mineral-100 hover:text-mineral-900"
            )}
            style={{ fontSize: "var(--text-small)" }}
          >
            {a.label}
          </Link>
        );
      })}
    </nav>
  );
}
