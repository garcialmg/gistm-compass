"use server";

import { assertInstallationOwnership } from "@/lib/context";
import { answerQuestionAboutInstallation, ChatNotConfiguredError, type ChatAnswer } from "@/lib/ai-chat";

export async function askQuestion(installationId: string, question: string): Promise<ChatAnswer> {
  await assertInstallationOwnership(installationId);

  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Digite uma pergunta.");
  }
  if (trimmed.length > 1000) {
    throw new Error("Pergunta muito longa (máximo 1000 caracteres).");
  }

  try {
    return await answerQuestionAboutInstallation(installationId, trimmed);
  } catch (error) {
    if (error instanceof ChatNotConfiguredError) {
      throw new Error(
        "O assistente ainda não está configurado nesta instância (falta a chave de API). " +
          "Peça para o administrador da plataforma configurar ANTHROPIC_API_KEY."
      );
    }
    throw error;
  }
}
