import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';
import TipConfirmation from './components/TipConfirmation';
import TipSubmissionStatus from './components/TipSubmissionStatus';
import { getAmAIkeResponse } from './services/geminiService';
import { submitNewsTip, submitViaEmail, validateCollectedInformation } from './services/tipSubmissionService';
import type { ChatMessage as ChatMessageType, NewsTip, CollectedInformation, SubmissionResponse } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Soy AmAIke, el asistente de noticias de El Eco de Tandil. Estoy aquí para ayudarte a encontrar información en nuestro sitio. ¿Sobre qué te gustaría consultar?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState<NewsTip | null>(null);
  const [showTipConfirmation, setShowTipConfirmation] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<SubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        // Extract structured data from the conversation
        const collectedData = extractCollectedDataFromConversation(messagesWithUserReply);
        
        if (collectedData) {
          const tipId = `tip_${Date.now()}`;
          const newsTip: NewsTip = {
            id: tipId,
            timestamp: new Date(),
            userMessage: userMessage,
            collectedData,
            status: 'ready_to_submit',
          };
          
          setCurrentTip(newsTip);
          setShowTipConfirmation(true);
        }
        
        finalAiText = text.replace('[INFO_RECIBIDA]', '').trim();
      } else if (shouldOfferTipCollection(text, sources)) {
        // When no useful information is found, prepare for potential tip collection
        console.log('No useful information found - ready for potential tip collection');
        console.log('Sources found:', sources.length);
        console.log('Text contains no-info indicators:', text);
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

  const shouldOfferTipCollection = (text: string, sources: any[]): boolean => {
    // Check if no sources were found
    if (sources.length === 0) {
      return true;
    }

    // Check if AI explicitly indicates no information was found
    const noInfoIndicators = [
      'No he encontrado información específica',
      'no hay link',
      'no encontré',
      'no se encontró',
      'no hay información',
      'no hay datos',
      'no hay artículos',
      'no hay noticias',
      'no hay contenido',
      'no hay resultados',
      'no hay fuentes',
      'no hay enlaces',
      'no hay referencias',
      'no se pudo encontrar',
      'no se encontraron',
      'no hay nada',
      'no hay evidencia',
      'no hay registro'
    ];

    const textLower = text.toLowerCase();
    const hasNoInfoIndicator = noInfoIndicators.some(indicator => textLower.includes(indicator.toLowerCase()));
    
    // Also check if the response is very short and doesn't contain useful information
    const isShortResponse = text.length < 100;
    const hasNoLinks = !text.includes('https://www.eleco.com.ar');
    const hasNoCitations = !text.includes('Puedes leer más en:');
    
    // If it's a short response with no links or citations, it's likely not useful
    const isLikelyNotUseful = isShortResponse && hasNoLinks && hasNoCitations;
    
    return hasNoInfoIndicator || isLikelyNotUseful;
  };

  const extractCollectedDataFromConversation = (messages: ChatMessageType[]): CollectedInformation | null => {
    // Extract all user messages from the conversation
    const userMessages = messages.filter(m => m.sender === 'user');
    const aiMessages = messages.filter(m => m.sender === 'ai');
    
    if (userMessages.length === 0) return null;

    // Find the conversation context where tip collection started
    // Look for the pattern where AI asks for more details
    const tipCollectionStart = aiMessages.findIndex(msg => 
      msg.text.includes('¿podrías contarme un poco más?') || 
      msg.text.includes('¿qué fue exactamente lo que pasó?')
    );

    if (tipCollectionStart === -1) {
      // If no structured collection found, use the last user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      return {
        what: lastUserMessage.text,
        when: 'Información no especificada',
        where: 'Tandil',
        who: 'Información no especificada',
        how: 'Información no especificada',
        additionalDetails: '',
        urgency: 'medium' as const,
        category: 'other' as const,
      };
    }

    // Extract information from the conversation after tip collection started
    const relevantUserMessages = userMessages.slice(tipCollectionStart);
    const allUserText = relevantUserMessages.map(msg => msg.text).join(' ');

    // Basic extraction - in a real implementation, you'd use more sophisticated NLP
    const extractField = (pattern: RegExp, fallback: string): string => {
      const match = allUserText.match(pattern);
      return match ? match[1] || match[0] : fallback;
    };

    // Determine category based on keywords
    const categoryKeywords = {
      accident: ['accidente', 'choque', 'colisión', 'atropello'],
      crime: ['robo', 'asalto', 'delito', 'crimen'],
      politics: ['municipio', 'intendente', 'concejal', 'elección'],
      community: ['barrio', 'vecino', 'comunidad', 'evento'],
      business: ['comercio', 'negocio', 'empresa', 'local'],
    };

    let detectedCategory: 'accident' | 'crime' | 'politics' | 'community' | 'business' | 'other' = 'other';
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => allUserText.toLowerCase().includes(keyword))) {
        detectedCategory = category as 'accident' | 'crime' | 'politics' | 'community' | 'business';
        break;
      }
    }

    // Determine urgency based on keywords
    const urgencyKeywords = {
      high: ['urgente', 'emergencia', 'inmediato', 'ahora'],
      medium: ['reciente', 'ayer', 'hoy', 'esta semana'],
    };

    let detectedUrgency: 'low' | 'medium' | 'high' = 'low';
    for (const [urgency, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => allUserText.toLowerCase().includes(keyword))) {
        detectedUrgency = urgency as 'low' | 'medium' | 'high';
        break;
      }
    }

    return {
      what: extractField(/(?:qué|que)\s+(.+?)(?:\s+cuándo|\s+dónde|\s+quién|$)/i, allUserText.split('.')[0] || 'Información no especificada'),
      when: extractField(/(?:cuándo|cuando)\s+(.+?)(?:\s+dónde|\s+quién|\s+cómo|$)/i, 'Información no especificada'),
      where: extractField(/(?:dónde|donde)\s+(.+?)(?:\s+quién|\s+cómo|$)/i, 'Tandil'),
      who: extractField(/(?:quién|quien)\s+(.+?)(?:\s+cómo|$)/i, 'Información no especificada'),
      how: extractField(/(?:cómo|como)\s+(.+?)$/i, 'Información no especificada'),
      additionalDetails: allUserText,
      urgency: detectedUrgency,
      category: detectedCategory,
    };
  };

  const handleTipConfirmation = async () => {
    if (!currentTip) return;

    setIsSubmitting(true);
    
    try {
      // Validate the collected data
      const validation = validateCollectedInformation(currentTip.collectedData);
      
      if (!validation.isValid) {
        setSubmissionResponse({
          success: false,
          message: 'La información recopilada no es completa. Por favor, proporciona más detalles.',
          error: validation.errors.join(', '),
        });
        return;
      }

      // Try to submit via API first, fallback to email
      let response: SubmissionResponse;
      
      try {
        response = await submitNewsTip({
          tipId: currentTip.id,
          collectedData: currentTip.collectedData,
          originalMessage: currentTip.userMessage,
          timestamp: currentTip.timestamp,
        });
      } catch (error) {
        // Fallback to email submission
        response = await submitViaEmail({
          tipId: currentTip.id,
          collectedData: currentTip.collectedData,
          originalMessage: currentTip.userMessage,
          timestamp: currentTip.timestamp,
        });
      }

      setSubmissionResponse(response);
      setCurrentTip({ ...currentTip, status: response.success ? 'submitted' : 'failed' });
      setShowTipConfirmation(false);
      
    } catch (error) {
      setSubmissionResponse({
        success: false,
        message: 'Error inesperado al enviar el tip. Por favor, inténtalo de nuevo.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTipEdit = () => {
    setShowTipConfirmation(false);
    // In a real implementation, you might want to allow editing the collected data
    // For now, we'll just close the confirmation and let the user continue the conversation
  };

  const handleTipCancel = () => {
    setShowTipConfirmation(false);
    setCurrentTip(null);
  };

  const handleSubmissionStatusClose = () => {
    setSubmissionResponse(null);
    setCurrentTip(null);
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
          
          {/* Tip Confirmation Modal */}
          {showTipConfirmation && currentTip && (
            <TipConfirmation
              collectedData={currentTip.collectedData}
              onConfirm={handleTipConfirmation}
              onEdit={handleTipEdit}
              onCancel={handleTipCancel}
              isSubmitting={isSubmitting}
            />
          )}
          
          {/* Submission Status Modal */}
          {submissionResponse && (
            <TipSubmissionStatus
              response={submissionResponse}
              onClose={handleSubmissionStatusClose}
            />
          )}
          
          <div ref={chatEndRef} />
        </div>
      </main>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;