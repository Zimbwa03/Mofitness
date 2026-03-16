package expo.modules.mofitnesspose

import android.content.Context
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.util.Size
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

class MofitnessPoseView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext),
  PoseLandmarkerStreamHelper.Listener {
  private val onPoseFrame by EventDispatcher()
  private val onStatusChange by EventDispatcher()
  private val previewView = PreviewView(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    implementationMode = PreviewView.ImplementationMode.PERFORMANCE
    scaleType = PreviewView.ScaleType.FILL_CENTER
  }
  private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private val inferenceInFlight = AtomicBoolean(false)
  private val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
  private val analysisResolution = Size(1280, 720)
  private val thermalListener =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      PowerManager.OnThermalStatusChangedListener { status ->
        handleThermalStatusChanged(status)
      }
    } else {
      null
    }

  private var processCameraProvider: ProcessCameraProvider? = null
  private var landmarkerHelper: PoseLandmarkerStreamHelper? = null
  private var active = false
  private var lensFacing = CameraSelector.LENS_FACING_FRONT
  private var requestedTargetFps = 30
  private var effectiveTargetFps = 30
  private var numPoses = 1
  private var minPoseDetectionConfidence = 0.55f
  private var minPosePresenceConfidence = 0.55f
  private var minTrackingConfidence = 0.55f
  private var thermalLevel = "nominal"
  private var lastSubmittedAtMs = 0L
  private var processedFrames = 0L
  private var droppedFrames = 0L
  private var actualFps = 0
  private var lastStatsAtMs = 0L
  private var processedFramesAtLastStats = 0L
  private var currentStatus = "idle"
  private var lastDispatchedStatus = ""
  private var lastStatusDispatchAtMs = 0L
  private var thermalListenerRegistered = false

  init {
    addView(previewView)
    refreshThermalState()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    registerThermalListenerIfNeeded()
    refreshThermalState()
    updateStreamingState()
  }

  override fun onDetachedFromWindow() {
    unregisterThermalListenerIfNeeded()
    stopStreaming()
    analysisExecutor.shutdownNow()
    super.onDetachedFromWindow()
  }

  fun setActive(value: Boolean) {
    if (active == value) {
      return
    }

    active = value
    if (active) {
      resetTelemetry()
    }
    updateStreamingState()
  }

  fun setCameraFacing(value: String) {
    val nextFacing = if (value == "back") CameraSelector.LENS_FACING_BACK else CameraSelector.LENS_FACING_FRONT
    if (lensFacing == nextFacing) {
      return
    }

    lensFacing = nextFacing
    rebindCamera()
  }

  fun setTargetFps(value: Int) {
    requestedTargetFps = value.coerceIn(10, 30)
    val previousEffectiveTarget = effectiveTargetFps
    refreshThermalState()
    if (active && previousEffectiveTarget != effectiveTargetFps) {
      rebindCamera()
    }
  }

  fun setNumPoses(value: Int) {
    numPoses = value.coerceIn(1, 4)
    recreateLandmarker()
  }

  fun setMinPoseDetectionConfidence(value: Float) {
    minPoseDetectionConfidence = value.coerceIn(0.1f, 0.99f)
    recreateLandmarker()
  }

  fun setMinPosePresenceConfidence(value: Float) {
    minPosePresenceConfidence = value.coerceIn(0.1f, 0.99f)
    recreateLandmarker()
  }

  fun setMinTrackingConfidence(value: Float) {
    minTrackingConfidence = value.coerceIn(0.1f, 0.99f)
    recreateLandmarker()
  }

  override fun onError(message: String) {
    inferenceInFlight.set(false)
    emitStatus("error", message = message, force = true)
  }

  override fun onResults(result: PoseLandmarkerStreamHelper.ResultBundle) {
    inferenceInFlight.set(false)
    recordProcessedFrame()
    val firstPose = result.result.landmarks().firstOrNull()

    if (firstPose.isNullOrEmpty()) {
      emitStatus("no_pose")
      return
    }

    val landmarks = firstPose.map { landmark ->
      mapOf(
        "x" to landmark.x().toDouble(),
        "y" to landmark.y().toDouble(),
        "z" to landmark.z().toDouble(),
        "visibility" to landmark.visibility().orElse(0f).toDouble(),
      )
    }

    onPoseFrame(
      mapOf(
        "landmarks" to landmarks,
        "timestamp" to result.result.timestampMs(),
        "frameWidth" to result.inputImageWidth,
        "frameHeight" to result.inputImageHeight,
        "inferenceTimeMs" to result.inferenceTimeMs,
      ),
    )
    emitStatus("tracking")
  }

  private fun updateStreamingState() {
    if (!active) {
      stopStreaming()
      emitStatus("paused", force = true)
      return
    }

    val activity = appContext.currentActivity
    if (activity !is LifecycleOwner) {
      emitStatus("unavailable", message = "A lifecycle-aware activity is required for native pose tracking.", force = true)
      return
    }

    emitStatus("initializing", force = true)
    ensureLandmarker()

    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener(
      {
        try {
          val provider = cameraProviderFuture.get()
          processCameraProvider = provider
          bindCamera(provider, activity)
        } catch (error: Exception) {
          emitStatus("error", message = error.message ?: "Failed to start the camera pipeline.", force = true)
        }
      },
      ContextCompat.getMainExecutor(context),
    )
  }

  private fun ensureLandmarker() {
    if (landmarkerHelper != null) {
      return
    }

    analysisExecutor.execute {
      try {
        landmarkerHelper = PoseLandmarkerStreamHelper(
          context = context,
          listener = this,
          numPoses = numPoses,
          minPoseDetectionConfidence = minPoseDetectionConfidence,
          minPosePresenceConfidence = minPosePresenceConfidence,
          minTrackingConfidence = minTrackingConfidence,
        )
      } catch (error: Exception) {
        emitStatus("error", message = error.message ?: "Failed to initialize the pose landmarker.", force = true)
      }
    }
  }

  private fun recreateLandmarker() {
    analysisExecutor.execute {
      try {
        landmarkerHelper?.clear()
        landmarkerHelper = PoseLandmarkerStreamHelper(
          context = context,
          listener = this,
          numPoses = numPoses,
          minPoseDetectionConfidence = minPoseDetectionConfidence,
          minPosePresenceConfidence = minPosePresenceConfidence,
          minTrackingConfidence = minTrackingConfidence,
        )
      } catch (error: Exception) {
        emitStatus("error", message = error.message ?: "Failed to reconfigure the pose landmarker.", force = true)
      }
    }
  }

  private fun bindCamera(provider: ProcessCameraProvider, lifecycleOwner: LifecycleOwner) {
    val preview = Preview.Builder()
      .setTargetResolution(analysisResolution)
      .build()
      .also { it.setSurfaceProvider(previewView.surfaceProvider) }
    val imageAnalysis = ImageAnalysis.Builder()
      .setTargetResolution(analysisResolution)
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
      .build()

    imageAnalysis.setAnalyzer(analysisExecutor) { imageProxy ->
      if (!active) {
        imageProxy.close()
        return@setAnalyzer
      }

      val now = SystemClock.uptimeMillis()
      val minFrameIntervalMs = (1000L / effectiveTargetFps.coerceAtLeast(1)).coerceAtLeast(1L)
      if (inferenceInFlight.get() || now - lastSubmittedAtMs < minFrameIntervalMs) {
        droppedFrames += 1
        imageProxy.close()
        return@setAnalyzer
      }

      lastSubmittedAtMs = now
      inferenceInFlight.set(true)
      val helper = landmarkerHelper
      if (helper == null) {
        inferenceInFlight.set(false)
        imageProxy.close()
        emitStatus("initializing")
        return@setAnalyzer
      }

      helper.detectLiveStream(imageProxy, lensFacing == CameraSelector.LENS_FACING_FRONT)
    }

    try {
      provider.unbindAll()
      provider.bindToLifecycle(
        lifecycleOwner,
        CameraSelector.Builder().requireLensFacing(lensFacing).build(),
        preview,
        imageAnalysis,
      )
      emitStatus("ready", force = true)
    } catch (error: Exception) {
      emitStatus("error", message = error.message ?: "Failed to bind the camera use cases.", force = true)
    }
  }

  private fun rebindCamera() {
    if (!active) {
      return
    }
    updateStreamingState()
  }

  private fun stopStreaming() {
    processCameraProvider?.unbindAll()
    inferenceInFlight.set(false)
    lastSubmittedAtMs = 0L
    currentStatus = "idle"
  }

  private fun registerThermalListenerIfNeeded() {
    if (thermalListenerRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return
    }

    val listener = thermalListener ?: return
    powerManager?.addThermalStatusListener(listener)
    thermalListenerRegistered = true
  }

  private fun unregisterThermalListenerIfNeeded() {
    if (!thermalListenerRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return
    }

    val listener = thermalListener ?: return
    powerManager?.removeThermalStatusListener(listener)
    thermalListenerRegistered = false
  }

  private fun handleThermalStatusChanged(status: Int) {
    val previousTarget = effectiveTargetFps
    thermalLevel = mapThermalStatus(status)
    effectiveTargetFps = computeEffectiveTargetFps(requestedTargetFps, thermalLevel)

    if (active && previousTarget != effectiveTargetFps) {
      rebindCamera()
      return
    }

    emitStatus(currentStatus.ifBlank { "ready" }, force = true)
  }

  private fun refreshThermalState() {
    thermalLevel =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        mapThermalStatus(powerManager?.currentThermalStatus ?: PowerManager.THERMAL_STATUS_NONE)
      } else {
        "nominal"
      }
    effectiveTargetFps = computeEffectiveTargetFps(requestedTargetFps, thermalLevel)
  }

  private fun computeEffectiveTargetFps(baseTargetFps: Int, level: String): Int {
    return when (level) {
      "moderate" -> minOf(baseTargetFps, 20)
      "serious", "critical", "shutdown" -> minOf(baseTargetFps, 10)
      else -> baseTargetFps
    }
  }

  private fun mapThermalStatus(status: Int): String {
    return when (status) {
      PowerManager.THERMAL_STATUS_NONE -> "nominal"
      PowerManager.THERMAL_STATUS_LIGHT -> "fair"
      PowerManager.THERMAL_STATUS_MODERATE -> "moderate"
      PowerManager.THERMAL_STATUS_SEVERE -> "serious"
      PowerManager.THERMAL_STATUS_CRITICAL,
      PowerManager.THERMAL_STATUS_EMERGENCY -> "critical"
      PowerManager.THERMAL_STATUS_SHUTDOWN -> "shutdown"
      else -> "unknown"
    }
  }

  private fun resetTelemetry() {
    droppedFrames = 0L
    processedFrames = 0L
    actualFps = 0
    lastStatsAtMs = 0L
    processedFramesAtLastStats = 0L
    lastDispatchedStatus = ""
    lastStatusDispatchAtMs = 0L
  }

  private fun recordProcessedFrame() {
    processedFrames += 1
    val now = SystemClock.uptimeMillis()
    if (lastStatsAtMs == 0L) {
      lastStatsAtMs = now
      processedFramesAtLastStats = processedFrames
      return
    }

    val elapsedMs = now - lastStatsAtMs
    if (elapsedMs < 1000L) {
      return
    }

    val processedSinceLastStats = processedFrames - processedFramesAtLastStats
    actualFps = ((processedSinceLastStats * 1000.0) / elapsedMs.toDouble()).roundToInt()
    lastStatsAtMs = now
    processedFramesAtLastStats = processedFrames
  }

  private fun emitStatus(status: String, message: String? = null, force: Boolean = false) {
    currentStatus = status
    val now = SystemClock.uptimeMillis()
    val shouldDispatch = force || status != lastDispatchedStatus || now - lastStatusDispatchAtMs >= STATUS_DISPATCH_INTERVAL_MS
    if (!shouldDispatch) {
      return
    }

    lastDispatchedStatus = status
    lastStatusDispatchAtMs = now

    val payload = mutableMapOf<String, Any>(
      "status" to status,
      "fps" to effectiveTargetFps,
      "targetFps" to effectiveTargetFps,
      "actualFps" to actualFps,
      "droppedFrames" to droppedFrames,
      "processedFrames" to processedFrames,
      "thermalLevel" to thermalLevel,
    )
    if (!message.isNullOrBlank()) {
      payload["message"] = message
    }
    onStatusChange(payload)
  }

  companion object {
    private const val STATUS_DISPATCH_INTERVAL_MS = 1000L
  }
}
