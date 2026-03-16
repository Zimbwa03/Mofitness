import AVFoundation
import UIKit

protocol MofitnessPoseCameraServiceDelegate: AnyObject {
  func cameraService(_ service: MofitnessPoseCameraService, didOutput sampleBuffer: CMSampleBuffer, orientation: UIImage.Orientation)
  func cameraService(_ service: MofitnessPoseCameraService, didChangeStatus status: MofitnessPoseCameraStatus, message: String?)
}

enum MofitnessPoseCameraStatus {
  case ready
  case paused
  case permissionDenied
  case failed
}

final class MofitnessPoseCameraService: NSObject {
  weak var delegate: MofitnessPoseCameraServiceDelegate?

  var videoResolution: CGSize {
    guard let size = imageBufferSize else {
      return .zero
    }

    let minDimension = min(size.width, size.height)
    let maxDimension = max(size.width, size.height)

    switch UIDevice.current.orientation {
    case .landscapeLeft, .landscapeRight:
      return CGSize(width: maxDimension, height: minDimension)
    default:
      return CGSize(width: minDimension, height: maxDimension)
    }
  }

  private let session = AVCaptureSession()
  private let previewLayer: AVCaptureVideoPreviewLayer
  private let sessionQueue = DispatchQueue(label: "com.mofitness.pose.camera.session")
  private let sampleBufferQueue = DispatchQueue(label: "com.mofitness.pose.camera.frames")
  private let videoDataOutput = AVCaptureVideoDataOutput()

  private var imageBufferSize: CGSize?
  private var isConfigured = false
  private var isSessionRunning = false
  private var requestedPosition: AVCaptureDevice.Position = .front

  init(previewView: UIView) {
    previewLayer = AVCaptureVideoPreviewLayer(session: session)
    super.init()

    session.sessionPreset = session.canSetSessionPreset(.hd1280x720) ? .hd1280x720 : .high
    previewLayer.videoGravity = .resizeAspectFill
    previewView.layer.addSublayer(previewLayer)

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleDeviceOrientationChange),
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  func updatePreviewFrame(_ frame: CGRect) {
    previewLayer.frame = frame
  }

  func setCameraPosition(_ position: AVCaptureDevice.Position) {
    requestedPosition = position

    sessionQueue.async {
      self.reconfigureCameraInput()
    }
  }

  func start() {
    sessionQueue.async {
      self.ensureAuthorizedAndConfigured()
    }
  }

  func stop() {
    sessionQueue.async {
      self.removeObservers()
      if self.session.isRunning {
        self.session.stopRunning()
      }
      self.isSessionRunning = false
      self.emitStatus(.paused, message: nil)
    }
  }

  @objc private func handleDeviceOrientationChange() {
    let videoOrientation = AVCaptureVideoOrientation.from(deviceOrientation: UIDevice.current.orientation)
    previewLayer.connection?.videoOrientation = videoOrientation
    videoDataOutput.connection(with: .video)?.videoOrientation = videoOrientation
  }

  private func ensureAuthorizedAndConfigured() {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      configureIfNeededAndStart()
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { granted in
        self.sessionQueue.async {
          if granted {
            self.configureIfNeededAndStart()
          } else {
            self.emitStatus(.permissionDenied, message: "Camera permission is required for live form tracking.")
          }
        }
      }
    default:
      emitStatus(.permissionDenied, message: "Camera permission is required for live form tracking.")
    }
  }

  private func configureIfNeededAndStart() {
    if !isConfigured {
      do {
        try configureSession()
        isConfigured = true
      } catch {
        emitStatus(.failed, message: error.localizedDescription)
        return
      }
    }

    addObservers()
    if !session.isRunning {
      session.startRunning()
    }
    isSessionRunning = session.isRunning
    emitStatus(.ready, message: nil)
  }

  private func configureSession() throws {
    session.beginConfiguration()
    defer { session.commitConfiguration() }

    removeAllInputs()
    session.outputs.forEach { session.removeOutput($0) }

    guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: requestedPosition) else {
      throw NSError(domain: "MofitnessPoseCamera", code: 1, userInfo: [NSLocalizedDescriptionKey: "Requested camera is unavailable."])
    }

    let input = try AVCaptureDeviceInput(device: camera)
    guard session.canAddInput(input) else {
      throw NSError(domain: "MofitnessPoseCamera", code: 2, userInfo: [NSLocalizedDescriptionKey: "Unable to attach the camera input."])
    }
    session.addInput(input)

    videoDataOutput.alwaysDiscardsLateVideoFrames = true
    videoDataOutput.videoSettings = [String(kCVPixelBufferPixelFormatTypeKey): kCMPixelFormat_32BGRA]
    videoDataOutput.setSampleBufferDelegate(self, queue: sampleBufferQueue)

    guard session.canAddOutput(videoDataOutput) else {
      throw NSError(domain: "MofitnessPoseCamera", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unable to attach the camera frame output."])
    }
    session.addOutput(videoDataOutput)

    let videoOrientation = AVCaptureVideoOrientation.from(deviceOrientation: UIDevice.current.orientation)
    videoDataOutput.connection(with: .video)?.videoOrientation = videoOrientation
    previewLayer.connection?.videoOrientation = videoOrientation

    if requestedPosition == .front {
      videoDataOutput.connection(with: .video)?.isVideoMirrored = true
      previewLayer.connection?.isVideoMirrored = true
    } else {
      videoDataOutput.connection(with: .video)?.isVideoMirrored = false
      previewLayer.connection?.isVideoMirrored = false
    }
  }

  private func reconfigureCameraInput() {
    guard isConfigured else {
      return
    }

    let wasRunning = session.isRunning
    if wasRunning {
      session.stopRunning()
    }

    do {
      try configureSession()
      if wasRunning {
        session.startRunning()
      }
      isSessionRunning = session.isRunning
      emitStatus(.ready, message: nil)
    } catch {
      emitStatus(.failed, message: error.localizedDescription)
    }
  }

  private func removeAllInputs() {
    session.inputs.forEach { input in
      session.removeInput(input)
    }
  }

  private func addObservers() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleSessionRuntimeError),
      name: .AVCaptureSessionRuntimeError,
      object: session
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleSessionInterrupted),
      name: .AVCaptureSessionWasInterrupted,
      object: session
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleSessionInterruptionEnded),
      name: .AVCaptureSessionInterruptionEnded,
      object: session
    )
  }

  private func removeObservers() {
    NotificationCenter.default.removeObserver(self, name: .AVCaptureSessionRuntimeError, object: session)
    NotificationCenter.default.removeObserver(self, name: .AVCaptureSessionWasInterrupted, object: session)
    NotificationCenter.default.removeObserver(self, name: .AVCaptureSessionInterruptionEnded, object: session)
  }

  @objc private func handleSessionRuntimeError(notification: Notification) {
    let message = (notification.userInfo?[AVCaptureSessionErrorKey] as? AVError)?.localizedDescription
      ?? "Camera session runtime error."
    emitStatus(.failed, message: message)
  }

  @objc private func handleSessionInterrupted(notification: Notification) {
    emitStatus(.paused, message: "Camera session was interrupted.")
  }

  @objc private func handleSessionInterruptionEnded(notification: Notification) {
    emitStatus(.ready, message: nil)
  }

  private func emitStatus(_ status: MofitnessPoseCameraStatus, message: String?) {
    DispatchQueue.main.async {
      self.delegate?.cameraService(self, didChangeStatus: status, message: message)
    }
  }
}

extension MofitnessPoseCameraService: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return
    }

    if imageBufferSize == nil {
      imageBufferSize = CGSize(width: CVPixelBufferGetHeight(imageBuffer), height: CVPixelBufferGetWidth(imageBuffer))
    }

    let orientation = UIImage.Orientation.from(deviceOrientation: UIDevice.current.orientation)
    delegate?.cameraService(self, didOutput: sampleBuffer, orientation: orientation)
  }
}

private extension AVCaptureVideoOrientation {
  static func from(deviceOrientation: UIDeviceOrientation) -> AVCaptureVideoOrientation {
    switch deviceOrientation {
    case .landscapeLeft:
      return .landscapeRight
    case .landscapeRight:
      return .landscapeLeft
    case .portraitUpsideDown:
      return .portraitUpsideDown
    default:
      return .portrait
    }
  }
}

private extension UIImage.Orientation {
  static func from(deviceOrientation: UIDeviceOrientation) -> UIImage.Orientation {
    switch deviceOrientation {
    case .landscapeLeft:
      return .left
    case .landscapeRight:
      return .right
    case .portraitUpsideDown:
      return .down
    default:
      return .up
    }
  }
}
