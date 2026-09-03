// Configuración para la API externa
// Cambia esta URL cuando tengas la API separada
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Endpoints de la API
export const API_ENDPOINTS = {
  baseUrl: API_BASE_URL,
  rooms: `${API_BASE_URL}/api/rooms`,
  messages: `${API_BASE_URL}/api/messages`,
  users: `${API_BASE_URL}/api/users`,
  contacts: `${API_BASE_URL}/api/contact`,
  responses: `${API_BASE_URL}/api/responses`,
  settings: `${API_BASE_URL}/api/settings`,
  archived: `${API_BASE_URL}/api/archived`,
  socket: API_BASE_URL, // El socket usa la misma URL base que la API
}
