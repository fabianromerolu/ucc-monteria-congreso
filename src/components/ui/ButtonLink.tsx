import { cn } from "@/src/lib/cn";
import Link from "next/link";


export function ButtonLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2",
        "bg-[var(--congreso-secondary)] text-[var(--congreso-text-on-dark)]",
        "hover:bg-[var(--congreso-secondary-dark)] active:opacity-95",
        "focus:ring-[color:rgba(31,114,123,0.35)]",
        className
      )}
    >
      {children}
    </Link>
  );
}
