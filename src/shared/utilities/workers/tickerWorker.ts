let interval: NodeJS.Timeout

self.onmessage = function (event: MessageEvent<"start" | "stop">) {
  if (event.data === "start") {
    clearInterval(interval)
    interval = setInterval(() => self.postMessage("tick"), 33)
  } else if (event.data === "stop") {
    clearInterval(interval)
  }
}
