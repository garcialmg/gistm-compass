"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/instalacoes" });
  } catch (error) {
    if (error instanceof AuthError) {
      // `code` sobrevive tanto se o NextAuth propagar o erro lançado em
      // `authorize` direto quanto se envolver numa AuthError genérica com o
      // original em `cause.err` — checar os dois cobre ambos os casos.
      const code =
        (error as { code?: string }).code ??
        (error as { cause?: { err?: { code?: string } } }).cause?.err?.code;
      redirect(code === "conta_bloqueada" ? "/login?erro=bloqueado" : "/login?erro=1");
    }
    throw error;
  }
}
