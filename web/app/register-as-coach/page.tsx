import { CoachRegistrationForm } from "@/components/coaches/coach-registration-form";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";

export default function RegisterAsCoachPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <Card className="p-8">
          <SectionHeading
            label="Coach Network"
            title="Join The Mofitness Coach Network"
            description="Reach thousands of clients, get verified, and manage your coach profile on the same system that powers the mobile app."
          />
          <div className="mt-8 grid gap-4 rounded-2xl border border-white/5 bg-black/30 p-4 md:grid-cols-3">
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">50,000+</div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">Users</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">100+</div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">Coaches</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">Free</div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">To Join</div>
            </div>
          </div>
        </Card>

        <CoachRegistrationForm />
      </div>
    </main>
  );
}
