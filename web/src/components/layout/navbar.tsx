import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/lib/brand-assets";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={brandAssets.logo}
            alt="Mofitness logo"
            width={44}
            height={44}
            className="h-11 w-11"
          />
          <div>
            <div className="font-display text-3xl uppercase tracking-[0.12em]">Mofitness</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted">
              Built For Your Grind
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex">
          <Link href="/about">About</Link>
          <Link href="/find-a-coach">Find a Coach</Link>
          <Link href="/events">Events</Link>
          <Link href="/register-as-coach">For Coaches</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/app">Download App</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link href="/register-as-coach">I'm a Coach</Link>
          </Button>
          <Link href="/auth/sign-in" className="text-sm text-muted transition hover:text-white">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
