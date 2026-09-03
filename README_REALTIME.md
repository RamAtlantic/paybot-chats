# Configuración de Actualizaciones en Tiempo Real

Este documento explica cómo configurar el servidor para que emita eventos de socket que permitan actualizaciones en tiempo real de la lista de salas cuando llegan nuevos mensajes.

## Eventos de Socket Requeridos

El cliente ahora escucha los siguientes eventos de socket globales para actualizar la lista de salas:

### Eventos que debe emitir el servidor:

1. **`new-message`** - Cuando llega un nuevo mensaje a cualquier sala
2. **`room-updated`** - Cuando se actualiza cualquier propiedad de una sala
3. **`rooms-updated`** - Cuando hay cambios masivos en las salas

### Estructura del evento `new-message`:

```javascript
socket.emit('new-message', {
  roomId: 'room_id_here',
  message: {
    content: 'Mensaje de ejemplo',
    timestamp: new Date().toISOString(),
    phone: '123456789',
    type: 'text'
  },
  unreadCount: 5, // Número de mensajes no leídos actualizado
  lastMessage: 'Mensaje de ejemplo',
  lastMessageType: 'text'
})
```

### Estructura del evento `room-updated`:

```javascript
socket.emit('room-updated', {
  roomId: 'room_id_here',
  updates: {
    unreadCount: 3,
    lastMessage: 'Último mensaje',
    lastMessageType: 'text',
    lastMessageTime: new Date().toISOString()
  }
})
```

## Implementación en el Servidor

### 1. Cuando llega un mensaje nuevo:

```javascript
// En el handler de mensajes del servidor
io.emit('new-message', {
  roomId: message.roomId,
  message: message,
  unreadCount: await getUnreadCount(message.roomId),
  lastMessage: message.content,
  lastMessageType: message.type
});

// También emitir a la sala específica
io.to(message.roomId).emit('chat-message', message);
```

### 2. Cuando se marca un mensaje como leído:

```javascript
// Al marcar mensajes como leídos
io.emit('room-updated', {
  roomId: roomId,
  updates: {
    unreadCount: 0
  }
});
```

## Configuración del Cliente

El cliente ya está configurado para:

1. Conectar a un socket global usando `useGlobalSocket()`
2. Escuchar eventos de actualización de salas
3. Refrescar automáticamente la lista de salas cuando llegan eventos
4. Mantener un intervalo de polling de 2 minutos como fallback

## Beneficios

- ✅ Actualizaciones en tiempo real cuando llegan mensajes
- ✅ Reducción significativa del uso de CPU y red (menos polling)
- ✅ Mejor experiencia de usuario con feedback inmediato
- ✅ Sistema de fallback por si falla la conexión de socket
