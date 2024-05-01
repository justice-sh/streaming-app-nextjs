export type RoomState = {
  isCameraOn?: boolean
  shouldBlurMediaStream?: boolean
  mediaStream?: MediaStream
  streamList?: MediaStream[]
  filteredMediaStream?: MediaStream

  changeMediaStreamBg?: boolean
}
