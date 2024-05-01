import { SelfieSegmentation, Results } from "@mediapipe/selfie_segmentation"

export class VideoFilter {
  private config?: Config
  private selfieSegmentation?: SelfieSegmentation
  private video?: HTMLVideoElement
  private canvas?: HTMLCanvasElement

  async applyEffect(config: Config) {
    const isPassed = this.checkConfig(config)
    this.updateConfig(config)

    if (isPassed && this.selfieSegmentation) return undefined

    await this.reset()
    this.createElements()
    await this.setupFilter()
    this.sendNextFrame()
    return this.canvas?.captureStream(15)
  }

  async disableEffect() {
    await this.reset()
    this.config = undefined
    this.canvas = undefined
    this.video = undefined
  }

  private updateConfig(config: Partial<Config>) {
    if (!this.config?.stream && !config?.stream) throw Error("No stream provided")
    this.config = { ...this.config, width: 800, height: 500, ...config } as any
  }

  private async reset() {
    await this.selfieSegmentation?.close()
    this.selfieSegmentation = undefined
  }

  private checkConfig(config: Config) {
    if (!this.config) return false
    if (this.config.stream !== config.stream) return false
    if (!config.height || !config.width) return true
    if (this.config.height !== config.height || this.config.width !== config.width) return false
    return true
  }

  private createElements() {
    if (!this.config) throw Error("Provide a config object")
    if (!this.config.width || !this.config.height) throw Error("There's no width or height in config object")

    const canvas = document.createElement("canvas") as HTMLCanvasElement
    const video = document.createElement("video") as HTMLVideoElement

    canvas.width = this.config.width
    canvas.height = this.config.height

    video.width = this.config.width
    video.height = this.config.height
    video.autoplay = true
    video.srcObject = this.config.stream

    this.video = video
    this.canvas = canvas
  }

  private async setupFilter() {
    const canvas = this.canvas
    if (!canvas) throw Error("No canvas element present")

    const ctx = canvas.getContext("2d")
    if (!ctx) throw Error("No canvas context present")

    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`
      },
    })

    selfieSegmentation.setOptions({ modelSelection: 1 })
    selfieSegmentation.onResults((results) => this.handleSegmentationResults(results, canvas, ctx))
    await selfieSegmentation.initialize()

    this.selfieSegmentation = selfieSegmentation
  }

  private handleSegmentationResults(results: Results, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
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

    if (this.config?.type === "blur-bg") {
      const blur = convertBlurLevel2Pixel(this.config.level || "medium")

      ctx.filter = `blur(${blur})`
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
    } else if (this.config?.type === "change-bg") {
      ctx.drawImage(this.config!.image, 0, 0, canvas.width, canvas.height)
    }

    ctx.restore()
    this.sendNextFrame()
  }

  private sendNextFrame() {
    requestAnimationFrame(async () => {
      if (!this.selfieSegmentation || !this.video) return await this.reset()
      this.selfieSegmentation?.send({ image: this.video })
    })
  }
}

const convertBlurLevel2Pixel = (level: BlurLevel) => {
  const map: Record<BlurLevel, string> = {
    high: "30px",
    medium: "20px",
    low: "10px",
  }
  return map[level]
}

type Config = {
  stream: MediaStream
  width?: number
  height?: number
} & (BlurBg | ChangeBg)

type BlurBg = {
  type: "blur-bg"
  level?: BlurLevel
}

type ChangeBg = {
  type: "change-bg"
  image: HTMLImageElement
}

type BlurLevel = "low" | "medium" | "high"
