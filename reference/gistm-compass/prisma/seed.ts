import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TOPICS, THEMES, REQUIREMENTS } from "./gistm-content";

const prisma = new PrismaClient();

const DEMO_ADMIN_EMAIL = "demo@gistmcompass.com";
const DEMO_ADMIN_PASSWORD = "demo12345";

function firstSentence(text: string, maxLen: number): string {
  const dot = text.indexOf(". ");
  const candidate = dot > 0 && dot < maxLen ? text.slice(0, dot + 1) : text.slice(0, maxLen).trim() + "…";
  return candidate;
}

async function main() {
  console.log("Seed: limpando dados existentes...");
  await prisma.comment.deleteMany();
  await prisma.assessmentRevision.deleteMany();
  await prisma.justificationTemplate.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.action.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.documentFile.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.principle.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.installation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Seed: criando organização e usuário de demonstração...");
  const organization = await prisma.organization.create({
    data: { name: "Organização Demonstrativa" },
  });
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      name: "Usuário Demonstração",
      role: "ADMIN",
      organizationId: organization.id,
    },
  });
  console.log(`  -> login: ${DEMO_ADMIN_EMAIL} / senha: ${DEMO_ADMIN_PASSWORD}`);

  console.log("Seed: criando instalações demonstrativas (cenário de múltiplas estruturas)...");
  const DEMO_INSTALLATIONS = [
    "Barragem Norte — Demonstrativa",
    "Barragem Sul — Demonstrativa",
    "Pilha de Rejeitos Leste — Demonstrativa",
  ];
  for (const name of DEMO_INSTALLATIONS) {
    const installation = await prisma.installation.create({
      data: { name, organizationId: organization.id },
    });
    await prisma.cycle.create({
      data: { name: "Ciclo 2026.1", installationId: installation.id },
    });
  }

  console.log("Seed: criando base oficial de requisitos GISTM (6 tópicos, 15 princípios, 77 requisitos)...");

  const principleIdByNumber = new Map<number, string>();
  for (const topic of TOPICS) {
    const created = await prisma.principle.create({
      data: { number: topic.number, name: topic.name, nameEn: topic.nameEn },
    });
    principleIdByNumber.set(topic.number, created.id);
  }

  const themeIdByNumber = new Map<number, string>();
  for (const theme of THEMES) {
    const principleId = principleIdByNumber.get(theme.topicNumber);
    if (!principleId) throw new Error(`Tópico ${theme.topicNumber} não encontrado para o tema ${theme.number}`);
    const created = await prisma.theme.create({
      data: { number: theme.number, name: theme.name, nameEn: theme.nameEn, principleId },
    });
    themeIdByNumber.set(theme.number, created.id);
  }

  let requirementTotal = 0;
  for (const requirement of REQUIREMENTS) {
    const themeId = themeIdByNumber.get(requirement.themeNumber);
    if (!themeId) throw new Error(`Tema ${requirement.themeNumber} não encontrado para o requisito ${requirement.code}`);
    await prisma.requirement.create({
      data: {
        code: requirement.code,
        title: firstSentence(requirement.description, 90),
        titleEn: firstSentence(requirement.descriptionEn, 90),
        description: requirement.description,
        descriptionEn: requirement.descriptionEn,
        expectedEvidence:
          "Documentação típica esperada: procedimentos, registros, relatórios técnicos ou outras " +
          "evidências que demonstrem o cumprimento do texto do requisito acima.",
        expectedEvidenceEn:
          "Typical expected documentation: procedures, records, technical reports or other evidence " +
          "demonstrating conformance with the requirement text above.",
        themeId,
      },
    });
    requirementTotal++;
  }

  console.log(
    `Seed concluído: ${TOPICS.length} tópicos, ${THEMES.length} princípios/temas, ` +
      `${requirementTotal} requisitos oficiais do GISTM.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
