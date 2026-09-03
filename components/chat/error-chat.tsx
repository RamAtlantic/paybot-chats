import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

const ErrorCard = () => {
  return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
    <Card className="w-full max-w-md bg-[#202c33] border-[#3b4a54]">
      <CardContent className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2 text-[#e9edef]">
          Error al cargar el chat
        </h2>
        <p className="text-[#8696a0] mb-4">
          Ha ocurrido un error al cargar los datos del chat.
        </p>
        <Button
          className="bg-[#00a884] hover:bg-[#008f72] text-white"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </CardContent>
    </Card>
  </div>
  )
}

export default ErrorCard