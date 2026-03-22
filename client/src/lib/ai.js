import { api } from './api'

/**
 * Run AI intake analysis on freeform session notes.
 * Does NOT save to DB — returns structured AI data for user review.
 *
 * @param {{ body: string, product_id?: string, strain_id?: string, consumption_method?: string, dose_description?: string }} payload
 */
export function analyzeNotes(payload) {
  return api.post('/ai/intake', payload)
}

/**
 * Re-process an existing journal entry with AI and persist results.
 *
 * @param {string} entryId
 */
export function processEntry(entryId) {
  return api.post(`/ai/process/${entryId}`)
}
