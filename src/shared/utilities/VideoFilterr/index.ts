import { SelfieSegmentation, Results } from "@mediapipe/selfie_segmentation"
import { Application, ApplicationOptions, Renderer } from "pixi.js"
import { BlurLevel, VideoFilterConfig } from "./types"
import { tickerWorker } from "../workers"
import loglevel from "loglevel"

export class VideoFilter {
  private config?: VideoFilterConfig
  private app?: Application<Renderer>
  private selfieSegmentation?: SelfieSegmentation
  private shouldApplyEffect = false
  private capturedStream?: MediaStream

  /**
   *
   * @param config VideoFilterConfig
   * @returns boolean (shouldApplyEffect)
   * - Sometimes you don't need to call applyEffect() after updating config.
   * - This method returns a shouldApplyEffect (boolean) value to help you know when to apply effect
   * - 'true' means you should call applyEffect()
   * - 'false' means there's no need (note that, you won't spoil anything if you do)
   */
  updateConfig(config: VideoFilterConfig): boolean {
    this.sanityCheck(config)
    this.shouldApplyEffect = this.checkShouldApplyEffect(config)
    this.config = { ...this.config, width: 670, height: 500, ...config }
    return this.shouldApplyEffect
  }

  /**
   * Call this method if you get 'true', after calling updateConfig.
   * However, the method is smart enough, so even if you call it on 'false', nothing breaks.
   * @returns MediaStream
   */
  async applyEffect() {
    this.sanityCheck()
    if (!this.shouldApplyEffect && this.capturedStream) return this.capturedStream

    await this.reset()
    await this.setup()

    this.capturedStream = this.app!.canvas.captureStream(60)
    return this.capturedStream
  }

  async disableEffect() {
    await this.reset()
    this.config = undefined
    this.selfieSegmentation = undefined
    this.app = undefined
    this.capturedStream = undefined
  }

  private async reset() {
    tickerWorker.postMessage("stop")
    this.shouldApplyEffect = false
    await this.selfieSegmentation?.close()
  }

  private sanityCheck(config?: VideoFilterConfig) {
    if (!this.config && !config) throw Error("No config available. First update config")
    if (!this.config?.stream && !config?.stream) throw Error("No stream available in config object")
    if (!this.config?.type && !config?.type) throw Error("No filter type available in config object")
  }

  /**
   *
   * @param config VideoFilterConfig
   * @returns boolean
   *
   * Checks if we should apply effect based on new config and old config
   */
  private checkShouldApplyEffect(config: VideoFilterConfig) {
    if (!this.config || this.config.stream.id !== config.stream.id) return true
    if (!config.height || !config.width) return false
    if (this.config.height !== config.height || this.config.width !== config.width) return true
    return false
  }

  private async setup() {
    try {
      tickerWorker.postMessage("start")

      const { width, height } = this.config!
      const { video, canvas, ctx } = getElements(this.config!.stream)

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
    const selfieSegmentation = new SelfieSegmentation({ locateFile: (file) => `/models/${file}` })
    selfieSegmentation.setOptions({ modelSelection: 1, selfieMode: false })
    selfieSegmentation.onResults((results) => this.handleSegmentationResults(results, canvas, ctx))
    await selfieSegmentation.initialize()
    return selfieSegmentation
  }

  private handleSegmentationResults(results: Results, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    try {
      this.sanityCheck()

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

      if (this.config!.type === "blur-bg") {
        const blur = convertBlurLevel2Pixel(this.config!.level || "medium")

        ctx.filter = `blur(${blur})`
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
      } else {
        ctx.drawImage(this.config!.image, 0, 0, canvas.width, canvas.height)
      }
      ctx.restore()
    } catch (error) {
      loglevel.error("VideoFilter Handler Error:", error)
    }
  }
}

const initPixiAppWithSupportedRenderer = async (app: Application<Renderer>, options: Partial<ApplicationOptions>) => {
  try {
    await app.init({ ...options, preference: "webgl" })
  } catch (error) {
    await app.init({ ...options, preference: "webgpu" })
  }
}

const getElements = (stream: MediaStream) => {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw Error("Could not create canvas context")

  const video = document.createElement("video")
  video.autoplay = true
  video.srcObject = stream

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

/** NOTE
 *
 * const selfieSegmentation = new SelfieSegmentation({ locateFile: (file) => `/models/${file}` })
 * On this line I'm loading the files locally, but you could serve them over cdn through this link:
 * -> `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`
 */
