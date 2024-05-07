export type VideoFilterConfig = {
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

export type BlurLevel = "low" | "medium" | "high"

export type VideoFilterState = "running" | "pending"
