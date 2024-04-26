import { RoomState } from "./types"

export const getRoomKey = <Key extends keyof RoomState>(key: Key): ["room", keyof RoomState] => ["room", key]

export const setRoomData = <Key extends keyof RoomState>(key: Key, data: RoomState[Key]) => {
  window.queryClient.setQueryData<RoomState[Key]>(getRoomKey(key), data)
}

export const getRoomData = <Key extends keyof RoomState>(key: Key) => {
  return window.queryClient.getQueryData<RoomState[Key]>(getRoomKey(key))
}
