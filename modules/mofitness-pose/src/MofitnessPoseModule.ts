import { NativeModule, requireNativeModule } from "expo";

import type { MofitnessPoseCapabilities, MofitnessPoseModuleEvents } from "./MofitnessPose.types";

declare class MofitnessPoseModule extends NativeModule<MofitnessPoseModuleEvents> {
  isSupported(): boolean;
  getCapabilities(): MofitnessPoseCapabilities;
}

export default requireNativeModule<MofitnessPoseModule>("MofitnessPose");
