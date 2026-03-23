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

/** Spending aggregation across all priced products */
export function getSpendSummary() {
  return api.get('/products/spend-summary')
}

/**
 * Read a File, base64-encode it, and POST to the OCR endpoint.
 * Returns structured extraction data ready to pre-fill the product form.
 */
export function scanLabel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const [header, base64] = reader.result.split(',')
        const media_type = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
        const result = await api.post('/products/ocr', { image: base64, media_type })
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}
