import { format } from "date-fns";
import Link from "next/link";
import clsx from "clsx";
import { updateActionStatus, addActionComment } from "@/app/instalacoes/[installationId]/planos-de-acao/actions";

const STATUS_STYLES: Record<string, string> = {
  ABERTA: "bg-mineral-100 text-mineral-600",
  EM_ANDAMENTO: "bg-state-warn-soft text-state-warn",
  CONCLUIDA: "bg-state-ok-soft text-state-ok",
};
const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};
const PRIORITY_STYLES: Record<string, string> = {
  ALTA: "bg-state-bad-soft text-state-bad",
  MEDIA: "bg-state-warn-soft text-state-warn",
  BAIXA: "bg-state-ok-soft text-state-ok",
};
const PRIORITY_LABELS: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export interface ActionItemData {
  id: string;
  description: string;
  responsible: string;
  area: string | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  closureEvidence: string | null;
  dependsOn: { id: string; description: string; status: string } | null;
  comments?: { id: string; author: string; text: string; createdAt: Date }[];
  logs?: { id: string; actor: string; event: string; note: string | null; createdAt: Date }[];
}

const LOG_EVENT_LABELS: Record<string, string> = {
  ACAO_CRIADA: "Ação criada",
  STATUS_ALTERADO: "Status alterado",
};

export function ActionItem({
  action,
  requirementCode,
  requirementHref,
  installationId,
  requirementId,
  overdue = false,
  readOnly = false,
}: {
  action: ActionItemData;
  requirementCode?: string;
  requirementHref?: string;
  installationId?: string;
  requirementId?: string;
  overdue?: boolean;
  readOnly?: boolean;
}) {
  const blockedByDependency =
    !!action.dependsOn && action.dependsOn.status !== "CONCLUIDA" && action.status !== "CONCLUIDA";

  return (
    <div
      className={clsx(
        "rounded-lg border p-3",
        overdue ? "border-state-bad-line bg-state-bad/5" : "border-mineral-100"
      )}
    >
      {requirementCode && requirementHref && (
        <Link href={requirementHref} className="text-xs font-medium text-brand-700 hover:underline">
          {requirementCode}
        </Link>
      )}
      <p className="mt-1 text-sm text-mineral-800">{action.description}</p>
      <p className="mt-1 text-xs text-mineral-500">
        {action.responsible}
        {action.area && ` · ${action.area}`}
        {action.dueDate && ` · até ${format(action.dueDate, "dd/MM/yyyy")}`}
      </p>

      {action.dependsOn && (
        <p className="mt-1 text-xs text-mineral-500">
          Depende de: {action.dependsOn.description}{" "}
          <span
            className={clsx(
              "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              STATUS_STYLES[action.dependsOn.status]
            )}
          >
            {STATUS_LABELS[action.dependsOn.status]}
          </span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium", PRIORITY_STYLES[action.priority])}>
          {PRIORITY_LABELS[action.priority]}
        </span>
        <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_STYLES[action.status])}>
          {STATUS_LABELS[action.status]}
        </span>
        {action.dueDate && (
          <span className={clsx("text-[11px]", overdue ? "font-medium text-state-bad" : "text-mineral-500")}>
            {overdue ? "Vencida em " : "até "}
            {format(action.dueDate, "dd/MM/yyyy")}
          </span>
        )}
      </div>

      {action.status === "CONCLUIDA" && action.closureEvidence && (
        <p className="mt-2 rounded bg-mineral-50 px-2 py-1.5 text-xs text-mineral-600">
          <span className="font-medium">Evidência de encerramento: </span>
          {action.closureEvidence}
        </p>
      )}

      {blockedByDependency && !readOnly && (
        <p className="mt-2 text-[11px] text-mineral-500">
          Bloqueada até a ação da qual depende ser concluída.
        </p>
      )}

      {!readOnly && action.status === "ABERTA" && !blockedByDependency && (
        <form action={updateActionStatus.bind(null, action.id, "EM_ANDAMENTO")} className="mt-2">
          <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
            Iniciar →
          </button>
        </form>
      )}

      {!readOnly && action.status === "EM_ANDAMENTO" && !blockedByDependency && (
        <form
          action={updateActionStatus.bind(null, action.id, "CONCLUIDA")}
          className="mt-2 space-y-1.5"
        >
          <input
            name="closureEvidence"
            required
            className="input text-xs"
            placeholder="Evidência de encerramento (obrigatória)"
          />
          <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
            Concluir →
          </button>
        </form>
      )}

      {((action.comments?.length ?? 0) > 0 || (action.logs?.length ?? 0) > 0) && (
        <details className="mt-2 border-t border-mineral-100 pt-2">
          <summary className="cursor-pointer select-none text-[11px] font-medium text-mineral-500 hover:text-mineral-600">
            Histórico e comentários ({(action.comments?.length ?? 0) + (action.logs?.length ?? 0)})
          </summary>
          <div className="mt-1.5 space-y-1.5">
            {action.logs?.map((log) => (
              <p key={log.id} className="text-[11px] text-mineral-500">
                <span className="font-medium text-mineral-500">
                  {LOG_EVENT_LABELS[log.event] ?? log.event}
                </span>{" "}
                · {log.actor} · {format(log.createdAt, "dd/MM/yyyy HH:mm")}
                {log.note && <span className="block text-mineral-500">{log.note}</span>}
              </p>
            ))}
            {action.comments?.map((c) => (
              <p key={c.id} className="rounded bg-mineral-50 px-2 py-1.5 text-[11px] text-mineral-600">
                <span className="font-medium">{c.author}</span>{" "}
                <span className="text-mineral-500">{format(c.createdAt, "dd/MM/yyyy HH:mm")}</span>
                <span className="block">{c.text}</span>
              </p>
            ))}
          </div>
        </details>
      )}

      {!readOnly && installationId && (
        <form action={addActionComment} className="mt-2 space-y-1.5 border-t border-mineral-100 pt-2">
          <input type="hidden" name="installationId" value={installationId} />
          <input type="hidden" name="actionId" value={action.id} />
          {requirementId && <input type="hidden" name="requirementId" value={requirementId} />}
          <input name="author" required placeholder="Seu nome" className="input w-full text-[11px]" />
          <input name="text" required placeholder="Comentar nesta ação..." className="input w-full text-[11px]" />
          <button type="submit" className="text-[11px] font-medium text-brand-700 hover:underline">
            Comentar →
          </button>
        </form>
      )}
    </div>
  );
}
