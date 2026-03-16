import { NativeModule, registerWebModule } from "expo";

import type { MofitnessPoseCapabilities, MofitnessPoseModuleEvents } from "./MofitnessPose.types";

class MofitnessPoseModule extends NativeModule<MofitnessPoseModuleEvents> {
  isSupported() {
    return false;
  }

  getCapabilities(): MofitnessPoseCapabilities {
    return {
      implementation: "stub",
      maxRecommendedFps: 0,
    };
  }
}

export default registerWebModule(MofitnessPoseModule, "MofitnessPoseModule");
