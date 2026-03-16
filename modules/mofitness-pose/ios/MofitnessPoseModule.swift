import ExpoModulesCore

public class MofitnessPoseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MofitnessPose")

    Function("isSupported") {
      true
    }

    Function("getCapabilities") {
      return [
        "implementation": "native-live-stream",
        "maxRecommendedFps": 30
      ]
    }

    View(MofitnessPoseView.self) {
      Prop("active") { (view: MofitnessPoseView, active: Bool?) in
        view.setActive(active ?? false)
      }

      Prop("cameraFacing") { (view: MofitnessPoseView, cameraFacing: String?) in
        view.setCameraFacing(cameraFacing ?? "front")
      }

      Prop("targetFps") { (view: MofitnessPoseView, targetFps: Int?) in
        view.setTargetFps(targetFps ?? 30)
      }

      Prop("numPoses") { (view: MofitnessPoseView, numPoses: Int?) in
        view.setNumPoses(numPoses ?? 1)
      }

      Prop("minPoseDetectionConfidence") { (view: MofitnessPoseView, confidence: Double?) in
        view.setMinPoseDetectionConfidence(Float(confidence ?? 0.55))
      }

      Prop("minPosePresenceConfidence") { (view: MofitnessPoseView, confidence: Double?) in
        view.setMinPosePresenceConfidence(Float(confidence ?? 0.55))
      }

      Prop("minTrackingConfidence") { (view: MofitnessPoseView, confidence: Double?) in
        view.setMinTrackingConfidence(Float(confidence ?? 0.55))
      }

      Events("onPoseFrame", "onStatusChange")
    }
  }
}
