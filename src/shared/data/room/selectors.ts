import { useQuery } from "@tanstack/react-query"
import { getRoomKey } from "./actions"
import { RoomState } from "./types"

const useRoomDataSelector = <Key extends keyof RoomState>(key: Key) => {
  const result = useQuery<RoomState[Key]>({ queryKey: getRoomKey(key), enabled: false })
  return result
}

export const useMediaStream = () => {
  const original = useRoomDataSelector("mediaStream")
  // const filtered = useRoomDataSelector("filteredMediaStream")

  return original.data
}
