// Helper compartilhado pelos smoke tests: os dados de demonstração agora
// exigem login (organização "Organização Demonstrativa", ver prisma/seed.ts).
export const DEMO_LOGIN = { email: "demo@gistmcompass.com", password: "demo12345" };

export async function loginAs(page, base, { email, password } = DEMO_LOGIN) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/instalacoes/);
}
