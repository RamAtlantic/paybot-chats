// Interfaz para los resultados de subida
export interface UploadResult {
  filename: string
  originalUrl: string
  sizes: {
    small: string
    medium: string
    large: string
    original: string
  }
}

export interface ProductImage {
  id: string | number
  src: string
  filename?: string
  isUploading?: boolean
  position?: number
  product_id?: number
  url?: string
  alt?: string[]
  created_at?: string
  updated_at?: string
}

/**
 * Sube una imagen a Cloudflare R2 a través de una API route
 */
export async function uploadImageToR2(file: File): Promise<UploadResult> {
  // Crear FormData para enviar el archivo
  const formData = new FormData()
  formData.append('file', file)

  // Llamar a nuestra API route que manejará la subida a R2
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Error al subir imagen: ${response.status}`)
  }

  return await response.json()
}