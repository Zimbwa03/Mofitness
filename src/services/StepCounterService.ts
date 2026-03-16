import { Pedometer } from "expo-sensors";

class StepCounterService {
  private subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

  async isAvailable() {
    return Pedometer.isAvailableAsync();
  }

  async getTodaySteps() {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps;
  }

  watchSteps(onChange: (steps: number) => void) {
    this.stopWatching();
    this.subscription = Pedometer.watchStepCount((result) => {
      onChange(result.steps);
    });
  }

  stopWatching() {
    this.subscription?.remove();
    this.subscription = null;
  }
}

const stepCounterService = new StepCounterService();

export default stepCounterService;
