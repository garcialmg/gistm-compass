"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export async function signupAction(formData: FormData) {
  const orgName = String(formData.get("orgName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!orgName || !name || !email || !password) {
    throw new Error("Preencha todos os campos para criar a organização.");
  }
  if (password.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Já existe uma conta cadastrada com esse email.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const organization = await prisma.organization.create({ data: { name: orgName } });
  await prisma.user.create({
    data: { email, passwordHash, name, organizationId: organization.id, role: "ADMIN" },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/instalacoes" });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error("Organização criada, mas não foi possível entrar automaticamente. Faça login.");
    }
    throw error;
  }
}
