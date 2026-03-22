import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import styles from './FavoriteBtn.module.css'

/**
 * type: 'products' | 'strains'
 * id:   string (uuid)
 * size: number (icon px, default 14)
 */
export function FavoriteBtn({ type, id, size = 14, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(type, id)

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(type, id)
  }

  return (
    <button
      type="button"
      className={[styles.btn, active ? styles.active : '', className].join(' ')}
      onClick={handleClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart size={size} strokeWidth={1.5} fill={active ? 'currentColor' : 'none'} />
    </button>
  )
}
