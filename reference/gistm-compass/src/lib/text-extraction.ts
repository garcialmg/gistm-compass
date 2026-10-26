import mammoth from "mammoth";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";

const TEXT_EXTENSIONS = new Set([".txt", ".md"]);
// 200k caracteres cobre a esmagadora maioria dos relatórios técnicos reais
// (um documento de ~100 páginas gira em torno de 200-300k caracteres) —
// bem acima do limite anterior (20k), que cortava relatórios de projeto
// detalhado e memoriais de cálculo bem antes do fim. O parsing já processa
// o documento inteiro antes de truncar (pdf-parse não tem como "parar
// cedo"), então esse aumento não pesa no tempo de extração — só no
// tamanho do texto guardado.
const MAX_CHARS = 200_000;

/**
 * Extrai texto plano de um arquivo para alimentar a busca e o simulador de
 * IA. Suporta .txt/.md (leitura direta), .docx (via mammoth), .xlsx (via
 * exceljs, concatenando o conteúdo textual das células) e .pdf (via
 * pdf-parse — mesma biblioteca usada para transcrever o texto oficial do
 * GISTM em `scripts/extract-official-pdf.mjs`). Falha na extração (PDF
 * escaneado sem camada de texto, por exemplo) ou outros formatos (imagens
 * etc.) retornam null — a leitura de IA cai de volta para usar apenas os
 * metadados (título/tipo) desses documentos.
 */
export async function extractText(buffer: Buffer, ext: string): Promise<string | null> {
  const normalizedExt = ext.toLowerCase();

  try {
    if (TEXT_EXTENSIONS.has(normalizedExt)) {
      return buffer.toString("utf-8").slice(0, MAX_CHARS);
    }

    if (normalizedExt === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_CHARS);
    }

    if (normalizedExt === ".xlsx") {
      const workbook = new ExcelJS.Workbook();
      // exceljs tipa `.load` contra uma versão ligeiramente diferente do
      // Buffer do Node; o valor em tempo de execução é compatível.
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
      const parts: string[] = [];
      workbook.eachSheet((sheet) => {
        parts.push(`# ${sheet.name}`);
        sheet.eachRow((row) => {
          const cells = (row.values as unknown[])
            .slice(1)
            .map((v) => (v === null || v === undefined ? "" : String(v)))
            .filter(Boolean);
          if (cells.length > 0) parts.push(cells.join(" | "));
        });
      });
      return parts.join("\n").slice(0, MAX_CHARS);
    }

    if (normalizedExt === ".pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        const text = result.text.trim();
        return text ? text.slice(0, MAX_CHARS) : null;
      } finally {
        await parser.destroy();
      }
    }
  } catch {
    // Arquivo corrompido ou em formato inesperado: segue sem texto extraído.
    return null;
  }

  return null;
}
