"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function AvailabilityEditor({ initialAvailability }: { initialAvailability: Record<string, unknown> }) {
  const [availabilityText, setAvailabilityText] = useState(
    JSON.stringify(initialAvailability, null, 2),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(availabilityText) as Record<string, unknown>;
      const response = await fetch("/api/coach-portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: parsed }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save availability.");
      }
      setMessage("Availability updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="font-display text-4xl uppercase tracking-[0.08em]">Weekly Availability</div>
      <Textarea
        className="min-h-[240px] font-mono text-xs"
        value={availabilityText}
        onChange={(event) => setAvailabilityText(event.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving..." : "Save Availability"}
        </Button>
        {message ? <div className="text-sm text-muted">{message}</div> : null}
      </div>
    </Card>
  );
}
