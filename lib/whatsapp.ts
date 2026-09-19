// Armado del link a WhatsApp con el número que está cargado en Ajustes.

/**
 * Deja el número como lo quiere wa.me: solo dígitos y con código de país.
 * El perfil ya suele tener el formato completo (ej. 5492235535858); si alguien
 * carga el número local argentino (2235535858 / 1123456789) se le agrega 54 9.
 */
export function normalizarTelefono(phone?: string | null): string {
  if (!phone) return ""
  const digitos = phone.replace(/\D/g, "")
  if (!digitos) return ""
  if (digitos.startsWith("54")) return digitos
  if (digitos.length === 10) return `549${digitos}`
  if (digitos.length === 11 && digitos.startsWith("9")) return `54${digitos}`
  return `54${digitos}`
}

export function linkWhatsApp(phone?: string | null, mensaje?: string): string | null {
  const numero = normalizarTelefono(phone)
  if (!numero) return null
  const texto = mensaje?.trim()
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`
}

export function mensajeDesdeChat(displayName?: string | null): string {
  return displayName
    ? `Hola ${displayName}! Vengo del chat web 👋`
    : "Hola! Vengo del chat web 👋"
}
