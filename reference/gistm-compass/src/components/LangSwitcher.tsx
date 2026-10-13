// Alternância PT/EN para o conteúdo oficial do GISTM (nomes de tópicos/temas,
// título e descrição dos requisitos). Preserva os demais parâmetros de busca
// já presentes na URL (ciclo, tema, nível de detalhamento etc.).
export function LangSwitcher({
  lang,
  extraParams,
}: {
  lang: "pt" | "en";
  extraParams?: Record<string, string | undefined>;
}) {
  const hrefFor = (target: "pt" | "en") => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) qs.set(key, value);
    }
    if (target === "en") qs.set("lang", "en");
    // Sempre prefixado com "?", mesmo vazio: um href="" faz o navegador manter
    // a query string atual (recarrega a mesma URL), o que impediria voltar
    // para PT quando não há nenhum outro parâmetro além do lang.
    return `?${qs.toString()}`;
  };

  return (
    <div className="flex rounded-lg border border-mineral-300 p-0.5 text-xs">
      <a
        href={hrefFor("pt")}
        className={`rounded-md px-3 py-1.5 font-medium ${lang === "pt" ? "bg-brand-800 text-white" : "text-mineral-600"}`}
      >
        PT
      </a>
      <a
        href={hrefFor("en")}
        className={`rounded-md px-3 py-1.5 font-medium ${lang === "en" ? "bg-brand-800 text-white" : "text-mineral-600"}`}
      >
        EN
      </a>
    </div>
  );
}
