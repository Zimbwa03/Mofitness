"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { FitnessEventRecord } from "@shared/features/findCoach/shared/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminEventManager({ events }: { events: FitnessEventRecord[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    country: "",
    starts_at: "",
    ends_at: "",
    event_type: "bootcamp",
  });
  const [message, setMessage] = useState<string | null>(null);

  async function createEvent() {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        ...form,
        is_free: true,
        status: "draft",
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Unable to create event.");
      return;
    }

    setMessage("Event saved.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
      <Card className="space-y-4 p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">
          Create Event
        </div>
        <Input placeholder="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
          <Input placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="datetime-local" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} />
          <Input type="datetime-local" value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} />
        </div>
        <Button onClick={() => void createEvent()}>Save Draft</Button>
        {message ? <div className="text-sm text-lime">{message}</div> : null}
      </Card>

      <Card className="space-y-4 p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">
          Existing Events
        </div>
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-muted">
            <div className="font-semibold text-white">{event.title}</div>
            <div className="mt-1">
              {event.status} · {event.city}, {event.country}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
