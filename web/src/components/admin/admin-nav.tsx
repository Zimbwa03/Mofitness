import Link from "next/link";

export function AdminNav() {
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/coaches", label: "Coach Applications" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  return (
    <nav className="flex flex-wrap gap-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-lime hover:text-lime"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
