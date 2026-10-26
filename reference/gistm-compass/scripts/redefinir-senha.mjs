// Redefine a senha de um usuário pelo e-mail — mesma operação que a tela de
// gestão de usuários faz (item 27 do README): gera o hash bcrypt, grava e
// zera o bloqueio por tentativas erradas.
//
// Uso (com o servidor de dev PARADO):
//   node scripts/redefinir-senha.mjs "mgs@projetox.com" "SuaSenhaNova"
//
// A senha entra por argumento, então NÃO fica salva em nenhum arquivo.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const novaSenha = process.argv[3] ?? "";

if (!email || novaSenha.length < 8) {
  console.error('Uso: node scripts/redefinir-senha.mjs "email@dominio" "senha (mín. 8 caracteres)"');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
  });
  console.log(`✓ Senha redefinida para ${email} — conta desbloqueada.`);
} finally {
  await prisma.$disconnect();
}
