import { QueryClient } from "@tanstack/react-query"

declare global {
  namespace QueryClient {}

  declare interface Window {
    queryClient: QueryClient
  }
}
