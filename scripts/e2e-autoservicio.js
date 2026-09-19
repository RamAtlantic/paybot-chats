/**
 * End-to-end del autoservicio contra PRODUCCIÓN (Railway + Mongo real).
 *
 * Crea una room descartable, se conecta por Socket.IO como lo hace el jugador,
 * manda un mensaje y verifica que llegue el saludo con botones. Después dispara
 * las acciones por HTTP y controla que los mensajes vuelvan por el socket.
 *
 * No borra nada: la room de prueba queda en el panel para revisarla a mano y se
 * libera la cuenta desde /registros (o con el smoke de la API).
 *
 *   node scripts/e2e-autoservicio.js [apiUrl]
 */

const { io } = require("socket.io-client")

const API = process.argv[2] || "https://responsible-radiance-production-6ede.up.railway.app"
const API_KEY = process.env.ACCOUNTS_API_KEY || ""
const PHONE = `5490000${Date.now().toString().slice(-6)}`

const recibidos = []
const tipeos = []

function esperar(condicion, descripcion, ms = 15000) {
  return new Promise((resolve, reject) => {
    const desde = Date.now()
    const t = setInterval(() => {
      const hit = recibidos.find(condicion)
      if (hit) { clearInterval(t); resolve(hit) }
      else if (Date.now() - desde > ms) { clearInterval(t); reject(new Error(`timeout esperando: ${descripcion}`)) }
    }, 300)
  })
}

async function post(path, body, conClave = false) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(conClave && API_KEY ? { "x-api-key": API_KEY } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function main() {
  console.log(`\nAPI: ${API}\nTeléfono de prueba: ${PHONE}\n`)

  const { status, data: room } = await post("/api/rooms", {
    phone: PHONE, channel: "chat", source: "e2e-autoservicio", name: `E2E ${PHONE}`,
  })
  if (status >= 400) throw new Error(`no se pudo crear la room: ${JSON.stringify(room)}`)
  const roomId = room.id || room._id
  console.log(`Room: ${roomId}`)

  const socket = io(API, { transports: ["websocket", "polling"], withCredentials: true })
  socket.on("chat-message", (m) => recibidos.push({ ...m, recibidoEn: Date.now() }))
  socket.on("bot-typing", (t) => tipeos.push({ ...t, en: Date.now() }))
  await new Promise((r, j) => {
    socket.on("connect", r)
    socket.on("connect_error", (e) => j(new Error(`socket: ${e.message}`)))
    setTimeout(() => j(new Error("timeout conectando el socket")), 15000)
  })
  socket.emit("join-room", roomId)
  await new Promise((r) => setTimeout(r, 1500))
  console.log("Socket conectado y en la room\n")

  // 1) el jugador escribe por primera vez
  console.log("1) El jugador escribe «hola»")
  const t0 = Date.now()
  socket.emit("chat-message", {
    roomId, message: "hola", phone: PHONE, username: PHONE,
    socketId: socket.id, userId: "e2e", type: "text", read: false, sender: "user",
  })
  const saludo = await esperar((m) => m.type === "interactive" && m.actions?.length, "saludo con botones")
  const demora = saludo.recibidoEn - t0
  const tipeoInicial = tipeos.find((t) => t.typing)
  console.log(`   ✅ ${saludo.content}`)
  saludo.actions.forEach((a) => console.log(`      [${a.label}${a.hint ? " · " + a.hint : ""}]`))
  console.log(
    tipeoInicial && tipeoInicial.en < saludo.recibidoEn
      ? `   ✅ llegó «escribiendo…» ${saludo.recibidoEn - tipeoInicial.en} ms antes del mensaje (demora total ${demora} ms)`
      : `   ⚠️  no llegó el evento bot-typing antes del mensaje (demora ${demora} ms)`
  )
  await new Promise((r) => setTimeout(r, 500))
  console.log(
    tipeos.some((t) => !t.typing) ? "   ✅ y se apagó al llegar el mensaje" : "   ⚠️  no se apagó el indicador"
  )

  // 2) toca el primer botón
  const boton = saludo.actions[0]
  console.log(`\n2) Toca «${boton.label} · ${boton.hint}»`)
  const claim = await post("/api/chat-actions/claim-account", { roomId, responseId: boton.responseId })
  if (claim.status >= 400) throw new Error(`claim falló: ${JSON.stringify(claim.data)}`)
  const credenciales = await esperar((m) => m.content.includes("Usuario:"), "mensaje con las credenciales")
  console.log(`   ✅ entregó ${claim.data.usuario} de ${claim.data.plataforma}`)
  console.log(credenciales.content.split("\n").map((l) => `      ${l}`).join("\n"))

  // 3) botón de CBU (solo si hay datos de cobro cargados)
  const cbu = recibidos.find((m) => m.actions?.some((a) => a.kind === "payment-info"))
  if (!cbu) {
    console.log("\n3) Sin botón de CBU: todavía no hay datos de cobro en Ajustes (esperado)")
  } else {
    console.log("\n3) Toca «CBU para depositar»")
    const pago = await post("/api/chat-actions/payment-info", { roomId })
    if (pago.status >= 400) throw new Error(`payment-info falló: ${JSON.stringify(pago.data)}`)
    const datos = await esperar((m) => m.content.includes("depositar") && !m.actions?.length, "datos de pago")
    console.log(datos.content.split("\n").map((l) => `      ${l}`).join("\n"))
  }

  // 4) el jugador manda una imagen (comprobante)
  console.log("\n4) El jugador manda una imagen")
  const antesImagen = recibidos.length
  socket.emit("chat-message", {
    roomId, message: "https://pub-089ca10a84bf4e3e918a62343d7775f8.r2.dev/cdn-circos/original/e2e.webp",
    phone: PHONE, username: PHONE, socketId: socket.id, userId: "e2e",
    type: "image", read: false, sender: "user",
  })
  const aviso = await esperar(
    (m) => m.username === "Admin" && /valid/i.test(m.content),
    "aviso de validación de la imagen"
  )
  console.log(`   ✅ ${aviso.content}`)

  console.log("   Manda una segunda imagen enseguida…")
  socket.emit("chat-message", {
    roomId, message: "https://pub-089ca10a84bf4e3e918a62343d7775f8.r2.dev/cdn-circos/original/e2e2.webp",
    phone: PHONE, username: PHONE, socketId: socket.id, userId: "e2e",
    type: "image", read: false, sender: "user",
  })
  await new Promise((r) => setTimeout(r, 9000))
  const avisos = recibidos.filter((m) => m.username === "Admin" && /valid/i.test(m.content)).length
  console.log(avisos === 1 ? "   ✅ el antirrebote evitó el segundo aviso" : `   ⚠️  llegaron ${avisos} avisos`)
  void antesImagen

  // 5) mensaje de acreditación (lo dispara el operador)
  console.log("\n5) El operador dispara la acreditación")
  if (!API_KEY) {
    console.log("   ⏭️  sin ACCOUNTS_API_KEY en el entorno, se saltea")
  } else {
    const resp = await fetch(`${API}/api/responses`).then((r) => r.json())
    const acreditacion = resp.find((r) => r.action?.kind === "send-message")
    if (!acreditacion) {
      console.log("   ⚠️  ningún atajo está marcado como mensaje del bot")
    } else {
      const envio = await post(
        "/api/chat-actions/operator-message",
        { roomId, responseId: acreditacion._id, sentBy: "e2e" },
        true
      )
      if (envio.status >= 400) throw new Error(`operator-message falló: ${JSON.stringify(envio.data)}`)
      const acreditado = await esperar((m) => /acredit/i.test(m.content) && m.username === "Admin", "mensaje de acreditación")
      console.log(`   ✅ /${acreditacion.atajo} salió como mensaje del bot:`)
      console.log(acreditado.content.split("\n").map((l) => `      ${l}`).join("\n"))
    }
  }

  // 6) rate limit
  console.log("\n4) Rate limit")
  let bloqueado = false
  for (let i = 0; i < 12; i++) {
    const r = await post("/api/chat-actions/payment-info", { roomId })
    if (r.status === 429) { bloqueado = true; break }
  }
  console.log(bloqueado ? "   ✅ corta a los pocos clicks (429)" : "   ⚠️  no llegó a cortar")

  socket.disconnect()
  console.log(`\nListo. Room de prueba: ${roomId} — cuenta ${claim.data.usuario} (liberala desde /registros)\n`)
}

main().catch((e) => { console.error("\n💥", e.message); process.exit(1) })
