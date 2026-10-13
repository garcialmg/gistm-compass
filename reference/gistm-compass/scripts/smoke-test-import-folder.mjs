import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-import");
fs.mkdirSync(SHOT_DIR, { recursive: true });
const DOCS_DIR = path.join(process.cwd(), "..", "Documentos de Teste GISTM");

let shotN = 0;
async function shot(page, name) {
  shotN += 1;
  const file = path.join(SHOT_DIR, `${String(shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("screenshot:", file);
}

const errors = [];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext().then((c) => c.newPage());
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await loginAs(page, BASE);

  console.log("1) Abrir Barragem Sul (vazia) -> Documentos");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefSul = await page.locator('a:has-text("Barragem Sul")').first().getAttribute("href");
  const installationId = hrefSul.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });
  await shot(page, "sul-antes-da-importacao");

  console.log("2) Selecionar a pasta de teste inteira no input de importação");
  const filePaths = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".docx") || f.endsWith(".xlsx"));
  console.log(`   ${filePaths.length} arquivos esperados na pasta`);

  await page.setInputFiles('input[name="files"]', DOCS_DIR);
  await page.selectOption('form:has(input[name="files"]) select[name="type"]', "Relatório técnico");
  await page.click('button:has-text("Importar todos os arquivos da pasta")');

  await page.waitForFunction(
    () => document.body.innerText.includes("texto indexado"),
    { timeout: 30000 }
  );
  await shot(page, "sul-depois-da-importacao");

  const bodyText = await page.locator("body").innerText();
  const importedCount = (bodyText.match(/texto indexado/g) || []).length;
  console.log(`Documentos com texto indexado após import: ${importedCount}`);
  if (importedCount < filePaths.length) {
    errors.push(
      `Esperava ${filePaths.length} documentos com texto indexado, achei ${importedCount}.`
    );
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Importação de pasta validada.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
