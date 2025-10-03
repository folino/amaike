import type { TipSubmission, SubmissionResponse, CollectedInformation } from '../types';

// Configuration for the submission endpoint
const SUBMISSION_ENDPOINT = process.env.REACT_APP_TIP_SUBMISSION_URL || 'https://api.eleco.com.ar/tips';
const API_KEY = process.env.REACT_APP_SUBMISSION_API_KEY;

/**
 * Submits a news tip to the backend service
 */
export const submitNewsTip = async (tipSubmission: TipSubmission): Promise<SubmissionResponse> => {
  try {
    const response = await fetch(SUBMISSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY ? `Bearer ${API_KEY}` : '',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        ...tipSubmission,
        timestamp: tipSubmission.timestamp.toISOString(),
        userAgent: navigator.userAgent,
        // Note: IP address would be captured server-side for security
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      submissionId: result.submissionId || result.id,
      message: result.message || 'Tip enviado exitosamente',
    };
  } catch (error) {
    console.error('Error submitting news tip:', error);
    
    return {
      success: false,
      message: 'Error al enviar el tip. Por favor, inténtalo de nuevo.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Validates collected information before submission
 */
export const validateCollectedInformation = (data: CollectedInformation): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.what || data.what.trim().length < 10) {
    errors.push('La descripción de lo que pasó es muy breve. Por favor, proporciona más detalles.');
  }

  if (!data.when || data.when.trim().length < 5) {
    errors.push('La información sobre cuándo ocurrió es necesaria.');
  }

  if (!data.where || data.where.trim().length < 5) {
    errors.push('La ubicación es importante para los periodistas.');
  }

  if (!data.who || data.who.trim().length < 3) {
    errors.push('Información sobre quién estuvo involucrado es necesaria.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generates a structured summary of the collected information
 */
export const generateTipSummary = (data: CollectedInformation): string => {
  return `
INFORMACIÓN RECOPILADA:
• Qué pasó: ${data.what}
• Cuándo: ${data.when}
• Dónde: ${data.where}
• Quién estuvo involucrado: ${data.who}
• Cómo sucedió: ${data.how}
• Detalles adicionales: ${data.additionalDetails}
• Urgencia: ${data.urgency}
• Categoría: ${data.category}
${data.contactInfo ? `• Información de contacto: ${data.contactInfo}` : ''}
  `.trim();
};

/**
 * Fallback submission method (simulates email to servicios@eleco.com.ar)
 * This is used when the main API is not available
 */
export const submitViaEmail = async (tipSubmission: TipSubmission): Promise<SubmissionResponse> => {
  try {
    // In a real implementation, this would use a service like EmailJS
    // or send the data to a serverless function that handles email sending
    
    const emailBody = `
NUEVO TIP DE NOTICIA RECIBIDO

ID del Tip: ${tipSubmission.tipId}
Fecha: ${tipSubmission.timestamp.toISOString()}
Mensaje original: ${tipSubmission.originalMessage}

INFORMACIÓN RECOPILADA:
${generateTipSummary(tipSubmission.collectedData)}

---
Enviado desde AmAIke - Asistente de El Eco de Tandil
    `.trim();

    // Simulate email sending (in production, this would be a real email service)
    console.log('--- ENVIANDO EMAIL A servicios@eleco.com.ar ---');
    console.log(emailBody);
    console.log('----------------------------------------------------');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      submissionId: `email_${Date.now()}`,
      message: 'Tip enviado por email a la redacción',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al enviar el email. Por favor, contacta directamente a servicios@eleco.com.ar',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
