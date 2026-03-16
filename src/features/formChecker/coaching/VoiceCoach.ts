import * as Speech from "expo-speech";

import type { ActiveFormError, CoachingSensitivity } from "../types";

type QueueItem = {
  text: string;
  errorId?: string;
  severity?: string;
};

class VoiceCoach {
  private lastSpokenAt = new Map<string, number>();
  private speakingQueue: QueueItem[] = [];
  private isSpeaking = false;
  private cooldowns = {
    critical: 3000,
    warning: 6000,
    info: 10000,
    milestone: 2000,
  };

  async speak(text: string, errorId?: string, severity?: string) {
    const cooldown = this.cooldowns[severity as keyof typeof this.cooldowns] ?? 5000;
    const lastSpoken = errorId ? this.lastSpokenAt.get(errorId) ?? 0 : 0;

    if (Date.now() - lastSpoken < cooldown) {
      return;
    }

    if (errorId) {
      this.lastSpokenAt.set(errorId, Date.now());
    }

    this.speakingQueue.push({ text, errorId, severity });
    void this.processQueue();
  }

  announceErrors(errors: ActiveFormError[], sensitivity: CoachingSensitivity) {
    const permitted = errors.filter((error) => {
      if (sensitivity === "low") {
        return error.severity === "critical";
      }
      if (sensitivity === "medium") {
        return error.severity !== "info";
      }
      return true;
    });

    const sorted = [...permitted].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    const toSpeak = sorted.find((error) => {
      const lastSpoken = this.lastSpokenAt.get(error.id) ?? 0;
      const cooldown = this.cooldowns[error.severity];
      return Date.now() - lastSpoken > cooldown;
    });

    if (toSpeak) {
      void this.speak(toSpeak.message, toSpeak.id, toSpeak.severity);
    }
  }

  announceRep(repCount: number, formScore: number, targetReps: number) {
    const messages = {
      good: [`Rep ${repCount}. Form score ${formScore} percent.`, `${repCount} reps. Looking strong.`],
      mid: [`Rep ${repCount}. Watch your form.`, `${repCount} down. Stay tight.`],
      poor: [`Rep ${repCount}. ${formScore} percent form. Slow down and reset.`],
    };

    const quality = formScore >= 85 ? "good" : formScore >= 65 ? "mid" : "poor";
    const options = messages[quality];
    const message = options[Math.floor(Math.random() * options.length)];
    void this.speak(message, `rep_${repCount}`, "milestone");

    if (repCount === targetReps) {
      setTimeout(() => {
        void this.speak(`Set complete. ${formScore} percent overall form.`);
      }, 1200);
    }
  }

  reset() {
    this.lastSpokenAt.clear();
    this.speakingQueue = [];
    this.isSpeaking = false;
    Speech.stop();
  }

  private async processQueue() {
    if (this.isSpeaking || this.speakingQueue.length === 0) {
      return;
    }

    this.isSpeaking = true;
    const item = this.speakingQueue.shift();

    if (!item) {
      this.isSpeaking = false;
      return;
    }

    await new Promise<void>((resolve) => {
      Speech.speak(item.text, {
        rate: 1.04,
        pitch: 1,
        language: "en-ZA",
        onDone: resolve,
        onStopped: resolve,
        onError: () => resolve(),
      });
    });

    this.isSpeaking = false;
    void this.processQueue();
  }
}

const voiceCoach = new VoiceCoach();

export default voiceCoach;
