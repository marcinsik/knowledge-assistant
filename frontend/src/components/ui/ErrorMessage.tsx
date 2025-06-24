// Komponenty do wyświetlania komunikatów o błędach w aplikacji
import { AlertCircle, X } from 'lucide-react';
import React from 'react';

// Interfejs dla właściwości komponentu ErrorMessage
interface ErrorMessageProps {
  message: string; // Treść komunikatu o błędzie
  onDismiss?: () => void; // Opcjonalna funkcja zamykania komunikatu
  className?: string; // Dodatkowe klasy CSS
}

// Komponent inline komunikatu o błędzie (np. w formularzu)
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss,
  className = '' 
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        {/* Ikona ostrzeżenia */}
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 text-sm">{message}</p>
        </div>
        {/* Opcjonalny przycisk zamykania */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Interfejs dla właściwości komponentu ErrorState
interface ErrorStateProps {
  message: string; // Treść komunikatu o błędzie
  onRetry?: () => void; // Opcjonalna funkcja ponowienia akcji
}

// Komponent pełnego stanu błędu (np. gdy nie można załadować danych)
export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message, 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Duża ikona błędu */}
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 text-center mb-4 max-w-md">{message}</p>
      {/* Opcjonalny przycisk ponowienia */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
