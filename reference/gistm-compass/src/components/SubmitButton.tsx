"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx(className, pending && "opacity-70")}>
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
