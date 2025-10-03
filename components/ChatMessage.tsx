import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '../types';
import SourceLink from './SourceLink';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const messageContainerClasses = isUser ? 'flex justify-end' : 'flex justify-start';
  const messageBubbleClasses = isUser 
    ? 'bg-eleco-blue text-white' 
    : 'bg-white text-gray-800 border border-gray-200';

  const linkClass = isUser ? 'text-blue-200 hover:text-white underline' : 'text-eleco-blue hover:text-eleco-blue-hover underline';

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
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-300/50">
            <p className="text-xs font-semibold mb-2">{isUser ? '' : 'Puedes leer más en:'}</p>
            <div className="flex flex-col gap-1">
              {message.sources.map((source, index) => (
                <SourceLink key={index} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;