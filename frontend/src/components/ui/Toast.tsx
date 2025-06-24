// System powiadomień toast dla aplikacji - wyświetla tymczasowe komunikaty
import { CheckCircle, X, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Interfejs dla właściwości pojedynczego toast
export interface ToastProps {
  id: string; // Unikalny identyfikator toast
  type: 'success' | 'error' | 'info'; // Typ powiadomienia
  message: string; // Treść wiadomości
  duration?: number; // Czas wyświetlania w ms (domyślnie 5000)
  onClose: (id: string) => void; // Funkcja zamykania toast
}

// Komponent pojedynczego powiadomienia toast
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  // Stan kontrolujący widoczność toast (dla animacji)
  const [isVisible, setIsVisible] = useState(false);

  // Animacja pojawiania się toast
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Automatyczne zamykanie toast po określonym czasie
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Obsługa zamykania toast z animacją
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Opóźnienie dla animacji znikania
  };

  // Funkcja zwracająca odpowiednią ikonę dla typu powiadomienia
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Funkcja zwracająca kolor tła dla typu powiadomienia
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Funkcja zwracająca kolor tekstu dla typu powiadomienia
  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full border rounded-lg p-4 shadow-lg
        ${getBackgroundColor()}
      `}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        {/* Przycisk zamykania toast */}
        <button
          onClick={handleClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Interfejs dla kontenera toast
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

// Kontener dla wszystkich powiadomień toast (pozycjonowany w prawym górnym rogu)
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Hook do zarządzania powiadomieniami toast
export const useToast = () => {
  // Stan przechowujący listę aktywnych toast
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Funkcja dodawania nowego toast
  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  // Funkcja usuwania toast
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Funkcja wyświetlania powiadomienia o sukcesie
  const showSuccess = (message: string, duration?: number) => {
    addToast({ type: 'success', message, duration });
  };

  // Funkcja wyświetlania powiadomienia o błędzie
  const showError = (message: string, duration?: number) => {
    addToast({ type: 'error', message, duration });
  };

  // Funkcja wyświetlania powiadomienia informacyjnego
  const showInfo = (message: string, duration?: number) => {
    addToast({ type: 'info', message, duration });
  };

  // Zwrócenie funkcji i stanu do użycia w komponentach
  return {
    toasts,
    showSuccess,
    showError,
    showInfo,
    removeToast,
  };
};
