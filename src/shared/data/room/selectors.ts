import { useQuery } from "@tanstack/react-query"
import { getRoomData, getRoomKey } from "./actions"

export const useMediaStream = () => {
  const result = useQuery({ queryKey: getRoomKey("mediaStream"), queryFn: () => getRoomData("mediaStream") })
  return result.data
}

export const useMediaStreamBlurStatus = () => {
  const result = useQuery({ queryKey: getRoomKey("shouldBlurMediaStream"), queryFn: () => getRoomData("shouldBlurMediaStream") })
  return result.data
}
