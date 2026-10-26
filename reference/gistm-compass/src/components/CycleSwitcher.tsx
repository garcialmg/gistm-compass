interface CycleOption {
  id: string;
  name: string;
  closedAt: Date | null;
}

export function CycleSwitcher({
  cycles,
  currentCycleId,
}: {
  cycles: CycleOption[];
  currentCycleId: string;
}) {
  if (cycles.length <= 1) return null;

  return (
    <form method="get" className="flex items-center gap-2">
      <select name="cycle" defaultValue={currentCycleId} className="input w-44 text-xs">
        {cycles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.closedAt ? "(encerrado)" : "(ativo)"}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-mineral-300 px-3 py-2 text-xs font-medium text-mineral-700 hover:bg-mineral-50"
      >
        Ver ciclo
      </button>
    </form>
  );
}
