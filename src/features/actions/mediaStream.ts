import { getRoomData, setRoomData } from "@/shared/data/room/actions"
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation"

export const startMediaStream = async () => {
  if (!hasGetUserMedia()) throw Error("User does not have media")

  const stream = await navigator.mediaDevices.getUserMedia({ video: true })

  setRoomData("mediaStream", stream)
  setRoomData("isCameraOn", true)
}

export const stopMediaStream = async () => {
  setRoomData("mediaStream", undefined)
  setRoomData("isCameraOn", false)
}

export const blurMediaStream = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const mediaStream = getRoomData("mediaStream")
  const shouldBlurMediaStream = getRoomData("shouldBlurMediaStream")

  if (shouldBlurMediaStream) return
  if (!mediaStream) return

  setRoomData("shouldBlurMediaStream", true)

  const segmentation = getSelfieSegmentation()

  requestAnimationFrame((frame) => {
    segmentation.send({ image: video })
  })

  segmentation.onResults((result) => {
    const ctx = canvas.getContext("2d")

    if (!ctx) throw Error("No canvas context present")

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // draw segmentation mask
    ctx.filter = "none"
    ctx.globalCompositeOperation = "source-over"
    ctx.drawImage(result.segmentationMask, 0, 0, canvas.width, canvas.height)

    // draw imageFrame on top
    ctx.globalCompositeOperation = "source-in"
    ctx.drawImage(result.image, 0, 0, canvas.width, canvas.height)

    // blur background
    ctx.filter = "blur(12px)"
    ctx.globalCompositeOperation = "destination-over"
    ctx.drawImage(result.image, 0, 0, canvas.width, canvas.height)

    ctx.restore()

    const shouldBlurMediaStream = getRoomData("shouldBlurMediaStream")

    if (shouldBlurMediaStream) {
      requestAnimationFrame((frame) => {
        segmentation.send({ image: video })
      })
    }
  })
}

export const removeMediaStreamBlur = () => {
  setRoomData("shouldBlurMediaStream", false)
}

const getSelfieSegmentation = () => {
  const selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    },
  })

  selfieSegmentation.setOptions({ modelSelection: 1 })

  return selfieSegmentation
}

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export default startMediaStream
