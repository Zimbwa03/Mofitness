"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignIn() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/coach-portal");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <Card className="space-y-5 p-8">
        <div className="font-display text-5xl uppercase tracking-[0.08em]">
          Sign In
        </div>
        <Input placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button className="w-full" onClick={() => void handleSignIn()}>
          Continue
        </Button>
        {message ? <div className="text-sm text-red-300">{message}</div> : null}
      </Card>
    </main>
  );
}
