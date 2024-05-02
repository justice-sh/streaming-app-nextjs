const tickerWorker = new Worker(new URL("./tickerWorker", import.meta.url), {
  type: "module",
})

export { tickerWorker }
