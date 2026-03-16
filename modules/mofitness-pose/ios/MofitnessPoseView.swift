import ExpoModulesCore
import Foundation
import UIKit

final class MofitnessPoseView: ExpoView {
  let onPoseFrame = EventDispatcher()
  let onStatusChange = EventDispatcher()

  private let previewView = UIView()
  private var cameraService: MofitnessPoseCameraService?
  private var landmarkerService: MofitnessPoseLandmarkerService?
  private let stateQueue = DispatchQueue(label: "com.mofitness.pose.ios.state")
  private var isActive = false
  private var isMounted = false
  private var cameraFacing = "front"
  private var requestedTargetFps = 30
  private var effectiveTargetFps = 30
  private var numPoses = 1
  private var minPoseDetectionConfidence: Float = 0.55
  private var minPosePresenceConfidence: Float = 0.55
  private var minTrackingConfidence: Float = 0.55
  private var inferenceInFlight = false
  private var lastSubmittedTimestampMs = 0
  private var processedFrames = 0
  private var droppedFrames = 0
  private var actualFps = 0
  private var lastStatsTimestampMs = 0
  private var processedFramesAtLastStats = 0
  private var thermalLevel = "nominal"
  private var currentStatus = "idle"
  private var lastStatusDispatchTimestampMs = 0
  private var lastDispatchedStatus = ""

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black

    previewView.backgroundColor = .black
    addSubview(previewView)

    refreshThermalState()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleThermalStateDidChange),
      name: ProcessInfo.thermalStateDidChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    previewView.frame = bounds
    cameraService?.updatePreviewFrame(previewView.bounds)
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    isMounted = window != nil
    updateStreamingState()
  }

  func setActive(_ active: Bool) {
    isActive = active
    if active {
      resetTelemetry()
    }
    updateStreamingState()
  }

  func setCameraFacing(_ facing: String) {
    cameraFacing = facing
    cameraService?.setCameraPosition(facing == "back" ? .back : .front)
  }

  func setTargetFps(_ fps: Int) {
    requestedTargetFps = min(max(fps, 10), 30)
    refreshThermalState()
  }

  func setNumPoses(_ poses: Int) {
    numPoses = min(max(poses, 1), 4)
    rebuildLandmarker()
  }

  func setMinPoseDetectionConfidence(_ confidence: Float) {
    minPoseDetectionConfidence = min(max(confidence, 0.1), 0.99)
    rebuildLandmarker()
  }

  func setMinPosePresenceConfidence(_ confidence: Float) {
    minPosePresenceConfidence = min(max(confidence, 0.1), 0.99)
    rebuildLandmarker()
  }

  func setMinTrackingConfidence(_ confidence: Float) {
    minTrackingConfidence = min(max(confidence, 0.1), 0.99)
    rebuildLandmarker()
  }

  @objc private func handleThermalStateDidChange() {
    refreshThermalState()
    emitStatus(currentStatus, message: nil, force: true)
  }

  private func updateStreamingState() {
    guard isMounted else {
      cameraService?.stop()
      return
    }

    if !isActive {
      cameraService?.stop()
      resetFrameState()
      emitStatus("paused", message: nil, force: true)
      return
    }

    emitStatus("initializing", message: nil, force: true)
    ensureServices()
    cameraService?.start()
  }

  private func ensureServices() {
    if cameraService == nil {
      let service = MofitnessPoseCameraService(previewView: previewView)
      service.delegate = self
      service.setCameraPosition(cameraFacing == "back" ? .back : .front)
      cameraService = service
    }

    if landmarkerService == nil {
      rebuildLandmarker()
    }
  }

  private func rebuildLandmarker() {
    landmarkerService = MofitnessPoseLandmarkerService(
      numPoses: numPoses,
      minPoseDetectionConfidence: minPoseDetectionConfidence,
      minPosePresenceConfidence: minPosePresenceConfidence,
      minTrackingConfidence: minTrackingConfidence,
      liveStreamDelegate: self
    )

    if landmarkerService == nil && isActive {
      emitStatus("error", message: "Failed to initialize the iOS pose landmarker.", force: true)
    }
  }

  private func refreshThermalState() {
    thermalLevel = Self.mapThermalState(ProcessInfo.processInfo.thermalState)
    effectiveTargetFps = Self.computeEffectiveTargetFps(baseTargetFps: requestedTargetFps, thermalLevel: thermalLevel)
  }

  private func resetTelemetry() {
    stateQueue.sync {
      inferenceInFlight = false
      lastSubmittedTimestampMs = 0
      processedFrames = 0
      droppedFrames = 0
      actualFps = 0
      lastStatsTimestampMs = 0
      processedFramesAtLastStats = 0
      lastStatusDispatchTimestampMs = 0
      lastDispatchedStatus = ""
      currentStatus = "idle"
    }
  }

  private func resetFrameState() {
    stateQueue.sync {
      inferenceInFlight = false
      lastSubmittedTimestampMs = 0
    }
  }

  private func recordProcessedFrame() {
    stateQueue.sync {
      processedFrames += 1
      let now = Int(Date().timeIntervalSince1970 * 1000)
      if lastStatsTimestampMs == 0 {
        lastStatsTimestampMs = now
        processedFramesAtLastStats = processedFrames
        return
      }

      let elapsedMs = now - lastStatsTimestampMs
      if elapsedMs < 1000 {
        return
      }

      let processedSinceLastStats = processedFrames - processedFramesAtLastStats
      actualFps = Int((Double(processedSinceLastStats) * 1000.0 / Double(elapsedMs)).rounded())
      lastStatsTimestampMs = now
      processedFramesAtLastStats = processedFrames
    }
  }

  private func emitStatus(_ status: String, message: String?, force: Bool = false) {
    let payload: [String: Any]? = stateQueue.sync {
      currentStatus = status
      let now = Int(Date().timeIntervalSince1970 * 1000)
      let shouldDispatch = force || status != lastDispatchedStatus || now - lastStatusDispatchTimestampMs >= 1000
      if !shouldDispatch {
        return nil
      }

      lastDispatchedStatus = status
      lastStatusDispatchTimestampMs = now

      var nextPayload: [String: Any] = [
        "status": status,
        "fps": effectiveTargetFps,
        "targetFps": effectiveTargetFps,
        "actualFps": actualFps,
        "droppedFrames": droppedFrames,
        "processedFrames": processedFrames,
        "thermalLevel": thermalLevel
      ]
      if let message, !message.isEmpty {
        nextPayload["message"] = message
      }
      return nextPayload
    }

    guard let payload else {
      return
    }

    DispatchQueue.main.async {
      self.onStatusChange(payload)
    }
  }

  private static func computeEffectiveTargetFps(baseTargetFps: Int, thermalLevel: String) -> Int {
    switch thermalLevel {
    case "moderate":
      return min(baseTargetFps, 20)
    case "serious", "critical", "shutdown":
      return min(baseTargetFps, 10)
    default:
      return baseTargetFps
    }
  }

  private static func mapThermalState(_ state: ProcessInfo.ThermalState) -> String {
    switch state {
    case .nominal:
      return "nominal"
    case .fair:
      return "fair"
    case .serious:
      return "serious"
    case .critical:
      return "critical"
    @unknown default:
      return "unknown"
    }
  }
}

extension MofitnessPoseView: MofitnessPoseCameraServiceDelegate {
  func cameraService(_ service: MofitnessPoseCameraService, didOutput sampleBuffer: CMSampleBuffer, orientation: UIImage.Orientation) {
    guard isActive, let landmarkerService else {
      return
    }

    let now = Int(Date().timeIntervalSince1970 * 1000)
    let minimumFrameIntervalMs = max(1, Int(1000 / max(effectiveTargetFps, 1)))
    let shouldSubmit = stateQueue.sync { () -> Bool in
      if inferenceInFlight || now - lastSubmittedTimestampMs < minimumFrameIntervalMs {
        droppedFrames += 1
        return false
      }

      inferenceInFlight = true
      lastSubmittedTimestampMs = now
      return true
    }

    if !shouldSubmit {
      return
    }

    landmarkerService.detectAsync(sampleBuffer: sampleBuffer, orientation: orientation, timestampInMilliseconds: now)
  }

  func cameraService(_ service: MofitnessPoseCameraService, didChangeStatus status: MofitnessPoseCameraStatus, message: String?) {
    switch status {
    case .ready:
      emitStatus("ready", message: message, force: true)
    case .paused:
      emitStatus("paused", message: message, force: true)
    case .permissionDenied:
      emitStatus("error", message: message ?? "Camera permission denied.", force: true)
    case .failed:
      emitStatus("error", message: message ?? "Camera startup failed.", force: true)
    }
  }
}

extension MofitnessPoseView: MofitnessPoseLandmarkerLiveStreamDelegate {
  func poseLandmarkerService(_ service: MofitnessPoseLandmarkerService, didFinishDetection result: MofitnessPoseResultBundle?, error: Error?) {
    let submittedTimestamp = stateQueue.sync { () -> Int in
      inferenceInFlight = false
      return lastSubmittedTimestampMs
    }

    if let error {
      emitStatus("error", message: error.localizedDescription, force: true)
      return
    }

    guard
      let result,
      let poseLandmarkerResult = result.poseLandmarkerResult,
      let firstPose = poseLandmarkerResult.landmarks.first,
      !firstPose.isEmpty
    else {
      emitStatus("no_pose", message: nil)
      return
    }

    recordProcessedFrame()
    let resolution = cameraService?.videoResolution ?? .zero
    let payloadLandmarks = firstPose.map { landmark in
      [
        "x": landmark.x,
        "y": landmark.y,
        "z": landmark.z,
        "visibility": 1.0
      ]
    }

    DispatchQueue.main.async {
      self.onPoseFrame([
        "landmarks": payloadLandmarks,
        "timestamp": submittedTimestamp,
        "frameWidth": Int(resolution.width),
        "frameHeight": Int(resolution.height),
        "inferenceTimeMs": result.inferenceTimeMs
      ])
      self.emitStatus("tracking", message: nil)
    }
  }
}
