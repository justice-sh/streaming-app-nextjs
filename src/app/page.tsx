"use client"

import { useEffect, useRef } from "react"
import { blurMediaStream, changeMediaStreamBackground, removeMediaStreamEffect, startMediaStream } from "@/features/actions/mediaStream"
import { useMediaStream, useMediaEffectStatus } from "@/shared/data/room/selectors"

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const shouldApplyEffect = useMediaEffectStatus()

  usePlayMediaStream(videoRef.current)

  useEffect(() => {
    startMediaStream()
  }, [])

  const handleBlurMediaStream = () => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    blurMediaStream(video, canvas)
  }

  const handleChangeMediaStreamBackground = () => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    changeMediaStreamBackground(video, canvas)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-[500px] h-[400px] relative flex items-center justify-center z-0 overflow-hidden">
        <video id="video" className="absolute size-full z-10 [transform:rotateY(180deg)] aspect-video" ref={videoRef} autoPlay />

        <canvas
          data-active={shouldApplyEffect}
          id="canvas"
          className="transition-opacity duration-500 absolute size-full data-active:opacity-100  [transform:rotateY(180deg)] aspect-video z-10 opacity-0"
          ref={canvasRef}
        ></canvas>
      </div>

      <div className="flex gap-3">
        <button className="" onClick={handleBlurMediaStream}>
          Blur Video
        </button>

        <button className="" onClick={removeMediaStreamEffect}>
          Disable Effect
        </button>

        <button className="" onClick={handleChangeMediaStreamBackground}>
          Change background
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
