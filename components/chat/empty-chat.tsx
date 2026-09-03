import { Users } from "lucide-react"

const EmptyChat = () => {
  return (
    <div className="text-center text-[#8696a0] py-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#202c33] flex items-center justify-center">
      <Users className="h-8 w-8 opacity-50" />
    </div>
    <p className="text-sm">No hay mensajes aún</p>
    <p className="text-xs opacity-70">¡Sé el primero en escribir!</p>
  </div>
  )
}

export default EmptyChat