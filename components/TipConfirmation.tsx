import React from 'react';
import type { CollectedInformation } from '../types';

interface TipConfirmationProps {
  collectedData: CollectedInformation;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TipConfirmation: React.FC<TipConfirmationProps> = ({
  collectedData,
  onConfirm,
  onEdit,
  onCancel,
  isSubmitting = false,
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      accident: 'Accidente',
      crime: 'Crimen',
      politics: 'Política',
      community: 'Comunidad',
      business: 'Negocios',
      other: 'Otros',
    };
    return labels[category] || category;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-4">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Confirmar Información del Tip</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué pasó?</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.what}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuándo?</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.when}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Dónde?</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.where}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Quién estuvo involucrado?</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.who}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo sucedió?</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.how}</p>
        </div>

        {collectedData.additionalDetails && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalles adicionales</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.additionalDetails}</p>
          </div>
        )}

        {collectedData.contactInfo && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Información de contacto</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{collectedData.contactInfo}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <span className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
              {getCategoryLabel(collectedData.category)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia</label>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getUrgencyColor(collectedData.urgency)}`}>
              {collectedData.urgency === 'high' ? 'Alta' : collectedData.urgency === 'medium' ? 'Media' : 'Baja'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar a la Redacción'
          )}
        </button>
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Editar Información
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-red-200 text-red-800 px-4 py-2 rounded-md hover:bg-red-300 disabled:bg-red-100 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default TipConfirmation;

