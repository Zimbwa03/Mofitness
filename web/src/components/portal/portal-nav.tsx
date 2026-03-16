import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/coach-portal", label: "Dashboard" },
  { href: "/coach-portal/profile", label: "My Profile" },
  { href: "/coach-portal/clients", label: "Clients" },
  { href: "/coach-portal/messages", label: "Messages" },
  { href: "/coach-portal/schedule", label: "Availability" },
  { href: "/coach-portal/earnings", label: "Earnings" },
];

export function PortalNav({ activePath }: { activePath: string }) {
  return (
    <nav className="flex flex-wrap gap-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-lime hover:text-lime",
            activePath === link.href && "border-lime bg-lime/10 text-lime",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
