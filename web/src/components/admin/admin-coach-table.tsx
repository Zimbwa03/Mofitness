"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CoachRecord } from "@shared/features/findCoach/shared/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminCoachTable({ coaches }: { coaches: CoachRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(coachId: string, status: string) {
    setBusyId(coachId);

    try {
      await fetch("/api/coaches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coachId,
          status,
        }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-4 border-b border-white/5 px-6 py-4 text-xs uppercase tracking-[0.16em] text-muted">
        <div>Name</div>
        <div>Location</div>
        <div>Specialisations</div>
        <div>Status</div>
        <div>Actions</div>
      </div>
      {coaches.map((coach) => (
        <div
          key={coach.id}
          className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] gap-4 border-b border-white/5 px-6 py-4 text-sm text-muted"
        >
          <div className="text-white">{coach.full_name}</div>
          <div>
            {coach.city}, {coach.country}
          </div>
          <div>{coach.specialisations.slice(0, 2).join(", ")}</div>
          <div>{coach.status}</div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void updateStatus(coach.id, "approved")}
              disabled={busyId === coach.id}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void updateStatus(coach.id, "under_review")}
              disabled={busyId === coach.id}
            >
              Review
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void updateStatus(coach.id, "rejected")}
              disabled={busyId === coach.id}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </Card>
  );
}
