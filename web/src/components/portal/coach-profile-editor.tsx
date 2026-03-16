"use client";

import { useState } from "react";

import type { CoachRecord } from "@shared/features/findCoach/shared/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CoachProfileEditor({ coach }: { coach: CoachRecord | null }) {
  const [form, setForm] = useState({
    full_name: coach?.full_name ?? "",
    tagline: coach?.tagline ?? "",
    bio: coach?.bio ?? "",
    phone: coach?.phone ?? "",
    city: coach?.city ?? "",
    country: coach?.country ?? "",
    specialisations: (coach?.specialisations ?? []).join(", "),
    session_types: (coach?.session_types ?? []).join(", "),
    languages: (coach?.languages ?? []).join(", "),
    price_per_hour_usd: Number(coach?.price_per_hour_usd ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/coach-portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          tagline: form.tagline,
          bio: form.bio,
          phone: form.phone,
          city: form.city,
          country: form.country,
          specialisations: form.specialisations.split(",").map((value) => value.trim()).filter(Boolean),
          session_types: form.session_types.split(",").map((value) => value.trim()).filter(Boolean),
          languages: form.languages.split(",").map((value) => value.trim()).filter(Boolean),
          price_per_hour_usd: form.price_per_hour_usd,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save profile.");
      }
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="font-display text-4xl uppercase tracking-[0.08em]">Edit Profile</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Full name"
          value={form.full_name}
          onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
        />
        <Input
          placeholder="Tagline"
          value={form.tagline}
          onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
        />
        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
        <Input
          placeholder="Price per hour (USD)"
          type="number"
          value={form.price_per_hour_usd}
          onChange={(event) =>
            setForm((current) => ({ ...current, price_per_hour_usd: Number(event.target.value) }))
          }
        />
        <Input
          placeholder="City"
          value={form.city}
          onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
        />
        <Input
          placeholder="Country"
          value={form.country}
          onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
        />
      </div>
      <Textarea
        placeholder="Bio"
        value={form.bio}
        onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
      />
      <Input
        placeholder="Specialisations (comma separated)"
        value={form.specialisations}
        onChange={(event) => setForm((current) => ({ ...current, specialisations: event.target.value }))}
      />
      <Input
        placeholder="Session types (comma separated)"
        value={form.session_types}
        onChange={(event) => setForm((current) => ({ ...current, session_types: event.target.value }))}
      />
      <Input
        placeholder="Languages (comma separated)"
        value={form.languages}
        onChange={(event) => setForm((current) => ({ ...current, languages: event.target.value }))}
      />

      <div className="flex items-center gap-3">
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        {message ? <div className="text-sm text-muted">{message}</div> : null}
      </div>
    </Card>
  );
}
