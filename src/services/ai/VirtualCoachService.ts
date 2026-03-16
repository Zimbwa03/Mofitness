import * as Speech from "expo-speech";

import { useCoachStore } from "../../stores/coachStore";
import { BaseAIService } from "./BaseAIService";

interface CoachTurn {
  role: "user" | "assistant";
  content: string;
}

export class VirtualCoachService extends BaseAIService {
  private conversation: CoachTurn[] = [];

  speakCue(message: string) {
    Speech.speak(message);
  }

  resetConversation() {
    this.conversation = [];
  }

  async askCoach(userId: string, workoutContext: string, message: string) {
    const { coachName, selectedCoach } = useCoachStore.getState();
    this.conversation = [...this.conversation.slice(-9), { role: "user", content: message }];
    const history = this.conversation.map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`).join("\n");
    const prompt = `WORKOUT CONTEXT:\n${workoutContext}\n\nCHAT HISTORY:\n${history}\n\nUSER MESSAGE:\n${message}`;

    const response = await this.generateWithCache<{ response: string }>({
      feature: "virtual_coach_chat",
      userId,
      prompt,
      systemInstruction:
        `You are a motivational fitness coach named ${coachName}. You are ${selectedCoach === "female" ? "female" : "male"} and currently coaching a live session. Be concise, energetic, and encouraging. Only answer fitness-related questions.`,
      schema: {
        type: "object",
        properties: {
          response: { type: "string" },
        },
        required: ["response"],
      },
    });

    const coachReply = response.structuredData?.response ?? `${coachName}: Stay focused. You have this.`;
    this.conversation = [...this.conversation, { role: "assistant", content: coachReply }];

    return coachReply;
  }
}

const virtualCoachService = new VirtualCoachService();

export default virtualCoachService;
