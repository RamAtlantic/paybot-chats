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

/**
 * Texto que se abre ya escrito en WhatsApp. Si la persona ya tiene un usuario
 * entregado por la automation, va incluido: así el operador sabe con quién
 * habla sin tener que buscarlo.
 */
export function mensajeDesdeChat(
  displayName?: string | null,
  cuenta?: { usuario?: string | null; plataforma?: string | null }
): string {
  const saludo = displayName
    ? `Hola ${displayName}! Vengo del chat web 👋`
    : "Hola! Vengo del chat web 👋"

  const usuario = cuenta?.usuario?.trim()
  if (!usuario) return saludo

  const plataforma = cuenta?.plataforma?.trim()
  return `${saludo}\nMi usuario es ${usuario}${plataforma ? ` (${plataforma})` : ""}`
}

/** Primera plataforma taggeada en la room (la automation la deja en `tags`). */
export function plataformaDeRoom(tags?: string | null): string {
  if (!tags) return ""
  return tags.split(",").map((t) => t.trim()).filter(Boolean)[0] || ""
}
