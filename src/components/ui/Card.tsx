import { cn } from "@/src/lib/cn";


export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border p-6 shadow-sm", className)}
      style={{
        background: "var(--congreso-surface)",
        borderColor: "var(--congreso-border)",
        backdropFilter: "blur(10px)",
      }}
      {...props}
    />
  );
}
