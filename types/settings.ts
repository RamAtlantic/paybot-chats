// Interfaces para el servicio de settings
export interface SettingsData {
    _id: string
    profileImage?: {
      filename: string
      originalUrl: string
      sizes: {
        small: string
        original: string
      }
    }
    isConnected: boolean
    displayName: string
    platformLink?: string
    description: string
    welcomeMessage: string
    phone?: string
    timestamp: string
    createdAt: string
    updatedAt: string
  }
  
  // Interfaces para la solicitud de actualización de configuraciones
  export interface UpdateSettingsRequest {
    profileImage?: string
    isConnected?: boolean
    displayName: string
    platformLink?: string
    description: string
    welcomeMessage: string
    phone?: string
    timestamp?: string
  }
  
  // Interfaces para la respuesta de las configuraciones
  export interface SettingsResponse {
    success: boolean
    message?: string
    settings?: SettingsData
    error?: string
  }
  