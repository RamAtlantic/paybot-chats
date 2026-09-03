import { API_ENDPOINTS } from "@/lib/api-config"

export interface ResponseData {
  _id: string
  atajo: string
  text?: string
  image?: string
  type: "text" | "image" | "mixed"
  status: boolean
  triggers: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateResponseData {
  atajo: string
  text: string
  image?: string
  type: "text" | "image" | "mixed"
  status?: boolean
  triggers?: string[]
}

export interface UpdateResponseData {
  atajo?: string
  text?: string
  image?: string
  type?: "text" | "image" | "mixed"
  status?: boolean
  triggers?: string[]
}

export class ResponsesService {
  // Get all responses or filter by atajo
  static async getResponses(atajo?: string): Promise<ResponseData[]> {
    try {
      const params = new URLSearchParams()
      if (atajo) {
        params.append("atajo", atajo)
      }

      const url = `${API_ENDPOINTS.responses}${params.toString() ? `?${params.toString()}` : ""}`

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
      console.error("Error fetching responses:", error)
      throw error
    }
  }

  // Get specific response by ID
  static async getResponse(responseId: string): Promise<ResponseData> {
    try {
      const response = await fetch(`${API_ENDPOINTS.responses}/${responseId}`, {
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
      console.error("Error fetching response:", error)
      throw error
    }
  }

  // Create new response
  static async createResponse(responseData: CreateResponseData): Promise<ResponseData> {
    try {
        const response = await fetch(`${API_ENDPOINTS.responses}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error creating response:", error)
      throw error
    }
  }

  // Update existing response
  static async updateResponse(responseId: string, updateData: UpdateResponseData): Promise<ResponseData> {
    try {
      const response = await fetch(`${API_ENDPOINTS.responses}/${responseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error updating response:", error)
      throw error
    }
  }
}
