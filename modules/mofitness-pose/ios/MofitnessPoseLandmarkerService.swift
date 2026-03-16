import AVFoundation
import Foundation
import MediaPipeTasksVision
import UIKit

protocol MofitnessPoseLandmarkerLiveStreamDelegate: AnyObject {
  func poseLandmarkerService(_ service: MofitnessPoseLandmarkerService, didFinishDetection result: MofitnessPoseResultBundle?, error: Error?)
}

struct MofitnessPoseResultBundle {
  let inferenceTimeMs: Double
  let poseLandmarkerResult: PoseLandmarkerResult?
}

final class MofitnessPoseLandmarkerService: NSObject {
  weak var liveStreamDelegate: MofitnessPoseLandmarkerLiveStreamDelegate?

  private var poseLandmarker: PoseLandmarker?
  private let numPoses: Int
  private let minPoseDetectionConfidence: Float
  private let minPosePresenceConfidence: Float
  private let minTrackingConfidence: Float

  init?(
    numPoses: Int,
    minPoseDetectionConfidence: Float,
    minPosePresenceConfidence: Float,
    minTrackingConfidence: Float,
    liveStreamDelegate: MofitnessPoseLandmarkerLiveStreamDelegate?
  ) {
    guard let modelPath = Self.findModelPath() else {
      return nil
    }

    self.numPoses = numPoses
    self.minPoseDetectionConfidence = minPoseDetectionConfidence
    self.minPosePresenceConfidence = minPosePresenceConfidence
    self.minTrackingConfidence = minTrackingConfidence
    self.liveStreamDelegate = liveStreamDelegate
    super.init()

    guard createPoseLandmarker(modelPath: modelPath) else {
      return nil
    }
  }

  func detectAsync(sampleBuffer: CMSampleBuffer, orientation: UIImage.Orientation, timestampInMilliseconds: Int) {
    guard let image = try? MPImage(sampleBuffer: sampleBuffer, orientation: orientation) else {
      return
    }

    do {
      try poseLandmarker?.detectAsync(image: image, timestampInMilliseconds: timestampInMilliseconds)
    } catch {
      liveStreamDelegate?.poseLandmarkerService(self, didFinishDetection: nil, error: error)
    }
  }

  private func createPoseLandmarker(modelPath: String) -> Bool {
    if let landmarker = buildPoseLandmarker(modelPath: modelPath, delegate: .GPU) {
      poseLandmarker = landmarker
      return true
    }

    if let landmarker = buildPoseLandmarker(modelPath: modelPath, delegate: .CPU) {
      poseLandmarker = landmarker
      return true
    }

    return false
  }

  private func buildPoseLandmarker(modelPath: String, delegate: Delegate) -> PoseLandmarker? {
    let options = PoseLandmarkerOptions()
    options.runningMode = .liveStream
    options.numPoses = numPoses
    options.minPoseDetectionConfidence = minPoseDetectionConfidence
    options.minPosePresenceConfidence = minPosePresenceConfidence
    options.minTrackingConfidence = minTrackingConfidence
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = delegate
    options.poseLandmarkerLiveStreamDelegate = self

    do {
      return try PoseLandmarker(options: options)
    } catch {
      return nil
    }
  }

  private static func findModelPath() -> String? {
    let bundles = [Bundle.main, Bundle(for: MofitnessPoseModule.self)] + Bundle.allFrameworks + Bundle.allBundles
    for bundle in bundles {
      if let path = bundle.path(forResource: "pose_landmarker_lite", ofType: "task") {
        return path
      }
    }
    return nil
  }
}

extension MofitnessPoseLandmarkerService: PoseLandmarkerLiveStreamDelegate {
  func poseLandmarker(
    _ poseLandmarker: PoseLandmarker,
    didFinishDetection result: PoseLandmarkerResult?,
    timestampInMilliseconds: Int,
    error: Error?
  ) {
    let resultBundle = MofitnessPoseResultBundle(
      inferenceTimeMs: Date().timeIntervalSince1970 * 1000 - Double(timestampInMilliseconds),
      poseLandmarkerResult: result
    )

    liveStreamDelegate?.poseLandmarkerService(self, didFinishDetection: resultBundle, error: error)
  }
}
