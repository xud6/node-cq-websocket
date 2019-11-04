export interface IWebSocket {
  onmessage (msg: MessageEvent): void
  onclose (msg: CloseEvent): void
  onerror (msg: { error: Error } | Error): void
}
