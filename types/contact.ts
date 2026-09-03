
// Interfaces para el servicio de contactos
export interface ContactRequest {
    source: string
    phone: string
    username: string
    notes?: string
    tags?: string
  }
  
  // Interfaces para la respuesta del servicio de contactos
  export interface ContactResponse {
    success: boolean
    contact?: {
      _id: string
      source: string
      phone: string
      username: string
      notes: string
      tags: string
      createdAt: string
    }
    message?: string
    error?: string
  }
  
  // Interfaces para la respuesta de validación de contactos
  export interface ContactValidationResponse {
    exists: boolean
    contact?: {
      _id: string
      source: string
      phone: string
      username: string
      notes: string
      tags: string
      createdAt: string
    }
  }

  export interface Contact {
    _id: string
    source: string
    phone: string
    username: string
    notes: string
    tags: string
    createdAt: string
    updatedAt?: string
  }
  
  export interface ContactsResponse {
    contacts: Contact[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      limit: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
  
  export interface CreateContactData {
    source: string
    phone: string
    username: string
    notes?: string
    tags?: string
  }
  
  export interface UpdateContactData {
    source?: string
    phone?: string
    username?: string
    notes?: string
    tags?: string
  }
  