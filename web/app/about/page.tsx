import Image from "next/image";

import { brandAssets } from "@/lib/brand-assets";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <SectionHeading
            label="About Mofitness"
            title="One Fitness Building. Many Rooms."
            description="Mofitness started as an AI-first mobile coach and is expanding into a full platform where verified coaches, local events, and users move through one shared system."
          />
          <div className="space-y-5 text-base leading-8 text-muted">
            <p>
              The core rule is consistency. Same coaches. Same brand language.
              Same dark premium tone. Same lime energy. When someone moves from
              the website into the app, nothing should feel disconnected.
            </p>
            <p>
              That is why the coach network matters so much. Approval on the web
              makes a coach live on the public site, the admin dashboard, and the
              mobile Find A Coach experience immediately.
            </p>
          </div>
        </div>
        <Card className="overflow-hidden p-0">
          <Image
            src={brandAssets.coaches.maleThinking}
            alt="Mofitness coach"
            className="h-auto w-full object-cover"
          />
        </Card>
      </div>
    </main>
  );
}
