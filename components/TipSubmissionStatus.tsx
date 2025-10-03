import React from 'react';
import type { SubmissionResponse } from '../types';

interface TipSubmissionStatusProps {
  response: SubmissionResponse;
  onClose: () => void;
}

const TipSubmissionStatus: React.FC<TipSubmissionStatusProps> = ({ response, onClose }) => {
  const isSuccess = response.success;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-4">
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
          isSuccess ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isSuccess ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h3 className={`text-lg font-semibold ${
          isSuccess ? 'text-green-900' : 'text-red-900'
        }`}>
          {isSuccess ? 'Tip Enviado Exitosamente' : 'Error al Enviar el Tip'}
        </h3>
      </div>

      <div className={`p-4 rounded-md mb-4 ${
        isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <p className={`text-sm ${
          isSuccess ? 'text-green-800' : 'text-red-800'
        }`}>
          {response.message}
        </p>
        
        {response.submissionId && (
          <p className="text-xs text-gray-600 mt-2">
            ID de envío: {response.submissionId}
          </p>
        )}
        
        {response.error && (
          <p className="text-xs text-red-600 mt-2">
            Error: {response.error}
          </p>
        )}
      </div>

      {isSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">¿Qué sigue?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Nuestro equipo editorial revisará la información</li>
            <li>• Si es relevante, podríamos contactarte para más detalles</li>
            <li>• La información podría aparecer en futuras publicaciones</li>
            <li>• Agradecemos tu colaboración con El Eco de Tandil</li>
          </ul>
        </div>
      )}

      {!isSuccess && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <h4 className="font-medium text-yellow-900 mb-2">Alternativas</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Puedes intentar enviar la información nuevamente</li>
            <li>• Contacta directamente a servicios@eleco.com.ar</li>
            <li>• Llama a la redacción al (0249) 442-0000</li>
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TipSubmissionStatus;
