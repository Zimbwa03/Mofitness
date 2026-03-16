import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
}: {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-4", align === "center" && "text-center")}>
      {label ? <Badge>{label}</Badge> : null}
      <div className="space-y-3">
        <h2 className="font-display text-5xl uppercase leading-none tracking-[0.08em] sm:text-6xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
