import { request } from '@umijs/max';

const baseRequest = function <Type>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any, options?: Record<string, any>): Promise<unknown> {
  return request<Type>(url, {
    method: method,
    data: body,
    ...(options || {}),
  });
}

export const webapi = {
  get: function <Type>(url: string, body?: any, options?: Record<string, any>): Promise<unknown> {
    return baseRequest<Type>('GET', url, body, options)
  },
  post: function <Type>(url: string, body?: any, options?: Record<string, any>): Promise<unknown> {
    return baseRequest<Type>('POST', url, body, options)
  },
  put: function <Type>(url: string, body?: any, options?: Record<string, any>): Promise<unknown> {
    return baseRequest<Type>('PUT', url, body, options)
  },
  delete: function <Type>(url: string, body?: any, options?: Record<string, any>): Promise<unknown> {
    return baseRequest<Type>('PUT', url, body, options)
  },
  request: baseRequest,
}
