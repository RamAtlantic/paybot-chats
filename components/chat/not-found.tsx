
import React from 'react'
import { Card } from '../ui/card'
import { CardContent } from '../ui/card'
import { Button } from '../ui/button'
import Link from 'next/link'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#202c33] border-[#3b4a54]">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2 text-[#e9edef]">
              Chat no encontrado
            </h2>
            <p className="text-[#8696a0] mb-4">
              El chat que buscas no existe o ha sido eliminado.
            </p>
            <Link href="/">
              <Button className="bg-[#00a884] hover:bg-[#008f72] text-white">
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>    
  )
}

export default NotFound