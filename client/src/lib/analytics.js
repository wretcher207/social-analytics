import { api } from './api'

function qs(params) {
  const p = Object.entries(params ?? {}).filter(([, v]) => v != null)
  return p.length ? '?' + new URLSearchParams(p).toString() : ''
}

export const getOverview    = params => api.get(`/analytics/overview${qs(params)}`)
export const getHeatmap     = params => api.get(`/analytics/heatmap${qs(params)}`)
export const getMethods     = params => api.get(`/analytics/methods${qs(params)}`)
export const getByHour      = params => api.get(`/analytics/by-hour${qs(params)}`)
export const getTopProducts = params => api.get(`/analytics/top-products${qs(params)}`)
export const getTopStrains  = params => api.get(`/analytics/top-strains${qs(params)}`)
export const getRatingsTrend = params => api.get(`/analytics/ratings-trend${qs(params)}`)
