import { API_ENDPOINTS } from '@/lib/api-config'
import { SettingsData, UpdateSettingsRequest, SettingsResponse } from '@/types/settings'


export class SettingsService {
  
  // Obtiene las configuraciones actuales
  static async getSettings(): Promise<SettingsData> {
    try {
      const response = await fetch(`${API_ENDPOINTS.settings}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: SettingsData = await response.json()
      return data
    } catch (error) {
      console.error('Error en SettingsService.getSettings:', error)
      throw error
    }
  }

  // Actualiza las configuraciones
  static async updateSettings(settingsData: UpdateSettingsRequest): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.settings}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData)
      })

      const data: SettingsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar settings')
      }

      return data
    } catch (error) {
      console.error('Error en SettingsService.updateSettings:', error)
      throw error
    }
  }
}
