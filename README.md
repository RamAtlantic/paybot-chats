# PayBot Chats - Frontend

Este es el frontend de la aplicación de chat PayBot, separado de la API backend.

## Arquitectura

Este proyecto contiene únicamente el frontend de Next.js. La API ha sido separada en un proyecto independiente.

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con la siguiente variable:

```env
# URL de la API externa (requerida)
# Tanto la API REST como los WebSockets usarán esta misma URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Dependencias

Instala las dependencias:

```bash
npm install
```

### Ejecutar el Frontend

```bash
npm run dev
```

El frontend estará disponible en [http://localhost:3000](http://localhost:3000).

## API Externa Requerida

Este frontend requiere una API externa que proporcione los siguientes endpoints:

### Rooms API
- `GET /api/rooms` - Lista todas las rooms
- `POST /api/rooms` - Crea una nueva room
- `GET /api/rooms/:id` - Obtiene información de una room específica
- `DELETE /api/rooms/:id` - Elimina una room

### Socket.IO
- Conexión WebSocket en la URL configurada para comunicación en tiempo real
- Eventos: `join-room`, `chat-message`, etc.

## Estructura del Proyecto

- `app/` - Páginas de Next.js
- `components/` - Componentes reutilizables
- `hooks/` - Hooks personalizados
- `lib/` - Utilidades y configuración de API

## Desarrollo

Para desarrollo local, asegúrate de tener la API backend corriendo en el puerto configurado (por defecto 3001).

# paybot-chats
# paybot-chats
# paybot-chats
# paybot-chats
