"use client";

import { useState } from "react";

import type { FitnessEventRecord } from "@shared/features/findCoach/shared/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function EventRegistrationForm({ event }: { event: FitnessEventRecord }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    tshirt_size: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setMessage(null);
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "register",
        eventId: event.id,
        ...form,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      checkoutUrl?: string | null;
      registration?: { ticket_code?: string };
    };

    if (!response.ok) {
      setMessage(payload.error || "Unable to register.");
      return;
    }

    if (payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }

    setMessage(
      `Registration confirmed. Ticket code: ${payload.registration?.ticket_code ?? "created"}.`,
    );
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Full name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} />
      <Input placeholder="Email address" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
      <Input placeholder="Phone number" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
      <Input placeholder="Emergency contact" value={form.emergency_contact_name} onChange={(event) => setForm((current) => ({ ...current, emergency_contact_name: event.target.value }))} />
      <Input placeholder="Emergency phone" value={form.emergency_contact_phone} onChange={(event) => setForm((current) => ({ ...current, emergency_contact_phone: event.target.value }))} />
      <Input placeholder="T-shirt size" value={form.tshirt_size} onChange={(event) => setForm((current) => ({ ...current, tshirt_size: event.target.value }))} />
      <Textarea placeholder="Medical conditions or important notes" value={form.medical_conditions} onChange={(event) => setForm((current) => ({ ...current, medical_conditions: event.target.value }))} />
      <Button className="w-full" onClick={() => void handleSubmit()}>
        {event.is_free ? "Complete Registration" : "Continue To Payment"}
      </Button>
      {message ? <div className="text-sm text-lime">{message}</div> : null}
    </div>
  );
}
