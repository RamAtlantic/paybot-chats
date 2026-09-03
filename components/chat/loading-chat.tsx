import React from "react";

const LoadingChat = () => {
  return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884] mx-auto mb-4"></div>
        <p className="text-[#8696a0]">Cargando chat...</p>
      </div>
    </div>
  );
};

export default LoadingChat;
