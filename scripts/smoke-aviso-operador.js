/**
 * Smoke del aviso al operador contra PRODUCCIÓN.
 *
 * Verifica lo único que el panel necesita para decidir si suena: que
 * `global-message-received` traiga `sender` con el origen correcto.
 *
 *   jugador  -> sender: "user"   (suena)
 *   operador -> sender: "admin"  (no suena)
 *   bot      -> sender: "bot"    (no suena)
 *
 * Crea una room descartable y la deja en el panel para borrarla a mano.
 *
 *   node scripts/smoke-aviso-operador.js [apiUrl]
 */

const { io } = require("socket.io-client")

const API = process.argv[2] || "https://responsible-radiance-production-6ede.up.railway.app"
const PHONE = `5490000${Date.now().toString().slice(-6)}`

const globales = []

function esperar(condicion, descripcion, ms = 20000) {
  return new Promise((resolve, reject) => {
    const desde = Date.now()
    const t = setInterval(() => {
      const hit = globales.find(condicion)
      if (hit) { clearInterval(t); resolve(hit) }
      else if (Date.now() - desde > ms) { clearInterval(t); reject(new Error(`timeout: ${descripcion}`)) }
    }, 300)
  })
}

async function main() {
  console.log(`\nAPI: ${API}\nTeléfono de prueba: ${PHONE}\n`)

  const res = await fetch(`${API}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: PHONE, channel: "chat", source: "smoke-aviso", name: `SMOKE ${PHONE}` }),
  })
  const room = await res.json()
  const roomId = room.id || room._id
  if (!roomId) throw new Error(`no se pudo crear la room: ${JSON.stringify(room)}`)
  console.log(`Room: ${roomId}`)

  const socket = io(API, { transports: ["websocket", "polling"], withCredentials: true })
  socket.on("global-message-received", (e) => globales.push(e))
  await new Promise((r, j) => {
    socket.on("connect", r)
    socket.on("connect_error", (e) => j(new Error(`socket: ${e.message}`)))
    setTimeout(() => j(new Error("timeout conectando el socket")), 15000)
  })
  socket.emit("join-room", roomId)
  await new Promise((r) => setTimeout(r, 1500))

  // 1) el jugador escribe
  socket.emit("chat-message", {
    roomId, message: "hola, quiero un usuario", username: PHONE, type: "text", sender: "user",
  })
  const delJugador = await esperar((e) => e.roomId === roomId && e.sender === "user", "mensaje del jugador")
  console.log(`1) jugador  -> sender=${delJugador.sender} preview=${JSON.stringify(delJugador.preview)}`)

  // 2) el operador contesta (viaja con el teléfono del jugador como username)
  socket.emit("chat-message", {
    roomId, message: "dale, te lo paso", username: PHONE, type: "text", sender: "admin",
  })
  const delOperador = await esperar((e) => e.roomId === roomId && e.sender === "admin", "mensaje del operador")
  console.log(`2) operador -> sender=${delOperador.sender}`)

  // 3) el saludo con botones que dispara el bot solo
  const delBot = await esperar((e) => e.roomId === roomId && e.sender === "bot", "saludo del bot", 25000)
  console.log(`3) bot      -> sender=${delBot.sender} type=${delBot.type}`)

  const soloJugador = globales.filter((e) => e.roomId === roomId && e.sender === "user")
  console.log(`\nEventos que harían sonar el panel: ${soloJugador.length} (esperado 1)`)
  if (soloJugador.length !== 1) throw new Error("el filtro no da: revisar los emits")
  if (!delJugador.preview) throw new Error("falta el preview para la notificación del sistema")

  console.log("\n✅ OK — sólo suena el mensaje del jugador")
  console.log(`   Borrar la room de prueba: ${roomId} (${PHONE})`)
  socket.close()
}

main().catch((e) => { console.error(`\n❌ ${e.message}`); process.exit(1) })
