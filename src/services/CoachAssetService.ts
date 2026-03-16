import { Asset } from "expo-asset";

import { getAllCoachImages } from "../assets/coaches";

class CoachAssetService {
  private hasPreloaded = false;

  async preloadAll() {
    if (this.hasPreloaded) {
      return;
    }

    const sources = getAllCoachImages();
    await Promise.all(sources.map((source) => Asset.loadAsync(source)));
    this.hasPreloaded = true;
  }
}

const coachAssetService = new CoachAssetService();

export default coachAssetService;

