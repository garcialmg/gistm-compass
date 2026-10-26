"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 print:hidden"
    >
      <Printer size={16} />
      Salvar como PDF / Imprimir
    </button>
  );
}
