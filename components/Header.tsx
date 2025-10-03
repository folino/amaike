import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-eleco-dark-blue p-4 text-white shadow-md text-center">
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