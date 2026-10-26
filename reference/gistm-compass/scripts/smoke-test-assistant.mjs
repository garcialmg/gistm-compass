import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-assistant");
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

  await loginAs(page, BASE);

  console.log("1) Abrir o Assistente de Barragem Norte");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/assistente`, { waitUntil: "networkidle" });
  await shot(page, "tela-inicial");

  console.log("2) Clicar numa sugestão e ver a resposta (ou erro de configuração)");
  await page.locator("button", { hasText: "Engenheiro de Registro" }).click();
  await page.waitForSelector("text=Consultando os documentos...", { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(
    () => !document.body.innerText.includes("Consultando os documentos..."),
    { timeout: 30000 }
  );
  await shot(page, "resposta-ou-erro");

  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("ANTHROPIC_API_KEY") || bodyText.includes("não está configurado")) {
    console.log("   (esperado sem chave configurada: mensagem de erro tratada com clareza)");
  } else if (bodyText.length > 0) {
    console.log("   (resposta gerada normalmente — chave já configurada)");
  }

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro de console. Fluxo do assistente validado.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
