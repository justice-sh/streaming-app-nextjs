import { SelfieSegmentation, Results } from "@mediapipe/selfie_segmentation"
import { Application, ApplicationOptions, Renderer } from "pixi.js"
import { tickerWorker } from "./workers"

export class VideoFilter {
  private config?: Config
  private app?: Application<Renderer>
  private selfieSegmentation?: SelfieSegmentation

  async applyEffect(config: Config) {
    const isPassed = this.checkConfig(config)
    this.updateConfig(config)

    if (isPassed && this.selfieSegmentation) return undefined

    await this.reset()
    await this.setup()
    return this.app?.canvas.captureStream(60)
  }

  async disableEffect() {
    await this.reset()
    this.config = undefined
    this.selfieSegmentation = undefined
    this.app = undefined
  }

  private updateConfig(config: Partial<Config>) {
    if (!this.config?.stream && !config?.stream) throw Error("No stream provided")
    this.config = { ...this.config, width: 670, height: 500, ...config } as any
  }

  private async reset() {
    this.app?.stop()
    await this.selfieSegmentation?.close()
    tickerWorker.postMessage("stop")
  }

  private checkConfig(config: Config) {
    if (!this.config) return false
    if (this.config.stream !== config.stream) return false
    if (!config.height || !config.width) return true
    if (this.config.height !== config.height || this.config.width !== config.width) return false
    return true
  }

  private async setup() {
    try {
      tickerWorker.postMessage("start")

      if (!this.config) throw Error("Provide a config object")

      const { width, height } = this.config
      if (!width || !height) throw Error("Config object is missing width or height")

      const { video, canvas, ctx } = getElements(this.config)

      this.app = new Application()
      await initPixiAppWithSupportedRenderer(this.app, { width, height, canvas, powerPreference: "high-performance" })

      this.selfieSegmentation = await this.initSelfiSegmentation(canvas, ctx)

      tickerWorker.onmessage = (event) => {
        if (event.data === "tick" && this.selfieSegmentation) this.selfieSegmentation.send({ image: video })
      }
    } catch (error) {
      await this.disableEffect()
      throw error
    }
  }

  private async initSelfiSegmentation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`,
    })

    selfieSegmentation.setOptions({ modelSelection: 1, selfieMode: false })
    selfieSegmentation.onResults((results) => this.handleSegmentationResults(results, canvas, ctx))
    await selfieSegmentation.initialize()

    return selfieSegmentation
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
  }
}

const initPixiAppWithSupportedRenderer = async (app: Application<Renderer>, options: Partial<ApplicationOptions>) => {
  try {
    await app.init({ ...options, preference: "webgl" })
  } catch (error) {
    await app.init({ ...options, preference: "webgpu" })
  }
}

const getElements = (config?: Config) => {
  if (!config) throw Error("Provide a config object")
  if (!config.stream) throw Error("Invalid config object: missing stream")
  if (!config.width || !config.height) throw Error("There's no width or height in config object")

  const canvas = document.createElement("canvas")
  // canvas.width = config.width // width and height have no effect on the output
  // canvas.height = config.height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw Error("Could not create canvas context")

  const video = document.createElement("video")
  video.autoplay = true
  video.srcObject = config.stream
  // video.width = config.width // width and height have no effect on the output
  // video.height = config.height

  return { video, canvas, ctx }
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
