import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../types';
import SourceLink from './SourceLink';

interface ChatMessageProps {
  message: ChatMessageType;
  onStartTipCollection?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onStartTipCollection }) => {
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const isUser = message.sender === 'user';
  
  const messageContainerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const messageBubbleClasses = isUser 
    ? 'bg-eleco-blue text-white' 
    : 'bg-white text-gray-800 border border-gray-200';

  const linkClass = isUser ? 'text-blue-200 hover:text-white underline' : 'text-eleco-blue hover:text-eleco-blue-hover underline';

  // Check if message contains the call-to-action
  const hasCallToAction = !isUser && message.text.includes('¿Me querés contar más?');

  return (
    <div className={`w-full flex ${messageContainerClasses} mb-4`}>
      <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${messageBubbleClasses}`}>
        <div className="prose prose-sm max-w-none text-inherit">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({node, ...props}) => <p className="my-0" {...props} />,
              a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" className={linkClass} {...props} />
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {/* Call-to-Action Box */}
        {hasCallToAction && (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-eleco-blue to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">¿Me querés contar más?</h3>
                  <p className="text-sm text-blue-100">Ayudame a encontrar información más precisa</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 mb-3">
                <p className="text-sm mb-2">Si tenés más detalles sobre este tema o te referís a otro período, por favor, házmelo saber para poder intentar una búsqueda más precisa.</p>
                <p className="text-sm">También podés compartir información que te gustaría que nuestra redacción conozca.</p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={onStartTipCollection}
                  className="bg-white text-eleco-blue font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>📝</span>
                  Contar más detalles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sources Box */}
        {message.sources && message.sources.length > 0 && !isUser && (
          <div className="mt-4 pt-3 border-t border-gray-300/50">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Puedes leer más en:</p>
                {message.sources.length > 3 && (
                  <button
                    onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                    className="text-xs text-eleco-blue hover:text-eleco-blue-hover font-medium"
                  >
                    {isSourcesExpanded ? 'Ver menos' : `Ver todas (${message.sources.length})`}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {(isSourcesExpanded ? message.sources : message.sources.slice(0, 3)).map((source, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-eleco-blue rounded-full mt-2 flex-shrink-0"></div>
                    <a
                      href={source.web?.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-eleco-blue hover:text-eleco-blue-hover hover:underline"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {source.web?.title || 'Artículo de El Eco'}
                    </a>
                  </div>
                ))}
                {message.sources.length > 3 && !isSourcesExpanded && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{message.sources.length - 3} artículos más
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;