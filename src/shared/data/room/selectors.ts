import { useQuery } from "@tanstack/react-query"
import { getRoomData, getRoomKey } from "./actions"

// const useTypedQuery = <T>() => {}

export const useMediaStream = () => {
  const result = useQuery({ queryKey: getRoomKey("mediaStream"), queryFn: () => getRoomData("mediaStream") })
  return result.data
}

export const useMediaEffectStatus = () => {
  const r1 = useQuery({ queryKey: getRoomKey("shouldBlurMediaStream"), queryFn: () => getRoomData("shouldBlurMediaStream") })
  const r2 = useQuery({ queryKey: getRoomKey("changeMediaStreamBg"), queryFn: () => getRoomData("changeMediaStreamBg") })

  return r1.data || r2.data || false
}
