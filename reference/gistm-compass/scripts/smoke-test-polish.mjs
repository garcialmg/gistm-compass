import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots-polish");
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

  console.log("1) Favicon customizado (icon.svg) responde");
  const iconResp = await page.goto(`${BASE}/icon.svg`);
  if (!iconResp || iconResp.status() !== 200) errors.push(`icon.svg não respondeu 200 (status ${iconResp?.status()})`);
  const iconBody = await iconResp.text();
  if (!iconBody.includes("<svg")) errors.push("icon.svg não parece ser um SVG válido.");

  console.log("2) Título dinâmico da aba por instalação");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const installationId = hrefNorte.split("/")[2];
  await page.goto(`${BASE}/instalacoes/${installationId}/dashboard`, { waitUntil: "networkidle" });
  const title = await page.title();
  if (!title.includes("Barragem Norte") || !title.includes("GISTM Compass")) {
    errors.push(`Título da aba não ficou como esperado: "${title}"`);
  }
  await shot(page, "dashboard-titulo");

  console.log("3) Rodapé do menu sem linguagem de 'MVP/simulada'");
  const footerHasOldText = await page.locator("text=MVP demonstrativo").count();
  if (footerHasOldText > 0) errors.push("Rodapé ainda mostra o texto antigo 'MVP demonstrativo'.");
  const footerHasNewText = await page.locator("text=validação técnica sempre humana").count();
  if (footerHasNewText === 0) errors.push("Rodapé não mostra o novo texto profissional.");

  console.log("4) Página 404 com identidade visual");
  await page.goto(`${BASE}/instalacoes/id-que-nao-existe-123/dashboard`, { waitUntil: "networkidle" });
  await shot(page, "pagina-404");
  const has404 = await page.locator("text=Não encontramos essa página").count();
  if (has404 === 0) errors.push("Página 404 customizada não apareceu para instalação inexistente.");
  const hasBackLink = await page.locator('a:has-text("Voltar para instalações")').count();
  if (hasBackLink === 0) errors.push("Página 404 não tem o link de volta.");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Polimento profissional validado.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
