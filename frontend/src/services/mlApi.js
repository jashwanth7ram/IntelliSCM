import axios from 'axios'

const ML_BASE = import.meta.env.VITE_ML_URL || 'http://localhost:8000'

const mlApi = axios.create({ baseURL: ML_BASE })

export const mlAPI = {
  predict:   (data) => mlApi.post('/predict', data),
  modelInfo: ()     => mlApi.get('/model-info'),
  health:    ()     => mlApi.get('/health'),
}

export default mlApi
