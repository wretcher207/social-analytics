import { api } from './api'

export function getProfile() {
  return api.get('/profile')
}

export function updateProfile(payload) {
  return api.patch('/profile', payload)
}

export async function exportAndDownload() {
  const data = await api.get('/profile/export')
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `terp-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
