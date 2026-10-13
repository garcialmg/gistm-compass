import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-batch-ai");
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

  console.log("1) Abrir Barragem Norte -> Requisitos");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];

  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos`, { waitUntil: "networkidle" });
  await shot(page, "antes-do-lote");

  console.log("2) Rodar leitura por IA em todos os requisitos (pode levar alguns segundos)");
  const btn = page.locator('button:has-text("Simular leitura por IA em todos os requisitos")');
  await btn.click();
  // botão mostra estado de "Analisando..." enquanto processa
  await page.waitForSelector("text=Analisando os 77 requisitos", { timeout: 5000 }).catch(() => {
    console.log("   (estado de carregamento pode ter passado rápido demais para capturar)");
  });

  await page.waitForFunction(
    () => document.body.innerText.includes("77 de 77 requisitos com sugestão da IA gerada"),
    { timeout: 60000 }
  );
  await shot(page, "depois-do-lote");

  const bodyText = await page.locator("body").innerText();
  const match = bodyText.match(/(\d+) de 77 requisitos com sugestão da IA gerada/);
  const analyzed = match ? parseInt(match[1], 10) : 0;
  console.log(`Requisitos analisados pela IA: ${analyzed}`);
  if (analyzed !== 77) {
    errors.push(`Esperava 77 requisitos analisados, achei ${analyzed}.`);
  }

  const hasChart = await page.locator("text=Distribuição das classificações sugeridas").count();
  if (hasChart === 0) errors.push("Gráfico de distribuição não apareceu após rodar o lote.");

  console.log("3) Conferir que um requisito individual já tem sugestão sem precisar rodar de novo");
  await page.goto(`${BASE}/instalacoes/${installationId}/requisitos?q=1.1`, { waitUntil: "networkidle" });
  await page.locator('a[href*="/requisitos/"]').first().click();
  await page.waitForSelector("text=Última sugestão da IA");
  await shot(page, "requisito-individual-ja-tinha-sugestao");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Leitura em lote validada.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
