import { api } from './api'

export const METHODS = ['dab', 'vape', 'bowl', 'joint', 'edible', 'tincture', 'other']

export const METHOD_COLOR = {
  dab:      '#c8a96e',
  vape:     '#8b7baf',
  bowl:     '#7dc98c',
  joint:    '#b8a96e',
  edible:   '#6eb8b8',
  tincture: '#6e8bb8',
  other:    '#8a8a8a',
}

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
