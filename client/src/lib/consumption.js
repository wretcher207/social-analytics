import { api } from './api'

/**
 * @param {{ product_id?: string, from?: string, to?: string, page?: number, limit?: number }} params
 */
export function listLogs(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  )
  return api.get(`/consumption${qs.size ? `?${qs}` : ''}`)
}

export function getLog(id) {
  return api.get(`/consumption/${id}`)
}

export function createLog(body) {
  return api.post('/consumption', body)
}

export function updateLog(id, body) {
  return api.patch(`/consumption/${id}`, body)
}

export function deleteLog(id) {
  return api.delete(`/consumption/${id}`)
}
