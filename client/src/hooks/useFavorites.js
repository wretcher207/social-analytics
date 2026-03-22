import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

const PREFIX = 'sa_favorites_'

function storageKey(userId) {
  return `${PREFIX}${userId}`
}

function read(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? JSON.parse(raw) : { products: [], strains: [] }
  } catch {
    return { products: [], strains: [] }
  }
}

function write(userId, data) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data))
  } catch { /* quota exceeded – silently ignore */ }
}

/**
 * Returns { favorites, isFavorite, toggleFavorite }
 *
 * favorites = { products: string[], strains: string[] }
 * isFavorite(type, id) → boolean
 * toggleFavorite(type, id) → void
 */
export function useFavorites() {
  const { user } = useAuth()
  const uid = user?.id ?? '__guest'

  const [favorites, setFavorites] = useState(() => read(uid))

  // Re-sync if user changes
  useEffect(() => { setFavorites(read(uid)) }, [uid])

  const isFavorite = useCallback(
    (type, id) => (favorites[type] ?? []).includes(id),
    [favorites]
  )

  const toggleFavorite = useCallback(
    (type, id) => {
      setFavorites(prev => {
        const list = prev[type] ?? []
        const next = list.includes(id)
          ? list.filter(x => x !== id)
          : [...list, id]
        const updated = { ...prev, [type]: next }
        write(uid, updated)
        return updated
      })
    },
    [uid]
  )

  return { favorites, isFavorite, toggleFavorite }
}
