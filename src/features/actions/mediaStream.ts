import { getRoomData, setRoomData } from "@/shared/data/room/actions"
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation"

export const startMediaStream = async () => {
  if (!hasGetUserMedia()) throw Error("User does not have media")

  const stream = await navigator.mediaDevices.getUserMedia({ video: true })

  const streams = getRoomData("streamList") ?? []

  setRoomData("mediaStream", stream)
  setRoomData("streamList", [...streams, stream])
  setRoomData("isCameraOn", true)
}

export const stopMediaStream = async () => {
  const streams = getRoomData("streamList") ?? []

  streams.forEach((s) => {
    s.getVideoTracks().forEach((t) => t.stop())
  })

  setRoomData("streamList", [])

  setRoomData("mediaStream", undefined)
  setRoomData("isCameraOn", false)
}

export const blurMediaStream = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const mediaStream = getRoomData("mediaStream")
  const shouldBlurMediaStream = getRoomData("shouldBlurMediaStream")

  if (shouldBlurMediaStream) return
  if (!mediaStream) return

  setRoomData("changeMediaStreamBg", false)
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

export const changeMediaStreamBackground = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const mediaStream = getRoomData("mediaStream")

  if (!mediaStream) return

  setRoomData("shouldBlurMediaStream", false)
  setRoomData("changeMediaStreamBg", true)

  const bgImage = new Image(video.width, video.height)
  bgImage.src = "/images/high-rise-living-room-zoom-background.webp"

  bgImage.onload = handleLoad

  const segmentation = getSelfieSegmentation()

  function handleLoad() {
    const shouldChangeBg = getRoomData("changeMediaStreamBg")
    if (!shouldChangeBg) return

    const ctx = canvas.getContext("2d")
    if (!ctx) throw Error("Could not create canvas context.")

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

      ctx.globalCompositeOperation = "destination-over"
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

      ctx.restore()

      const changeMediaStreamBg = getRoomData("changeMediaStreamBg")

      if (changeMediaStreamBg) {
        requestAnimationFrame((frame) => {
          segmentation.send({ image: video })
        })
      }
    })
  }
}

export const removeMediaStreamEffect = () => {
  setRoomData("shouldBlurMediaStream", false)
  setRoomData("changeMediaStreamBg", false)
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
