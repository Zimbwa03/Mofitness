import Link from "next/link";
import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "https://play.google.com/store";

export default function AppDownloadPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <Card className="p-10 text-center">
        <SectionHeading
          label="Download The App"
          title="Your Entire Fitness Life. One App."
          description="Use the mobile app for workouts, nutrition, running, challenges, and in-app coach conversations backed by the same Supabase project as the web platform."
          align="center"
        />
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
              <Smartphone className="mr-2 h-5 w-5" />
              App Store
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
              <Smartphone className="mr-2 h-5 w-5" />
              Google Play
            </a>
          </Button>
        </div>
        <div className="mt-10 text-sm text-muted">
          Already a coach? <Link href="/register-as-coach" className="text-lime">Apply here</Link>.
        </div>
      </Card>
    </main>
  );
}
