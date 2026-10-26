import { chromium } from "playwright";
import { loginAs } from "./test-helpers.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(process.cwd(), "scripts", "screenshots");
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

  console.log("1) Lista corporativa de instalações");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Barragem Norte");
  await page.waitForSelector("text=Barragem Sul");
  await shot(page, "instalacoes-lista");

  const hrefNorte = await page.locator('a:has-text("Barragem Norte")').first().getAttribute("href");
  const hrefSul = await page.locator('a:has-text("Barragem Sul")').first().getAttribute("href");
  const installationNorteId = hrefNorte.split("/")[2];
  const installationSulId = hrefSul.split("/")[2];
  console.log("Norte:", installationNorteId, "| Sul:", installationSulId);

  console.log("2) Abrir requisito 13.1 em Barragem Norte e validar como 'Não atende'");
  await page.goto(`${BASE}/instalacoes/${installationNorteId}/requisitos?q=13.1`, {
    waitUntil: "networkidle",
  });
  await page.locator('a[href*="/requisitos/"]').first().click();
  await page.waitForSelector("text=Leitura inteligente de evidências");
  const norteReqUrl = page.url();

  await page.selectOption('select[name="finalClassification"]', "NAO_ATENDE");
  await page.selectOption('select[name="finalRobustness"]', "AUSENTE");
  await page.selectOption('select[name="finalCriticality"]', "ALTA");
  await page.fill(
    'textarea[name="finalJustification"]',
    "Teste de isolamento: avaliação feita apenas para Barragem Norte."
  );
  // Obrigatório desde a migração `add_..._infosufficiency`: sem preencher,
  // o form não passa na validação nativa do navegador e o submit nem sai.
  await page.selectOption('select[name="finalInfoSufficiency"]', "SUFICIENTE");
  await page.fill('input[name="reviewedBy"]', "Teste Automatizado");
  await page.click('button:has-text("Validar avaliação")');
  await page.waitForSelector("text=Validado por Teste Automatizado");
  await shot(page, "norte-requisito-validado");

  console.log("3) Abrir o MESMO requisito (13.1) em Barragem Sul — deve estar intocado");
  const sulReqUrl = norteReqUrl.replace(installationNorteId, installationSulId);
  await page.goto(sulReqUrl, { waitUntil: "networkidle" });
  await shot(page, "sul-requisito-intocado");

  const bodyText = await page.locator("body").innerText();
  const isIsolated =
    bodyText.includes("Não avaliado") &&
    !bodyText.includes("Teste de isolamento") &&
    !bodyText.includes("Validado por Teste Automatizado");

  console.log("Isolamento entre instalações:", isIsolated ? "OK" : "FALHOU");
  if (!isIsolated) {
    errors.push("ISOLATION_FAILURE: dados de Barragem Norte vazaram para Barragem Sul");
  }

  console.log("4) Conferir dashboard de Barragem Norte (1 avaliado) x Sul (0 avaliados)");
  await page.goto(`${BASE}/instalacoes/${installationNorteId}/dashboard`, {
    waitUntil: "networkidle",
  });
  await shot(page, "norte-dashboard");
  const norteDash = await page.locator("body").innerText();

  await page.goto(`${BASE}/instalacoes/${installationSulId}/dashboard`, {
    waitUntil: "networkidle",
  });
  await shot(page, "sul-dashboard");
  const sulDash = await page.locator("body").innerText();

  const norteShows1 = /1\/77/.test(norteDash);
  const sulShows0 = /0\/77/.test(sulDash);
  console.log("Norte mostra 1/77:", norteShows1, "| Sul mostra 0/77:", sulShows0);
  if (!norteShows1 || !sulShows0) {
    errors.push("DASHBOARD_MISMATCH: contadores por instalação não bateram");
  }

  console.log("5) Lista corporativa deve refletir a diferença entre as instalações");
  await page.goto(`${BASE}/instalacoes`, { waitUntil: "networkidle" });
  await shot(page, "instalacoes-lista-final");

  await browser.close();

  console.log("\n=== Erros/falhas capturados ===");
  if (errors.length === 0) {
    console.log("Nenhum erro. Isolamento entre instalações confirmado.");
  } else {
    errors.forEach((e) => console.log(e));
    process.exitCode = 1;
  }
})().catch((err) => {
  console.error("FALHA NO SMOKE TEST:", err);
  process.exitCode = 1;
});
