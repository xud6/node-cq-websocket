import { EventEmitter } from 'events'
import nanoid from 'nanoid'
import pTimeout from 'p-timeout'

import {
  InvalidMessage,
  UnhandledResponse,
  UnexpectedMessage,
  ResponseHandlerError
} from './error'
import {
  EventContext,
  isAPIResponse,
  isEventContext,
  APIResponse,
  APIRequest
} from './model'

export interface WebSocketAPI {
  close (code?: number, reason?: string): void
  send (msg: string): void
}

export interface CloseDescriptor {
  code: number
  reason: string
}

export type CloseHandler = (code: number, reason: string) => void
export interface CloseOptions {
  code: number
  reason: string
  timeout: number
}

export class Connection extends EventEmitter {
  private _closed: boolean = false
  private _closedAt?: Date
  private _closeCode?: number
  private _closeReason?: string
  private readonly _closeHandlers: CloseHandler[] = []

  public constructor (protected _socket: WebSocketAPI) { super() }

  public get closed (): boolean {
    return this._closed
  }

  public get closedAt (): Date | undefined {
    return this._closedAt
  }

  public get closeCode (): number | undefined {
    return this._closeCode
  }

  public get closeReason (): string | undefined {
    return this._closeReason
  }

  /* eslint-disable no-dupe-class-members */
  public async close (options?: Partial<CloseOptions>): Promise<CloseDescriptor>
  public async close (code?: number, reason?: string, timeout?: number): Promise<CloseDescriptor>
  public async close (
    arg1?: number | Partial<CloseOptions>,
    arg2?: string,
    arg3?: number
  ): Promise<CloseDescriptor> {
  /* eslint-enable no-dupe-class-members */
    let code: number | undefined
    let reason: string | undefined
    let timeout: number
    if (typeof arg1 === 'object') {
      code = arg1.code
      reason = arg1.reason
      timeout = typeof arg1.timeout === 'number' ? arg1.timeout : Infinity
    } else {
      code = arg1
      reason = arg2
      timeout = typeof arg3 === 'number' ? arg3 : Infinity
    }
    const closePromise = new Promise<CloseDescriptor>((resolve, reject) => {
      this._closeHandlers.push((code, reason) => {

      })
      this._socket.close(code, reason)
    })
    return pTimeout(closePromise, timeout)
  }

  /**
   * @internal
   */
  public handleClose (code: number, reason: string): void {
    this._closed = true
    this._closedAt = new Date()
    this._closeCode = code
    this._closeReason = reason
    this.emit('close', code, reason)
  }

  /**
   * @internal
   */
  public handleError (error: Error): void {
    this.emit('error', error)
  }

  public handleMessage (msg: string | Record<string, any>): Record<string, any> | undefined {
    this.emit('data', msg)

    let record: Record<string, any>
    if (typeof msg === 'string') {
      try {
        record = JSON.parse(msg)
      } catch (e) {
        const error = new InvalidMessage(msg, e.message)
        this.emit('error', error)
        return
      }
    } else {
      record = msg
    }

    if (typeof record !== 'object') {
      const original = typeof msg === 'string' ? msg : JSON.stringify(record)
      const error = new InvalidMessage(original, 'non-object message')
      this.emit('error', error)
      return
    }

    return record
  }
}

export class EventConnection extends Connection {
  public handleMessage (msg: string | Record<string, any>): EventContext | undefined {
    const record = super.handleMessage(msg)
    if (typeof record !== 'undefined') {
      if (isEventContext(record)) {
        this.emit('message', record)
        return record
      }
      this.emit('error', new UnexpectedMessage(record))
    }
  }
}

export type ResponseHandler = (resp: APIResponse) => void

export interface APIConnectionOptions {
  echoLength?: number
}

export class APIConnection extends Connection {
  private readonly echoLength?: number
  private readonly _responseHandlers: Map<any, ResponseHandler> = new Map()

  public constructor (socket: WebSocketAPI, options?: APIConnectionOptions) {
    super(socket)
    if (typeof options === 'object') {
      this.echoLength = options.echoLength
    }
  }

  public async send <
    Data extends Record<string, any> = Record<string, any>,
    Params extends Record<string, any> = Record<string, any>
  > (req: APIRequest<Params>, timeout: number = Infinity): Promise<APIResponse<Data>> {
    const sendPromise = new Promise<APIResponse<Data>>((resolve, reject) => {
      const echo = typeof req.echo === 'undefined' ? nanoid(this.echoLength) : req.echo
      this._responseHandlers.set(echo, (resp) => resolve(resp as APIResponse<Data>))
      this._socket.send(JSON.stringify(req))
    })
    return pTimeout(sendPromise, timeout)
  }

  public handleMessage (msg: string | Record<string, any>): APIResponse | undefined {
    const record = super.handleMessage(msg)
    if (typeof record !== 'undefined') {
      if (isAPIResponse(record)) {
        const handler = this._responseHandlers.get(record.echo)
        if (typeof handler === 'function') {
          try {
            handler(record)
          } catch (e) {
            this.emit('error', new ResponseHandlerError(e))
            return
          }
          return record
        }

        if (this.emit('response', record)) {
          return record
        }

        this.emit('error', new UnhandledResponse(record))
        return
      }

      this.emit('error', new UnexpectedMessage(record))
    }
  }
}

export class UniversalConnection extends Connection {
}
