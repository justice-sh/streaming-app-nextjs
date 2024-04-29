export type RoomState = {
  isCameraOn?: boolean
  shouldBlurMediaStream?: boolean
  mediaStream?: MediaStream
  filteredMediaStream?: MediaStream

  changeMediaStreamBg?: boolean
}
