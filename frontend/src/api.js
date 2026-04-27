import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 // 5 minutes to allow for Gemini rate limit pauses
  })
  return response.data
}

export async function analyzeDocument(documentId, query = 'Analyze this legal document fully') {
  const response = await axios.post(`${BASE_URL}/analyze`, {
    document_id: documentId,
    query: query
  }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 300000 // 5 minutes
  })
  return response.data
}
