import { getRoomData, setRoomData } from "@/shared/data/room/actions"

export const startMediaStream = async () => {
  if (!hasGetUserMedia()) throw Error("User does not have media")

  const stream = await navigator.mediaDevices.getUserMedia({ video: true })

  getRoomData("mediaStream")
    ?.getTracks()
    .forEach((t) => t.stop())

  setRoomData("mediaStream", stream)
  setRoomData("isCameraOn", true)
}

export const stopMediaStream = async () => {
  const stream = getRoomData("mediaStream")

  stream?.getTracks().forEach((t) => t.stop())

  setRoomData("mediaStream", undefined)
  setRoomData("isCameraOn", false)
}

export const removeMediaStreamEffect = () => {
  setRoomData("shouldBlurMediaStream", false)
  setRoomData("changeMediaStreamBg", false)
}

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export default startMediaStream
