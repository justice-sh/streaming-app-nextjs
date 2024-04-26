"use client"

import { useEffect, useRef } from "react"
import { blurMediaStream, removeMediaStreamBlur, startMediaStream } from "@/features/actions/mediaStream"
import { useMediaStream, useMediaStreamBlurStatus } from "@/shared/data/room/selectors"

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const shouldBlurMediaStream = useMediaStreamBlurStatus()

  usePlayMediaStream(videoRef.current)

  useEffect(() => {
    startMediaStream()
  }, [])

  const handleBlurMediaStream = () => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    blurMediaStream(video, canvas)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-[500px] h-[400px] relative aspect-video flex items-center justify-center z-0">
        <video id="video" className="absolute size-full z-10 [transform:rotateY(180deg)] aspect-video" ref={videoRef} autoPlay />

        <canvas
          data-active={!!shouldBlurMediaStream}
          id="canvas"
          className="transition-opacity duration-500 h-[96%] absolute size-full data-active:opacity-100  [transform:rotateY(180deg)] aspect-video z-10 opacity-0"
          ref={canvasRef}
        ></canvas>
      </div>

      <div className="flex gap-3">
        <button className="" onClick={handleBlurMediaStream}>
          Blur Video
        </button>

        <button className="" onClick={removeMediaStreamBlur}>
          Disable Blur
        </button>
      </div>
    </main>
  )
}

const usePlayMediaStream = (video?: HTMLVideoElement | null) => {
  const mediaStream = useMediaStream()

  useEffect(() => {
    if (video && mediaStream) video.srcObject = mediaStream
  }, [mediaStream, video])
}
