"use client"

import { useEffect, useRef } from "react"
import { startMediaStream } from "@/features/actions/mediaStream"
import { useRoomDataSelector } from "@/shared/data/room/selectors"
import { getRoomData, deleteRoomData, setRoomData } from "@/shared/data/room/actions"
import { VideoFilter } from "@/shared/utilities/videoFilter"

const videoFilter = new VideoFilter()

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const mediaStream = useRoomDataSelector("mediaStream").data
  const filteredMediaStream = useRoomDataSelector("filteredMediaStream").data

  console.log(filteredMediaStream)

  useLoadStream(videoRef.current, filteredMediaStream || mediaStream)

  useEffect(() => {
    startMediaStream()
  }, [])

  const handleBlurBackground = async () => {
    try {
      const stream = getRoomData("mediaStream")
      if (!stream) return

      const filteredStream = await videoFilter.applyEffect({ stream, type: "blur-bg" })
      if (filteredStream) setRoomData("filteredMediaStream", filteredStream)
    } catch (error) {
      console.error("Blur Background Error:", error)
    }
  }

  const handleChangeBackground = () => {
    const width = videoRef.current?.clientWidth
    const height = videoRef.current?.clientHeight

    const image = new Image(width, height)
    image.src = "/images/high-rise-living-room-zoom-background.webp"

    image.onload = async () => {
      try {
        const stream = getRoomData("mediaStream")
        if (!stream) return

        const filteredStream = await videoFilter.applyEffect({ stream, type: "change-bg", image })
        if (filteredStream) setRoomData("filteredMediaStream", filteredStream)
      } catch (error) {
        console.error("Change Background Error:", error)
      }
    }
  }

  const handleDisableEffect = async () => {
    try {
      await videoFilter.disableEffect()
      await startMediaStream()
      deleteRoomData("filteredMediaStream")
    } catch (error) {
      console.error("Disable Effect", error)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="max-w-[800px] w-full border h-[500px] relative flex items-center justify-center z-0 overflow-hidden">
        <video className="absolute size-full z-10 [transform:rotateY(180deg)]" ref={videoRef} autoPlay />
      </div>

      <div className="flex gap-3">
        <button onClick={handleBlurBackground}>Blur Video</button>

        <button onClick={handleDisableEffect}>Disable Effect</button>

        <button onClick={handleChangeBackground}>Change background</button>
      </div>
    </main>
  )
}

const useLoadStream = (video?: HTMLVideoElement | null, stream?: MediaStream) => {
  useEffect(() => {
    if (video && stream) video.srcObject = stream
  }, [stream, video])
}
