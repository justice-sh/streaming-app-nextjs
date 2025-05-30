"use client"

import { ReactNode, useEffect, useRef } from "react"
import { startMediaStream, stopMediaStream } from "@/features/actions/mediaStream"
import { useRoomDataSelector } from "@/shared/data/room/selectors"
import { getRoomData, deleteRoomData, setRoomData } from "@/shared/data/room/actions"
import { VideoFilter } from "@/shared/utilities/VideoFilterr"

const videoFilter = new VideoFilter()

export default function VideoStream() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const mediaStream = useRoomDataSelector("mediaStream").data
  const filteredMediaStream = useRoomDataSelector("filteredMediaStream").data

  useLoadStream(videoRef.current, filteredMediaStream || mediaStream)

  const handleBlurBackground = async () => {
    try {
      const stream = getRoomData("mediaStream")
      if (!stream) return

      const shouldApply = videoFilter.updateConfig({ stream, type: "blur-bg" })
      if (!shouldApply) return

      const filteredStream = await videoFilter.applyEffect()
      setRoomData("filteredMediaStream", filteredStream)
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

        const shouldApply = videoFilter.updateConfig({ stream, type: "change-bg", image })
        if (!shouldApply) return

        const filteredStream = await videoFilter.applyEffect()
        setRoomData("filteredMediaStream", filteredStream)
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-4">
      <div className="max-w-[800px] w-full border h-[500px] relative flex items-center justify-center z-0 overflow-hidden">
        <video className="absolute size-full z-10 [transform:rotateY(180deg)]" ref={videoRef} autoPlay />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={startMediaStream}>Enable Cam</Button>

        <Button onClick={stopMediaStream}>Disable Cam</Button>

        <Button onClick={handleBlurBackground}>Blur Video</Button>

        <Button onClick={handleChangeBackground}>Change background</Button>

        <Button onClick={handleDisableEffect}>Disable Effect</Button>
      </div>
    </main>
  )
}

const useLoadStream = (video?: HTMLVideoElement | null, stream?: MediaStream) => {
  useEffect(() => {
    if (video && stream) video.srcObject = stream
  }, [stream, video])
}

const Button = ({ children, onClick }: { onClick?: () => void; children?: ReactNode }) => (
  <button className="bg-green-500 p-3 text-lg" onClick={onClick}>
    {children}
  </button>
)
