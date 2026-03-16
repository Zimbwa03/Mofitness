package expo.modules.mofitnesspose

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.SystemClock
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult

class PoseLandmarkerStreamHelper(
  private val context: Context,
  private val listener: Listener,
  var numPoses: Int = 1,
  var minPoseDetectionConfidence: Float = DEFAULT_CONFIDENCE,
  var minPosePresenceConfidence: Float = DEFAULT_CONFIDENCE,
  var minTrackingConfidence: Float = DEFAULT_CONFIDENCE,
) {
  private var poseLandmarker: PoseLandmarker? = null

  init {
    recreate()
  }

  fun recreate() {
    clear()
    poseLandmarker = createPoseLandmarker(Delegate.GPU) ?: createPoseLandmarker(Delegate.CPU)
    if (poseLandmarker == null) {
      throw IllegalStateException("Unable to initialize Pose Landmarker with GPU or CPU delegates.")
    }
  }

  fun clear() {
    poseLandmarker?.close()
    poseLandmarker = null
  }

  fun detectLiveStream(imageProxy: ImageProxy, isFrontCamera: Boolean) {
    val landmarker = poseLandmarker
    if (landmarker == null) {
      imageProxy.close()
      return
    }

    val frameTime = SystemClock.uptimeMillis()
    val bitmapBuffer = Bitmap.createBitmap(imageProxy.width, imageProxy.height, Bitmap.Config.ARGB_8888)
    bitmapBuffer.copyPixelsFromBuffer(imageProxy.planes[0].buffer)
    imageProxy.close()

    val matrix = Matrix().apply {
      postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
      if (isFrontCamera) {
        postScale(-1f, 1f, imageProxy.width.toFloat(), imageProxy.height.toFloat())
      }
    }

    val rotatedBitmap = Bitmap.createBitmap(bitmapBuffer, 0, 0, bitmapBuffer.width, bitmapBuffer.height, matrix, true)
    val mpImage = BitmapImageBuilder(rotatedBitmap).build()
    landmarker.detectAsync(mpImage, frameTime)
  }

  private fun handleResult(result: PoseLandmarkerResult, input: MPImage) {
    val inferenceTimeMs = SystemClock.uptimeMillis() - result.timestampMs()
    listener.onResults(
      ResultBundle(
        result = result,
        inferenceTimeMs = inferenceTimeMs,
        inputImageHeight = input.height,
        inputImageWidth = input.width,
      ),
    )
  }

  private fun handleError(error: RuntimeException) {
    listener.onError(error.message ?: "Pose Landmarker failed to process a frame.")
  }

  data class ResultBundle(
    val result: PoseLandmarkerResult,
    val inferenceTimeMs: Long,
    val inputImageHeight: Int,
    val inputImageWidth: Int,
  )

  interface Listener {
    fun onError(message: String)
    fun onResults(result: ResultBundle)
  }

  companion object {
    private const val MODEL_ASSET = "pose_landmarker_lite.task"
    private const val DEFAULT_CONFIDENCE = 0.55f
  }

  private fun createPoseLandmarker(delegate: Delegate): PoseLandmarker? {
    return try {
      val baseOptions = BaseOptions.builder()
        .setDelegate(delegate)
        .setModelAssetPath(MODEL_ASSET)
        .build()

      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setNumPoses(numPoses)
        .setMinPoseDetectionConfidence(minPoseDetectionConfidence)
        .setMinPosePresenceConfidence(minPosePresenceConfidence)
        .setMinTrackingConfidence(minTrackingConfidence)
        .setRunningMode(RunningMode.LIVE_STREAM)
        .setResultListener(this::handleResult)
        .setErrorListener(this::handleError)
        .build()

      PoseLandmarker.createFromOptions(context, options)
    } catch (_: Exception) {
      null
    }
  }
}
