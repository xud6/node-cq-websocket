import { APIResponse } from './model'

export abstract class CQWebSocketError extends Error { }

export abstract class MessageError<T> extends CQWebSocketError {
  public constructor (public data: T, ...args: any[]) { super(...args) }
}

export class InvalidMessage extends MessageError<string> {
  public readonly name: string = 'InvalidMessage'
}

export class UnexpectedMessage extends MessageError<Record<string, any>> {
  public readonly name: string = 'UnexpectedMessage'
  public readonly message: string = 'unexpected message'
}

export class UnhandledResponse extends MessageError<APIResponse> {
  public readonly name: string = 'UnhandledResponse'
  public readonly message: string = 'unhandled response'
}

export class ResponseHandlerError extends CQWebSocketError {
  public readonly name: string = 'ResponseHandlerError'
  public readonly message: string = 'an error occurred inside a response handler'
  public constructor (public readonly origin: Error, ...args: any[]) { super(...args) }
}
