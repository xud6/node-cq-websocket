export interface EventContext {
  post_type: string
}

export function isEventContext (arg: Record<string, any>): arg is EventContext {
  return typeof arg.post_type === 'string'
}

export interface APIRequest<
  Params extends Record<string, any> = Record<string, any>
> {
  action: string
  echo?: any
  params?: Params
}

export function isAPIRequest (arg: Record<string, any>): arg is APIRequest {
  return typeof arg.action === 'string' &&
    (typeof arg.params === 'object' || typeof arg.params === 'undefined')
}

export interface APIResponse<
  Data extends Record<string, any> = Record<string, any>
> {
  retcode: number
  status: string
  echo: any
  data: Data | null
}

export function isAPIResponse (arg: Record<string, any>): arg is APIResponse {
  return typeof arg.retcode === 'number' &&
    typeof arg.status === 'string' &&
    typeof arg.data === 'object'
}
