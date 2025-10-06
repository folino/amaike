import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';
import TipConfirmation from './components/TipConfirmation';
import TipSubmissionStatus from './components/TipSubmissionStatus';
import { getAmAIkeResponse } from './services/geminiService';
import { submitNewsTip, submitViaEmail, validateCollectedInformation } from './services/tipSubmissionService';
import { logUsage, incrementQueryCount } from './services/usageLogger';
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
    const interactionStartTime = Date.now();
    console.log('\n🎯 === NEW USER INTERACTION STARTED ===');
    console.log('📝 User message:', userMessage);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const newUserMessage: ChatMessageType = {
      id: Date.now(),
      sender: 'user',
      text: userMessage,
    };

    const messagesWithUserReply = [...messages, newUserMessage];
    setMessages(messagesWithUserReply);
    setIsLoading(true);
    console.log('🔄 Loading state set to true, calling AI service...');

    try {
      const aiServiceStartTime = Date.now();
      const { text, sources } = await getAmAIkeResponse(messagesWithUserReply);
      const aiServiceTime = Date.now() - aiServiceStartTime;
      console.log(`🤖 AI service completed in ${aiServiceTime}ms`);
      console.log(`📊 Response stats: ${text.length} characters, ${sources.length} sources`);

      // Log usage for testing
      incrementQueryCount();
      const hasCallToAction = text.includes('¿Me querés contar más?');
      console.log('📈 Logging usage - has call to action:', hasCallToAction);
      await logUsage(userMessage, text.length, sources.length, hasCallToAction);

      let finalAiText = text;
      let finalSources = sources;
      
      // Check for response duplication and clean it up
      const lines = finalAiText.split('\n');
      const uniqueLines = [];
      const seenLines = new Set();
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !seenLines.has(trimmedLine)) {
          uniqueLines.push(line);
          seenLines.add(trimmedLine);
        } else if (!trimmedLine) {
          // Keep empty lines for formatting
          uniqueLines.push(line);
        }
      }
      
      finalAiText = uniqueLines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive line breaks
      console.log('🧹 Response cleaned for duplication');
      
      // Check if we're in tip collection mode
      const isTipCollectionOngoing = detectTipCollectionProcess(messagesWithUserReply);
      
      if (isTipCollectionOngoing) {
        console.log('📋 Tip collection process detected - hiding sources to focus on information gathering');
        finalSources = []; // Hide sources during tip collection
      }
      
      if (text.startsWith('[INFO_RECIBIDA]')) {
        console.log('📋 Tip collection detected - extracting structured data...');
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
          
          console.log('✅ Tip data structured successfully:', tipId);
          setCurrentTip(newsTip);
          setShowTipConfirmation(true);
        } else {
          console.log('⚠️ Failed to extract tip data from conversation');
        }
        
        finalAiText = text.replace('[INFO_RECIBIDA]', '').trim();
        finalSources = []; // Never show sources when tip is collected
      }
      console.log("Final AI text:", finalAiText);
      const aiResponse: ChatMessageType = {
        id: Date.now() + 1,
        sender: 'ai',
        text: finalAiText,
        sources: finalSources, // Use finalSources instead of sources
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      
      const totalInteractionTime = Date.now() - interactionStartTime;
      console.log(`🏁 === INTERACTION COMPLETED in ${totalInteractionTime}ms ===`);
      console.log(`📊 Performance breakdown:`);
      console.log(`   - AI Service: ${aiServiceTime}ms (${Math.round(aiServiceTime/totalInteractionTime*100)}%)`);
      console.log(`   - UI Updates: ${totalInteractionTime - aiServiceTime}ms (${Math.round((totalInteractionTime-aiServiceTime)/totalInteractionTime*100)}%)`);
      console.log('\n');
    } catch (error) {
      const errorTime = Date.now() - interactionStartTime;
      console.error(`❌ === INTERACTION FAILED after ${errorTime}ms ===`);
      console.error('Error details:', error);
      
      const errorResponse: ChatMessageType = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Hubo un problema al conectar con el servicio. Por favor, inténtalo de nuevo.',
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      console.log('🔄 Setting loading state to false');
      setIsLoading(false);
    }
  };

  const detectTipCollectionProcess = (messages: ChatMessageType[]): boolean => {
    // Check if we're in the middle of a tip collection conversation
    const aiMessages = messages.filter(m => m.sender === 'ai');
    const recentAiMessages = aiMessages.slice(-3); // Check last 3 AI messages
    
    // Look for tip collection indicators in recent AI messages
    const tipCollectionIndicators = [
      '¿podrías contarme un poco más?',
      '¿qué fue exactamente lo que pasó?',
      '¿cuándo ocurrió?',
      '¿dónde exactamente?',
      '¿quién estuvo involucrado?',
      '¿cómo sucedió?',
      'Para poder entender mejor',
      'Muchas gracias por tu aporte',
      'Es muy valioso para nosotros',
      'para recopilar información',
      '¿hay testigos?',
      '¿qué daños hubo?',
      '¿es algo urgente?'
    ];
    
    const isTipCollection = recentAiMessages.some(msg => 
      tipCollectionIndicators.some(indicator => 
        msg.text.toLowerCase().includes(indicator.toLowerCase())
      )
    );
    
    if (isTipCollection) {
      console.log('🔍 Tip collection process detected in conversation history');
    }
    
    return isTipCollection;
  };

  const shouldOfferTipCollection = (text: string, sources: any[]): boolean => {
    // Always return true since we want to encourage tip collection in all cases
    // The AI should handle this with the new system prompt, but this serves as backup
    
    // Check if the response already contains tip collection call-to-action
    const hasTipCallToAction = text.includes('¿Sabés algo más sobre este tema?') || 
                              text.includes('¿Me querés contar más?');
    
    if (hasTipCallToAction) {
      console.log('✅ Response already includes tip collection call-to-action');
      return false; // Don't need to add it again
    }
    
    // If no call-to-action is present, we should offer tip collection
    console.log('⚠️ No tip collection call-to-action found in response');
    return true;
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

  const handleStartTipCollection = () => {
    // Add a message to start the tip collection flow
    const tipCollectionMessage: ChatMessageType = {
      id: Date.now(),
      sender: 'user',
      text: 'Quiero compartir información sobre este tema'
    };
    
    setMessages(prev => [...prev, tipCollectionMessage]);
    setIsLoading(true);
    
    // The AI will respond with the tip collection flow
    handleSendMessage('Quiero compartir información sobre este tema');
  };

  return (
    <div className="flex flex-col h-dvh font-sans">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              onStartTipCollection={handleStartTipCollection}
            />
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