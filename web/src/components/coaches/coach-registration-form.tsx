"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const steps = [
  "Create Account",
  "Profile",
  "Specialisations",
  "Certifications",
  "Identity",
  "Social & Location",
  "Review",
] as const;

export function CoachRegistrationForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    city: "",
    tagline: "",
    bio: "",
    experienceYears: "3",
    specialisations: "weight_loss,muscle_gain",
    sessionTypes: "in_person,virtual",
    languages: "English",
    pricePerHourUsd: "45",
    certificationName: "NASM Certified Personal Trainer",
    issuingOrganisation: "NASM",
    yearObtained: "2024",
    certificateNumber: "",
    websiteUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    address: "",
    radiusKm: "20",
    availability: "{\"mon\":[9,17],\"tue\":[9,17],\"wed\":[9,17]}",
    declarationsAccepted: false,
  });
  const [files, setFiles] = useState<{
    profilePhoto?: File | null;
    certificationFile?: File | null;
    governmentIdFront?: File | null;
    governmentIdBack?: File | null;
    proofOfAddress?: File | null;
    selfieWithId?: File | null;
  }>({});

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return Boolean(form.fullName && form.email && form.password && form.country && form.city);
    }

    if (step === 1) {
      return Boolean(form.tagline && form.bio.length >= 80);
    }

    if (step === 6) {
      return form.declarationsAccepted;
    }

    return true;
  }, [form, step]);

  async function handleSubmit() {
    setSubmitting(true);
    setMessage(null);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        payload.append(key, String(value));
      });

      Object.entries(files).forEach(([key, value]) => {
        if (value) {
          payload.append(key, value);
        }
      });

      const response = await fetch("/api/coaches", {
        method: "POST",
        body: payload,
      });

      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to submit coach application.");
      }

      setMessage(result.message || "Application submitted successfully.");
      setStep(0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit coach application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-8">
        <div className="text-sm uppercase tracking-[0.22em] text-lime">
          Step {step + 1} of {steps.length}
        </div>
        <div className="mt-3 font-display text-5xl uppercase tracking-[0.08em]">
          {steps[step]}
        </div>
      </div>

      <div className="grid gap-4">
        {step === 0 ? (
          <>
            <Input placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
            <Input placeholder="Email address" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <Input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            <Input placeholder="Phone number" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              <Input placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Input placeholder="Tagline" value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} />
            <Textarea placeholder="Bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            <Input type="number" placeholder="Years of experience" value={form.experienceYears} onChange={(event) => setForm((current) => ({ ...current, experienceYears: event.target.value }))} />
            <div className="text-sm text-muted">Profile photo</div>
            <Input type="file" accept="image/*" onChange={(event) => setFiles((current) => ({ ...current, profilePhoto: event.target.files?.[0] ?? null }))} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Input placeholder="Specialisations (comma separated)" value={form.specialisations} onChange={(event) => setForm((current) => ({ ...current, specialisations: event.target.value }))} />
            <Input placeholder="Session types (comma separated)" value={form.sessionTypes} onChange={(event) => setForm((current) => ({ ...current, sessionTypes: event.target.value }))} />
            <Input placeholder="Languages" value={form.languages} onChange={(event) => setForm((current) => ({ ...current, languages: event.target.value }))} />
            <Input type="number" placeholder="Price per hour USD" value={form.pricePerHourUsd} onChange={(event) => setForm((current) => ({ ...current, pricePerHourUsd: event.target.value }))} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Input placeholder="Certification name" value={form.certificationName} onChange={(event) => setForm((current) => ({ ...current, certificationName: event.target.value }))} />
            <Input placeholder="Issuing organisation" value={form.issuingOrganisation} onChange={(event) => setForm((current) => ({ ...current, issuingOrganisation: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Year obtained" value={form.yearObtained} onChange={(event) => setForm((current) => ({ ...current, yearObtained: event.target.value }))} />
              <Input placeholder="Certificate number" value={form.certificateNumber} onChange={(event) => setForm((current) => ({ ...current, certificateNumber: event.target.value }))} />
            </div>
            <Input type="file" accept=".pdf,image/*" onChange={(event) => setFiles((current) => ({ ...current, certificationFile: event.target.files?.[0] ?? null }))} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div className="text-sm text-muted">Government ID front</div>
            <Input type="file" accept=".pdf,image/*" onChange={(event) => setFiles((current) => ({ ...current, governmentIdFront: event.target.files?.[0] ?? null }))} />
            <div className="text-sm text-muted">Government ID back</div>
            <Input type="file" accept=".pdf,image/*" onChange={(event) => setFiles((current) => ({ ...current, governmentIdBack: event.target.files?.[0] ?? null }))} />
            <div className="text-sm text-muted">Proof of address</div>
            <Input type="file" accept=".pdf,image/*" onChange={(event) => setFiles((current) => ({ ...current, proofOfAddress: event.target.files?.[0] ?? null }))} />
            <div className="text-sm text-muted">Selfie with ID</div>
            <Input type="file" accept="image/*" onChange={(event) => setFiles((current) => ({ ...current, selfieWithId: event.target.files?.[0] ?? null }))} />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <Input placeholder="Website" value={form.websiteUrl} onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))} />
            <Input placeholder="Instagram" value={form.instagramUrl} onChange={(event) => setForm((current) => ({ ...current, instagramUrl: event.target.value }))} />
            <Input placeholder="Facebook" value={form.facebookUrl} onChange={(event) => setForm((current) => ({ ...current, facebookUrl: event.target.value }))} />
            <Input placeholder="LinkedIn" value={form.linkedinUrl} onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))} />
            <Input placeholder="YouTube" value={form.youtubeUrl} onChange={(event) => setForm((current) => ({ ...current, youtubeUrl: event.target.value }))} />
            <Input placeholder="Street address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Travel radius (km)" value={form.radiusKm} onChange={(event) => setForm((current) => ({ ...current, radiusKm: event.target.value }))} />
              <Input placeholder='Availability JSON' value={form.availability} onChange={(event) => setForm((current) => ({ ...current, availability: event.target.value }))} />
            </div>
          </>
        ) : null}

        {step === 6 ? (
          <Card className="space-y-4 bg-black/30 p-5">
            <div className="text-sm text-muted">
              Review your application details. Submitting creates your auth account,
              stores your draft coach profile, assigns the coach role, and sends your
              application for admin review.
            </div>
            <label className="flex items-start gap-3 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.declarationsAccepted}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    declarationsAccepted: event.target.checked,
                  }))
                }
              />
              I confirm the information is accurate, I agree to the coach terms,
              and I consent to verification.
            </label>
          </Card>
        ) : null}
      </div>

      {message ? <div className="mt-6 text-sm text-lime">{message}</div> : null}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((current) => current + 1)} disabled={!canAdvance}>
            Continue
          </Button>
        ) : (
          <Button onClick={() => void handleSubmit()} disabled={!canAdvance || submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        )}
      </div>
    </Card>
  );
}
