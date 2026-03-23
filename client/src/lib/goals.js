import { api } from './api'

export const getGoals    = ()       => api.get('/goals')
export const createGoal  = (body)   => api.post('/goals', body)
export const updateGoal  = (id, b)  => api.patch(`/goals/${id}`, b)
export const deleteGoal  = (id)     => api.delete(`/goals/${id}`)
