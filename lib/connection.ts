import { EventEmitter } from 'events'
import { InvalidMessage, UnhandledResponse, UnexpectedMessage, ResponseHandlerError } from './error'
import { EventContext, isAPIResponse, isEventContext, APIResponse } from './model'

export class Connection extends EventEmitter {
  public handleMessage (msg: string | Record<string, any>): Record<string, any> | undefined {
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

export class APIConnection extends Connection {
  private readonly _responseHandlers: Map<any, ResponseHandler> = new Map()

  public send () {}

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

        this.emit('error', new UnhandledResponse(record))
        return
      }

      this.emit('error', new UnexpectedMessage(record))
    }
  }
}

export class UniversalConnection extends Connection {
}
