import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-docs");
fs.mkdirSync(SHOT_DIR, { recursive: true });

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

  console.log("1) Abrir Barragem Norte -> Documentos");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/documentos`, { waitUntil: "networkidle" });
  const docCount = await page.locator("text=texto indexado").count();
  console.log(`Documentos com texto indexado visíveis: ${docCount}`);
  if (docCount < 15) errors.push(`Esperava pelo menos 15 documentos com texto indexado, achei ${docCount}.`);
  await shot(page, "documentos-base-completa");

  const CASES = [
    { query: "13.1", expectDoc: "Plano de Acao de Emergencia" },
    { query: "7.1", expectDoc: "Planilha de Leituras de Instrumentacao" },
    { query: "9.1", expectDoc: "Carta de Nomeacao" },
    { query: "4.1", expectDoc: "Matriz de Risco" },
  ];

  for (const { query, expectDoc } of CASES) {
    console.log(`2) Requisito ${query}: simular leitura de IA`);
    await page.goto(`${BASE}/instalacoes/${installationId}/requisitos?q=${query}`, {
      waitUntil: "networkidle",
    });
    await page.locator('a[href*="/requisitos/"]').first().click();
    await page.waitForSelector("text=Leitura inteligente de evidências");
    await page.click('button:has-text("Simular leitura por IA")');
    await page.waitForSelector("text=Última sugestão da IA");

    const bodyText = await page.locator("body").innerText();
    const found = bodyText.includes(expectDoc.replace(/o /g, "").slice(0, 10)) || bodyText.toLowerCase().includes(expectDoc.toLowerCase().slice(0, 12));
    console.log(`   evidência esperada ("${expectDoc}") encontrada na página: ${found}`);
    await shot(page, `requisito-${query.replace(".", "-")}-ia`);
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
