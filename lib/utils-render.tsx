import { generateAvatar } from "./utils";

export const Avatar = ({ phone, username, size = "w-8 h-8" }: { phone?: string; username?: string; size?: string }) => {
    const avatar = generateAvatar(phone || "", username)
  
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
        style={{ backgroundColor: avatar.backgroundColor }}
      >
        {avatar.initials}
      </div>
    )
  }

  export const WhatsAppAvatar = ({ phone, name, size = "w-12 h-12" }: { phone?: string; name?: string; size?: string }) => {
    const avatar = generateAvatar(phone || "", name)
  
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0`}
        style={{ backgroundColor: avatar.backgroundColor }}
      >
        {avatar.initials}
      </div>
    )
  }