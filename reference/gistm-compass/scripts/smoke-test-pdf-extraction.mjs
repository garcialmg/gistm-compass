import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-pdf-extraction");
fs.mkdirSync(SHOT_DIR, { recursive: true });

// PDF real do próprio padrão GISTM (documento público), usado só para provar
// que a extração funciona com um PDF de verdade, não um .txt disfarçado.
const SAMPLE_PDF = path.join(process.cwd(), "..", "global-tailings-standard_PT.pdf");

let shotN = 0;
async function shot(page, name) {
  shotN += 1;
  const file = path.join(SHOT_DIR, `${String(shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("screenshot:", file);
}

const errors = [];
const stamp = Date.now();
const TITLE = `Padrão GISTM (teste extração PDF) ${stamp}`;

(async () => {
  if (!fs.existsSync(SAMPLE_PDF)) {
    console.log(`PDF de amostra não encontrado em ${SAMPLE_PDF} — abortando teste.`);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  await loginAs(page, BASE);

  console.log("1) Abrir Documentos de Barragem Norte e enviar um PDF real");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });

  const uploadForm = page.locator('form:has(input[name="file"])');
  await uploadForm.locator('input[name="title"]').fill(TITLE);
  await uploadForm.locator('input[name="file"]').setInputFiles(SAMPLE_PDF);
  await uploadForm.locator('button[type="submit"]').click();
  await page.locator("li", { hasText: TITLE }).first().waitFor({ timeout: 15000 });
  await shot(page, "pdf-enviado");

  console.log("2) Verificar que o documento aparece marcado como 'texto indexado'");
  const docRow = page.locator("li", { hasText: TITLE }).first();
  const rowText = await docRow.innerText();
  if (!rowText.includes("texto indexado")) {
    errors.push("Documento PDF enviado não foi marcado como 'texto indexado' — extração falhou.");
  }

  console.log("3) Buscar por um trecho do conteúdo do PDF (não do título) e confirmar que o documento aparece");
  await page.goto(`${BASE}/instalacoes/${installationId}/documentos?q=rejeitos`, {
    waitUntil: "networkidle",
  });
  const foundBySearch = await page.locator("li", { hasText: TITLE }).count();
  if (foundBySearch === 0) {
    errors.push("Busca por conteúdo ('rejeitos') não encontrou o PDF enviado — texto extraído não está sendo indexado na busca.");
  }
  await shot(page, "busca-por-conteudo");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Extração de texto de PDF validada de ponta a ponta.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
