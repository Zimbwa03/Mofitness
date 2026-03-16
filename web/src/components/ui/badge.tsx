import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-lime",
        className,
      )}
    >
      {children}
    </span>
  );
}
