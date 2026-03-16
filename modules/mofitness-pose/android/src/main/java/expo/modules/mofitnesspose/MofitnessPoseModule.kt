package expo.modules.mofitnesspose

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MofitnessPoseModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MofitnessPose")

    Function("isSupported") {
      true
    }

    Function("getCapabilities") {
      mapOf(
        "implementation" to "native-live-stream",
        "maxRecommendedFps" to 30,
      )
    }

    View(MofitnessPoseView::class) {
      Prop("active") { view: MofitnessPoseView, active: Boolean? ->
        view.setActive(active ?: false)
      }

      Prop("cameraFacing") { view: MofitnessPoseView, cameraFacing: String? ->
        view.setCameraFacing(cameraFacing ?: "front")
      }

      Prop("targetFps") { view: MofitnessPoseView, targetFps: Int? ->
        view.setTargetFps(targetFps ?: 30)
      }

      Prop("numPoses") { view: MofitnessPoseView, numPoses: Int? ->
        view.setNumPoses(numPoses ?: 1)
      }

      Prop("minPoseDetectionConfidence") { view: MofitnessPoseView, confidence: Float? ->
        view.setMinPoseDetectionConfidence(confidence ?: 0.55f)
      }

      Prop("minPosePresenceConfidence") { view: MofitnessPoseView, confidence: Float? ->
        view.setMinPosePresenceConfidence(confidence ?: 0.55f)
      }

      Prop("minTrackingConfidence") { view: MofitnessPoseView, confidence: Float? ->
        view.setMinTrackingConfidence(confidence ?: 0.55f)
      }

      Events("onPoseFrame", "onStatusChange")
    }
  }
}
