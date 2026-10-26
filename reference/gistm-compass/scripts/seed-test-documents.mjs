// Faz upload dos documentos fictícios gerados por generate-test-documents.mjs
// para a instalação "Barragem Norte" (criada pelo prisma/seed.ts), replicando
// a mesma lógica de armazenamento + extração de texto usada pelo upload real
// da plataforma (src/lib/text-extraction.ts), para popular o ambiente de
// demonstração com uma base documental realista.

import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "../src/lib/text-extraction.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "..", "..", "Documentos de Teste GISTM");
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const prisma = new PrismaClient();

const MIME_BY_EXT = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Metadados por arquivo (tipo documental, área responsável e, para o
// relatório público, marcado como aprovado para divulgação).
const DOC_META = {
  "Plano de Engajamento de Partes Interessadas e Comunidades Afetadas.docx": {
    type: "Procedimento",
    area: "Relacionamento com Comunidades",
  },
  "Relatório de Investigação Geotécnica e Hidrogeológica.docx": {
    type: "Relatório técnico",
    area: "Geotecnia",
  },
  "Ata do Comite de Governanca de Seguranca de Barragens.docx": {
    type: "Registro de auditoria",
    area: "Governança",
  },
  "Matriz de Risco da Estrutura de Disposicao de Rejeitos.xlsx": {
    type: "Matriz de risco",
    area: "Geotecnia",
  },
  "Memorial Descritivo e de Calculo - Projeto Executivo.docx": {
    type: "Relatório técnico",
    area: "Engenharia",
  },
  "Plano de Gestao de Mudancas e Nao Conformidades.docx": {
    type: "Procedimento",
    area: "Geotecnia",
  },
  "Planilha de Leituras de Instrumentacao Geotecnica.xlsx": {
    type: "Registro de monitoramento",
    area: "Geotecnia",
  },
  "Politica Corporativa de Gestao de Rejeitos e Barragens.docx": {
    type: "Política corporativa",
    area: "Diretoria",
  },
  "Carta de Nomeacao e Relatorio Anual do Engenheiro de Registro.docx": {
    type: "Outro",
    area: "Engenharia",
  },
  "Relatorio de Revisao Tecnica Independente (ITRB).docx": {
    type: "Relatório técnico",
    area: "Governança",
  },
  "Plano de Treinamento e Capacitacao em Seguranca de Barragens.xlsx": {
    type: "Outro",
    area: "Recursos Humanos",
  },
  "Politica de Canal de Denuncias e Protecao ao Denunciante.docx": {
    type: "Política corporativa",
    area: "Compliance",
  },
  "Plano de Acao de Emergencia (PAE).docx": {
    type: "Plano de ação",
    area: "Segurança",
  },
  "Plano de Fechamento e Recuperacao a Longo Prazo.docx": {
    type: "Plano de ação",
    area: "Engenharia",
  },
  "Relatorio Publico de Conformidade GISTM.docx": {
    type: "Relatório técnico",
    area: "Governança",
    confidentiality: "PUBLICO",
    targetAudience: "Investidores, comunidade, órgãos reguladores",
    disclosureApproved: true,
    disclosureApprovedBy: "Comitê de Governança (seed de teste)",
  },
  "Registro de Auditoria Interna - Ciclo 2026.xlsx": {
    type: "Registro de auditoria",
    area: "Auditoria Interna",
  },
  "Plano de Acao Corretiva - Acompanhamento.xlsx": {
    type: "Plano de ação",
    area: "Geotecnia",
  },
  "Registro de Consulta Publica e Audiencia com Comunidades.docx": {
    type: "Registro de auditoria",
    area: "Relacionamento com Comunidades",
  },
  "Estudo de Provisao Financeira para Fechamento.docx": {
    type: "Relatório técnico",
    area: "Financeiro",
  },
  "Relatorio de Simulado de Emergencia.docx": {
    type: "Registro de monitoramento",
    area: "Segurança",
  },
  "Matriz de Competencias e Treinamentos da Equipe Tecnica.xlsx": {
    type: "Outro",
    area: "Recursos Humanos",
  },
  "Plano de Acao de Emergencia (PAE) - Rev 1.docx": {
    type: "Plano de ação",
    area: "Segurança",
    version: "Rev. 1",
    previousVersionOf: "Plano de Acao de Emergencia (PAE).docx",
  },
};

async function main() {
  const installation = await prisma.installation.findFirst({
    where: { name: { contains: "Barragem Norte" } },
  });
  if (!installation) {
    throw new Error(
      'Instalação "Barragem Norte" não encontrada. Rode "npx prisma db seed" antes deste script.'
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const existingDocs = await prisma.documentFile.findMany({
    where: { installationId: installation.id },
    select: { id: true, title: true },
  });
  const existingTitles = new Set(existingDocs.map((d) => d.title));
  const idByTitle = new Map(existingDocs.map((d) => [d.title, d.id]));

  let created = 0;
  // Duas passagens: primeiro os documentos normais, depois os que dependem
  // de "previousVersionOf" (para já existir o id do documento anterior).
  const entries = Object.entries(DOC_META);
  const withoutVersion = entries.filter(([, m]) => !m.previousVersionOf);
  const withVersion = entries.filter(([, m]) => m.previousVersionOf);

  for (const [fileName, meta] of [...withoutVersion, ...withVersion]) {
    const title = fileName.replace(path.extname(fileName), "");
    if (existingTitles.has(title)) {
      console.log(`- ${fileName} já existe, pulando.`);
      continue;
    }

    const sourcePath = path.join(SOURCE_DIR, fileName);
    let buffer;
    try {
      buffer = await readFile(sourcePath);
    } catch {
      console.warn(`Arquivo não encontrado, pulando: ${fileName}`);
      continue;
    }

    const ext = path.extname(fileName);
    const storedFileName = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOAD_DIR, storedFileName), buffer);

    const extractedText = await extractText(buffer, ext);
    const previousVersionId = meta.previousVersionOf
      ? idByTitle.get(meta.previousVersionOf.replace(path.extname(meta.previousVersionOf), "")) ?? null
      : null;

    const doc = await prisma.documentFile.create({
      data: {
        title,
        type: meta.type,
        version: meta.version ?? "Rev. 0",
        areaResponsible: meta.area,
        confidentiality: meta.confidentiality ?? "INTERNO",
        targetAudience: meta.targetAudience ?? null,
        disclosureApproved: meta.disclosureApproved ?? false,
        disclosureApprovedBy: meta.disclosureApprovedBy ?? null,
        disclosureApprovedAt: meta.disclosureApproved ? new Date() : null,
        previousVersionId,
        fileName,
        filePath: storedFileName,
        mimeType: MIME_BY_EXT[ext] ?? "application/octet-stream",
        extractedText,
        installationId: installation.id,
      },
    });
    idByTitle.set(title, doc.id);
    existingTitles.add(title);
    created++;
    console.log(`✓ ${fileName} (${extractedText ? extractedText.length : 0} caracteres extraídos)`);
  }

  console.log(`\n${created} documento(s) novo(s) associados a "${installation.name}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
