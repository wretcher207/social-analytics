import { api } from './api'

/**
 * @param {{ q?: string, type?: string, page?: number, limit?: number }} params
 */
export function listStrains(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  )
  return api.get(`/strains${qs.size ? `?${qs}` : ''}`)
}

export function getStrain(id) {
  return api.get(`/strains/${id}`)
}

export function createStrain(body) {
  return api.post('/strains', body)
}

export function updateStrain(id, body) {
  return api.patch(`/strains/${id}`, body)
}

export function deleteStrain(id) {
  return api.delete(`/strains/${id}`)
}
