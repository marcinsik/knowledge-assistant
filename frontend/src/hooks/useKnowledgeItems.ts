// Hook React do zarządzania stanem elementów wiedzy w aplikacji
import { useCallback, useEffect, useState } from 'react';
import { apiService, CreatePdfItemRequest, CreateTextItemRequest, KnowledgeItem } from '../services/api';

// Interfejs definiujący wartości zwracane przez hook
export interface UseKnowledgeItemsReturn {
  items: KnowledgeItem[]; // Lista wszystkich elementów wiedzy
  loading: boolean; // Stan ładowania danych
  error: string | null; // Komunikat błędu (jeśli wystąpił)
  refreshItems: () => Promise<void>; // Funkcja odświeżania listy elementów
  addTextItem: (data: CreateTextItemRequest) => Promise<KnowledgeItem>; // Dodawanie notatki tekstowej
  addPdfItem: (data: CreatePdfItemRequest) => Promise<KnowledgeItem>; // Dodawanie pliku PDF
  deleteItem: (id: number) => void; // Usuwanie elementu (tylko lokalnie)
}

// Główny hook do zarządzania elementami wiedzy
export const useKnowledgeItems = (): UseKnowledgeItemsReturn => {
  // Stan lokalny dla listy elementów wiedzy
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  // Stan ładowania - true podczas pobierania danych z API
  const [loading, setLoading] = useState(true);
  // Stan błędu - przechowuje komunikat o błędzie jeśli wystąpił
  const [error, setError] = useState<string | null>(null);

  // Funkcja odświeżania listy elementów z backendu
  const refreshItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedItems = await apiService.getKnowledgeItems();
      setItems(fetchedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      console.error('Failed to fetch knowledge items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Funkcja dodawania nowej notatki tekstowej
  const addTextItem = useCallback(async (data: CreateTextItemRequest): Promise<KnowledgeItem> => {
    try {
      setError(null);
      const newItem = await apiService.uploadTextNote(data);
      // Dodanie nowego elementu na początek listy (najnowsze na górze)
      setItems(prevItems => [newItem, ...prevItems]);
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add text item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Funkcja dodawania nowego pliku PDF
  const addPdfItem = useCallback(async (data: CreatePdfItemRequest): Promise<KnowledgeItem> => {
    try {
      setError(null);
      const newItem = await apiService.uploadPdfFile(data);
      // Dodanie nowego elementu na początek listy (najnowsze na górze)
      setItems(prevItems => [newItem, ...prevItems]);
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add PDF item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Funkcja usuwania elementu z lokalnej listy (bez wywołania API)
  const deleteItem = useCallback((id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // Automatyczne pobranie elementów przy pierwszym renderowaniu komponentu
  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // Zwrócenie wszystkich funkcji i stanów do użycia w komponentach
  return {
    items,
    loading,
    error,
    refreshItems,
    addTextItem,
    addPdfItem,
    deleteItem,
  };
};
