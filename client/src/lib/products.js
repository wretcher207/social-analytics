import { api } from './api'

/**
 * @param {{ category?: string, archived?: boolean, page?: number, limit?: number }} params
 */
export function listProducts(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  )
  return api.get(`/products${qs.size ? `?${qs}` : ''}`)
}

export function getProduct(id) {
  return api.get(`/products/${id}`)
}

export function createProduct(body) {
  return api.post('/products', body)
}

export function updateProduct(id, body) {
  return api.patch(`/products/${id}`, body)
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`)
}
