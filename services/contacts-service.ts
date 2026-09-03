import { API_ENDPOINTS } from '@/lib/api-config'
import { Room } from '@/types/chat'
import { ContactRequest, ContactResponse, ContactValidationResponse, ContactsResponse } from '@/types/contact'

export class ContactService {

  // Valida si existe un contacto con el teléfono o username dado
  static async validateContact(phone: string, username?: string): Promise<ContactValidationResponse> {
    try {
      const params = new URLSearchParams()
      params.append('phone', phone)
      if (username) {
        params.append('username', username)
      }

      const response = await fetch(`${API_ENDPOINTS.contacts}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al validar contacto')
      }

      const data = await response.json()

      // Si hay contactos que coinciden, devolver el primero encontrado
      if (data.contacts && data.contacts.length > 0) {
        return {
          exists: true,
          contact: data.contacts[0] // Retornar el primer contacto encontrado
        }
      }

      return { exists: false }
    } catch (error) {
      console.error('Error en ContactService.validateContact:', error)
      throw error
    }
  }

  // Actualiza un contacto existente
  static async updateContact(contactId: string, contactData: Partial<ContactRequest>): Promise<ContactResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.contacts}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      })

      const data: ContactResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar contacto')
      }

      return data
    } catch (error) {
      console.error('Error en ContactService.updateContact:', error)
      throw error
    }
  }

  // Guarda un contacto
  static async saveContact(contactData: ContactRequest, existingContactId?: string): Promise<ContactResponse> {
    try {
      // Si ya tenemos un contactId, actualizar ese contacto
      if (existingContactId) {
        return await this.updateContact(existingContactId, contactData)
      }

      // Validar si ya existe un contacto con este teléfono o username
      const validation = await this.validateContact(contactData.phone, contactData.username)

      if (validation.exists && validation.contact) {
        // Si existe, actualizar el contacto existente
        return await this.updateContact(validation.contact._id, contactData)
      }

      // Si no existe, crear uno nuevo
      return await this.createContact(contactData)
    } catch (error) {
      console.error('Error en ContactService.saveContact:', error)
      throw error
    }
  }

  // Crea un nuevo contacto
  static async createContact(contactData: ContactRequest): Promise<ContactResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.contacts, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactData,
          notes: contactData.notes || "",
          tags: contactData.tags || ""
        })
      })

      const data: ContactResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear contacto')
      }

      return data
    } catch (error) {
      console.error('Error en ContactService.createContact:', error)
      throw error
    }
  }

  // Valida y agrega un contacto desde un room si no tiene username
  static async validateAndAddContactFromRoom(room: Room, additionalNotes?: string): Promise<ContactResponse> {
    try {
      // Si el room ya tiene username, no necesitamos hacer nada
      if (room.username && room.username.trim() !== '') {
        throw new Error('El contacto ya tiene un nombre de usuario asignado')
      }

      // Preparar los datos del contacto
      const contactData: ContactRequest = {
        source: room.source,
        phone: room.phone,
        username: room.source, // Usar source como username por defecto
        notes: additionalNotes || `Contacto agregado desde chat room ${room._id}`,
        tags: 'chat-contact'
      }

      // Usar saveContact que ya maneja la validación y actualización
      return await this.saveContact(contactData, room.contactId)
    } catch (error) {
      console.error('Error en ContactService.validateAndAddContactFromRoom:', error)
      throw error
    }
  }

  // Agrega un nuevo contacto (sin validación)
  static async addContact(contactData: ContactRequest): Promise<ContactResponse> {
    return this.createContact(contactData)
  }

  // Obtiene los contactos con paginación y filtros
  static async getContacts(
    page: number = 1,
    limit: number = 20,
    phone?: string,
    username?: string
  ): Promise<ContactsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (phone) params.append("phone", phone)
      if (username) params.append("username", username)

      const url = `${API_ENDPOINTS.contacts}?${params.toString()}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error fetching contacts:", error)
      throw error
    }
  }
}
