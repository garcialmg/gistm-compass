import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse usa pdfjs-dist por baixo, que tenta carregar um worker
  // (pdf.worker.mjs) em tempo de execução — o bundler do Next.js não resolve
  // esse arquivo dentro do chunk do servidor, então o pacote precisa ficar de
  // fora do bundle e ser carregado via require nativo do Node.
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    // Importação de pasta inteira (múltiplos documentos de uma vez) pode
    // facilmente passar do limite padrão de 1MB por requisição de Server Action.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
