
import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center bg-gray-100 rounded-full p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta aquí..."
          className="flex-grow bg-transparent px-4 py-2 text-gray-800 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-eleco-blue text-white rounded-full p-2 hover:bg-eleco-blue-hover disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={isLoading || !input.trim()}
          aria-label="Enviar mensaje"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ChatInput;