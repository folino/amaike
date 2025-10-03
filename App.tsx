import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';
import { getAmAIkeResponse } from './services/geminiService';
import type { ChatMessage as ChatMessageType } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Soy AmAIke, el asistente de noticias de El Eco de Tandil. Estoy aquí para ayudarte a encontrar información en nuestro sitio. ¿Sobre qué te gustaría consultar?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (userMessage: string) => {
    const newUserMessage: ChatMessageType = {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
    };

    const messagesWithUserReply = [...messages, newUserMessage];
    setMessages(messagesWithUserReply);
    setIsLoading(true);

    try {
      const { text, sources } = await getAmAIkeResponse(messagesWithUserReply);

      let finalAiText = text;
      
      if (text.startsWith('[INFO_RECIBIDA]')) {
        const userTipMessage = messagesWithUserReply.filter(m => m.sender === 'user').pop();
        if (userTipMessage) {
            console.log('--- SIMULATING EMAIL TO servicios@eleco.com.ar ---');
            console.log(`User provided tip: "${userTipMessage.text}"`);
            console.log('----------------------------------------------------');
        }
        finalAiText = text.replace('[INFO_RECIBIDA]', '').trim();
      }

      const aiResponse: ChatMessageType = {
        id: Date.now() + 1,
        sender: 'ai',
        text: finalAiText,
        sources: sources,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      const errorResponse: ChatMessageType = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Hubo un problema al conectar con el servicio. Por favor, inténtalo de nuevo.',
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh font-sans">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
               <div className="max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md bg-white text-gray-800 border border-gray-200">
                <LoadingIndicator />
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;