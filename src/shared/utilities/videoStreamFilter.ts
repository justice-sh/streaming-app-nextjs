import { SelfieSegmentation, Results } from "@mediapipe/selfie_segmentation"

class VideoStreamFilter {
  private id: string
  static instance: VideoStreamFilter
  static instanceList: VideoStreamFilter[] = []

  private config: VideoStreamFilterConfig | undefined
  private blurLevel: string | undefined
  private selfieSegmentation: SelfieSegmentation | undefined
  private video: HTMLVideoElement | undefined
  private canvas: HTMLCanvasElement | undefined

  private constructor(id: string) {
    this.id = id
  }

  // This ensures we have only one instance of this class
  static createInstance(id: string) {
    let instance = VideoStreamFilter.instanceList.find((inst) => inst.id === id)

    if (!instance) {
      instance = new VideoStreamFilter(id)
      VideoStreamFilter.instanceList.push(instance)
    }

    return instance
  }

  async applyEffect(config: VideoStreamFilterConfig) {
    config.width = config.width || 640
    config.height = config.height || 360

    if (config.type === "blur_background") {
      config.level = config.level || "medium"
      this.blurLevel = blurLevel2Pixel(config.level)
    }

    this.config = config

    const hasVideo = checkElement(config.width, config.height, this.video)
    const hasCavas = checkElement(config.width, config.height, this.canvas)

    if (!hasVideo || !hasCavas || !this.selfieSegmentation) {
      await this.disableEffect()

      const { video, canvas } = createElements(config.stream, config.width, config.height)

      this.video = video
      this.canvas = canvas

      this.setupFilter()
      this.sendNextFrame()
    }

    appendCanvasToDOM(config.selector, this.canvas)

    return this.canvas?.captureStream() // First method, currently redundant because it renders slowly
  }

  async disableEffect() {
    this.selfieSegmentation?.reset()
    await this.selfieSegmentation?.close()
    this.selfieSegmentation = undefined

    this.canvas?.remove()

    if (this.video) this.video.srcObject = null
    this.video?.remove()

    this.canvas = undefined
    this.video = undefined

    cleanUpDOM(this.config?.selector)
  }

  async resizeEffect(width: number, height: number) {
    let config = this.config

    if (!config) throw Error("There's no instance to reset")
    config = { ...config, width, height }

    this.config = { ...this.config, ...config }

    const { video, canvas } = createElements(config.stream, config.width, config.height)

    this.video = video
    this.canvas = canvas

    if (config.selector) appendCanvasToDOM(config.selector, this.canvas)
  }

  private setupFilter() {
    const canvas = this.canvas
    if (!canvas) throw Error("No canvas element present")

    const ctx = canvas.getContext("2d")

    if (!ctx) throw Error("Could not create canvas context.")

    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`
      },
    })

    selfieSegmentation.setOptions({ modelSelection: 1 })
    selfieSegmentation.onResults((results) => this.handleSegmentationResults(results, canvas))

    this.selfieSegmentation = selfieSegmentation
  }

  private handleSegmentationResults(results: Results, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw Error("No canvas context present")

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // draw segmentation mask
    ctx.filter = "none"
    ctx.globalCompositeOperation = "source-over"
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height)

    // draw imageFrame on top
    ctx.globalCompositeOperation = "source-in"
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    // apply effect
    ctx.globalCompositeOperation = "destination-over"

    if (this.config?.type === "blur_background") {
      ctx.filter = `blur(${this.blurLevel})`
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    } else {
      ctx.drawImage(this.config!.image, 0, 0, canvas.width, canvas.height)
    }

    ctx.restore()
    this.sendNextFrame()
  }

  private sendNextFrame() {
    if (!this.selfieSegmentation || !this.video) return

    requestAnimationFrame(() => {
      this.selfieSegmentation?.send({ image: this.video! })
    })
  }
}

const createElements = (stream: MediaStream, width = 640, height = 360) => {
  const canvas = document.createElement("canvas") as HTMLCanvasElement
  const video = document.createElement("video") as HTMLVideoElement

  canvas.id = "canvas-stream-effect"
  canvas.width = width
  canvas.height = height

  video.id = "video-stream-effect"
  video.width = width
  video.height = height
  video.autoplay = true
  video.srcObject = stream

  canvas.style.position = "absolute"
  canvas.style.zIndex = "20"
  // canvas.style.inset = "0"
  canvas.style.transform = "rotateY(180deg)"
  canvas.style.maxWidth = "100%"
  canvas.style.maxHeight = "100%"

  return { canvas, video }
}

const appendCanvasToDOM = (parent?: Selector, canvas?: HTMLCanvasElement) => {
  if (!parent) return

  const container = document.querySelector(parent) as HTMLDivElement | null
  if (!container || !canvas) return

  cleanUpDOM(parent)
  container.appendChild(canvas)
}

const cleanUpDOM = (parent?: Selector) => {
  if (!parent) return
  const container = document.querySelector(parent) as HTMLDivElement | null
  if (!container) return
  const oldCanvases = Array.from(container.getElementsByTagName("canvas"))
  if (oldCanvases.length) oldCanvases.forEach((c) => c.remove())
}

const blurLevel2Pixel = (level: BlurFilterLevel) => {
  const map: Record<BlurFilterLevel, string> = {
    high: "18px",
    medium: "12px",
    low: "6px",
  }
  return map[level]
}

const checkElement = (width: number, height: number, el?: HTMLVideoElement | HTMLCanvasElement) => {
  if (!el) return false
  if (el.width !== width) return false
  if (el.height !== height) return false

  return true
}

export const videoStreamFilter = VideoStreamFilter.createInstance("roomFrame")

type Selector = `${"#" | "."}${string}`

type VideoStreamFilterConfig = {
  stream: MediaStream
  selector?: Selector
  width?: number
  height?: number
} & (BlurBackgroundEffect | ChangeBackgroundEffect)

type BlurFilterLevel = "low" | "medium" | "high"

type BlurBackgroundEffect = {
  type: "blur_background"
  level?: BlurFilterLevel
}

type ChangeBackgroundEffect = {
  type: "change_background"
  image: HTMLImageElement
}
