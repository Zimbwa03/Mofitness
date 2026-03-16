import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm text-muted sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="font-display text-3xl uppercase tracking-[0.12em] text-white">
            Mofitness
          </div>
          <p className="mt-3 max-w-xs leading-6">
            One coach network across web and mobile. Built for African athletes,
            communities, and coaches.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-white">Product</div>
          <Link href="/app">Download App</Link>
          <Link href="/find-a-coach">Find a Coach</Link>
          <Link href="/events">Events</Link>
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-white">Coaches</div>
          <Link href="/register-as-coach">Register</Link>
          <Link href="/coach-portal">Coach Portal</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-white">Company</div>
          <Link href="/about">About</Link>
          <Link href="/">Privacy</Link>
          <Link href="/">Terms</Link>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs uppercase tracking-[0.14em] text-muted">
        © Mofitness · Privacy · Terms
      </div>
    </footer>
  );
}
