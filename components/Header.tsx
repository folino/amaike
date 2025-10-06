import React from 'react';

// Get version and build info from environment variables injected at build time
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';
const BUILD_ID = import.meta.env.VITE_BUILD_ID || 'dev';
const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0];

const Header: React.FC = () => {
  return (
    <header className="w-full bg-eleco-dark-blue p-4 text-white shadow-md relative">
      {/* Version info in top right corner */}
      <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">
        <div className="text-right">
          <div>v{APP_VERSION}</div>
          <div className="text-[10px] opacity-75">{BUILD_ID}</div>
        </div>
      </div>
      
      {/* Main header content */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-4xl" role="img" aria-label="Piedra Movediza de Tandil">
          🗿
        </span>
        <div>
          <h1 className="text-2xl font-bold font-oswald text-white">AmAIke</h1>
          <p className="text-sm text-gray-300">Asistente Virtual de El Eco de Tandil</p>
        </div>
      </div>
    </header>
  );
};

export default Header;