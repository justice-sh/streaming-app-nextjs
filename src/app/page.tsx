"use client"

import { useEffect, useRef, useState } from "react"
import { startMediaStream } from "@/features/actions/mediaStream"
import { useMediaStream } from "@/shared/data/room/selectors"
import { getRoomData, removeRoomData, setRoomData } from "@/shared/data/room/actions"
import { videoStreamFilter } from "@/shared/utilities/videoStreamFilter"

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [] = useState()

  usePlayMediaStream(videoRef.current)

  useEffect(() => {
    startMediaStream()
  }, [])

  const handleBlurBackground = async () => {
    try {
      const stream = getRoomData("mediaStream")
      if (!stream) return

      const width = videoRef.current?.clientWidth
      const height = videoRef.current?.clientHeight

      const filteredStream = await videoStreamFilter.applyEffect({ stream, type: "blur_background", height, width })
      // if (filteredStream) setRoomData("filteredMediaStream", filteredStream)
    } catch (error) {
      console.error("Blur Background Error:", error)
    }
  }

  const handleChangeBackground = () => {
    const image = new Image(640, 360)
    image.src = "/images/high-rise-living-room-zoom-background.webp"

    image.onload = handleLoad

    async function handleLoad() {
      try {
        const stream = getRoomData("mediaStream")
        if (!stream) return

        const width = videoRef.current?.clientWidth
        const height = videoRef.current?.clientHeight

        const filteredStream = await videoStreamFilter.applyEffect({ stream, type: "change_background", image, height, width })
        if (filteredStream) setRoomData("filteredMediaStream", filteredStream)
      } catch (error) {
        console.error("Change Background Error:", error)
      }
    }
  }

  const handleDisableEffect = async () => {
    try {
      await videoStreamFilter.disableEffect()
      await startMediaStream()
      removeRoomData("filteredMediaStream")
    } catch (error) {
      console.error("Disable Effect", error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div
        className="max-w-[800px] w-full border h-[500px] relative flex items-center justify-center z-0 overflow-hidden"
        id="frame-container"
      >
        <video id="video" className="absolute size-full z-10 [transform:rotateY(180deg)] object-fill" ref={videoRef} autoPlay />
      </div>

      <div className="flex gap-3">
        <button className="" onClick={handleBlurBackground}>
          Blur Video
        </button>

        <button className="" onClick={handleDisableEffect}>
          Disable Effect
        </button>

        <button className="" onClick={handleChangeBackground}>
          Change background
        </button>
      </div>
    </main>
  )
}

const usePlayMediaStream = (video?: HTMLVideoElement | null) => {
  const mediaStream = useMediaStream()

  useEffect(() => {
    if (video && mediaStream) {
      video.srcObject = mediaStream
    }
  }, [mediaStream, video])
}
