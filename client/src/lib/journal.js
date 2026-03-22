import { api } from './api'

/**
 * @param {{ strain_id?: string, product_id?: string, from?: string, to?: string, page?: number, limit?: number }} params
 */
export function listEntries(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  )
  return api.get(`/journal${qs.size ? `?${qs}` : ''}`)
}

export function getEntry(id) {
  return api.get(`/journal/${id}`)
}

export function createEntry(body) {
  return api.post('/journal', body)
}

export function updateEntry(id, body) {
  return api.patch(`/journal/${id}`, body)
}

export function deleteEntry(id) {
  return api.delete(`/journal/${id}`)
}

/** Summary stats for dashboard widgets */
export function getJournalStats() {
  return api.get('/journal/stats/summary')
}

/** All distinct user-defined tags with counts */
export function getJournalTags() {
  return api.get('/journal/tags')
}
