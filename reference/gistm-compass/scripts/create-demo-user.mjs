import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "demo@gistmcompass.com";
const PASSWORD = "demo12345";

const organization = await prisma.organization.findUniqueOrThrow({
  where: { id: "org_demo_default" },
});

const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log(`Usuário ${EMAIL} já existe (organização: ${organization.name}).`);
} else {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash,
      name: "Usuário Demonstração",
      role: "ADMIN",
      organizationId: organization.id,
    },
  });
  console.log(`Usuário criado: ${EMAIL} / senha: ${PASSWORD} (organização: ${organization.name})`);
}

await prisma.$disconnect();
