// Komponenty do wyświetlania stanów ładowania w aplikacji
import React from 'react';

// Interfejs dla właściwości komponentu LoadingSpinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // Rozmiar spinnera
  className?: string; // Dodatkowe klasy CSS
}

// Komponent animowanego spinnera ładowania
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  // Mapowanie rozmiarów na klasy CSS
  const sizeClasses = {
    sm: 'w-4 h-4',   // Mały spinner (16x16px)
    md: 'w-6 h-6',   // Średni spinner (24x24px)
    lg: 'w-8 h-8'    // Duży spinner (32x32px)
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Interfejs dla właściwości komponentu LoadingState
interface LoadingStateProps {
  message?: string; // Opcjonalna wiadomość wyświetlana pod spinnerem
}

// Komponent pełnego stanu ładowania z spinnerem i wiadomością
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};
