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
    <Link href={href} className={cn("btn btn-primary", className)}>
      {children}
    </Link>
  );
}
