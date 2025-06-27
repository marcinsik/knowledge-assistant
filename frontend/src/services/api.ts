// Serwis API dla aplikacji Knowledge Assistant - obsługuje komunikację z backendem

// Interfejs reprezentujący element wiedzy (notatkę lub PDF)
export interface KnowledgeItem {
  id: number;
  title: string;
  text_content: string;
  original_filename?: string; // Nazwa oryginalnego pliku (dla PDF-ów)
  tags: string[];
  embedding?: number[]; // Wektory embeddings dla wyszukiwania semantycznego
  tags_embedding?: number[]; // Wektory embeddings dla tagów
  created_at: string;
  updated_at: string;
}

// Interfejs dla żądania utworzenia notatki tekstowej
export interface CreateTextItemRequest {
  title: string;
  content: string;
  tags?: string; // Tagi oddzielone przecinkami
}

// Interfejs dla żądania przesłania pliku PDF
export interface CreatePdfItemRequest {
  title: string;
  pdf_file: File;
  tags?: string; // Tagi oddzielone przecinkami
}

// Interfejs dla żądania edycji notatki
export interface UpdateTextItemRequest {
  title: string;
  content: string;
  tags?: string; // Tagi oddzielone przecinkami
}

// Adres URL backendu - pobierany ze zmiennej środowiskowej lub domyślny localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Klasa serwisu API obsługująca wszystkie zapytania HTTP do backendu
class ApiService {
  // Uniwersalna metoda do wykonywania zapytań HTTP z obsługą błędów
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url, options.method || 'GET');
    
    // Konfiguracja domyślna dla zapytań JSON
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('API Response:', response.status, response.statusText);
      
      // Sprawdzenie czy odpowiedź jest poprawna
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Pobierz JSON odpowiedzi
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Sprawdzenie stanu zdrowia backendu
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  // Pobieranie wszystkich elementów wiedzy z backendu
  async getKnowledgeItems(): Promise<KnowledgeItem[]> {
    return this.request('/api/knowledge_items');
  }

  // Przesyłanie nowej notatki tekstowej
  async uploadTextNote(data: CreateTextItemRequest): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.tags) {
      formData.append('tags', data.tags);
    }

    return this.request('/api/knowledge_items/upload_text', {
      method: 'POST',
      headers: {}, // Usunięcie Content-Type aby przeglądarka ustawiła go automatycznie dla FormData
      body: formData,
    });
  }

  // Przesyłanie pliku PDF
  async uploadPdfFile(data: CreatePdfItemRequest): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('pdf_file', data.pdf_file);
    if (data.tags) {
      formData.append('tags', data.tags);
    }

    return this.request('/api/knowledge_items/upload_pdf', {
      method: 'POST',
      headers: {}, // Usunięcie Content-Type aby przeglądarka ustawiła go automatycznie dla FormData
      body: formData,
    });
  }

  // Edycja istniejącej notatki tekstowej
  async updateTextItem(id: number, data: UpdateTextItemRequest): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.tags) {
      formData.append('tags', data.tags);
    }

    return this.request(`/api/knowledge_items/update_text/${id}`, {
      method: 'POST',
      headers: {}, // Usunięcie Content-Type aby przeglądarka ustawiła go automatycznie dla FormData
      body: formData,
    });
  }

  // Aktualizacja notatki tekstowej (nowy endpoint PUT)
  async updateKnowledgeItem(id: number, data: UpdateTextItemRequest): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.tags) {
      formData.append('tags', data.tags);
    }

    return this.request(`/api/knowledge_items/${id}`, {
      method: 'PUT',
      headers: {}, // Usunięcie Content-Type aby przeglądarka ustawiła go automatycznie dla FormData
      body: formData,
    });
  }

  // Wyszukiwanie elementów wiedzy (funkcja przygotowana na przyszłą implementację w backendzie)
  async searchKnowledgeItems(query: string): Promise<KnowledgeItem[]> {
    return this.request(`/api/knowledge_items/search?q=${encodeURIComponent(query)}`);
  }

  // Usuwanie elementu wiedzy po id
  async deleteKnowledgeItem(id: number): Promise<{ message: string }> {
    // Użyj GET, bo taki jest endpoint w backendzie (lepiej byłoby DELETE, ale trzymamy się backendu)
    return this.request(`/api/knowledge_items/delete/${id}`, { method: 'GET' });
  }

  // Wyszukiwanie semantyczne po embeddingach
  async semanticSearch(query: string, topK = 10): Promise<KnowledgeItem[]> {
    const params = new URLSearchParams({ 
      query, 
      top_k: topK.toString()
      // threshold używa domyślnej wartości z backendu (0.5)
    });
    const result = await this.request<KnowledgeItem[]>(`/api/knowledge_items/semantic_search?${params.toString()}`);
    return result;
  }
}

// Eksportowana instancja serwisu API gotowa do użycia w komponentach
export const apiService = new ApiService();
