import { EventEmitter } from 'events'

export interface IWebSocket {
  onmessage (msg: MessageEvent): void
  onclose (msg: CloseEvent): void
  onerror (msg: { error: Error } | Error): void
}

export class Connection extends EventEmitter {
  public constructor (
    private readonly _socket: IWebSocket
  ) {
    super()
  }
}
