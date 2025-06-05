import React, { useEffect, useState } from 'react';
import './App.css'; // Nadal importujemy nasz plik CSS

// Definicja typu dla KnowledgeItem, musi być zgodna z tym, co zwraca backend
interface KnowledgeItem {
  id: number;
  title: string;
  text_content: string;
  original_filename: string | null;
  tags: string[];
  embedding: number[];
  created_at: string;
  updated_at: string;
}

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Ładowanie...');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteTags, setNewNoteTags] = useState<string>('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [pdfTags, setPdfTags] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);

  // Funkcja do pobierania wszystkich notatek
  const fetchKnowledgeItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/knowledge_items');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data: KnowledgeItem[] = await response.json();
      setKnowledgeItems(data);
    } catch (err: any) {
      console.error("Błąd pobierania notatek:", err);
      setError(`Błąd pobierania notatek: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Efekt Użycia (useEffect) uruchamiany raz po załadowaniu komponentu
  useEffect(() => {
    // Sprawdzenie statusu backendu
    fetch('/health')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setBackendStatus(data.message))
      .catch(err => {
        console.error("Błąd połączenia z backendem:", err);
        setBackendStatus('Błąd: Nie można połączyć się z backendem.');
        setError(`Błąd połączenia z backendem: ${err.message}`);
      });

    fetchKnowledgeItems(); // Pobierz notatki przy starcie
  }, []);

  // Funkcja do dodawania notatki tekstowej
  const handleAddTextNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('title', newNoteTitle);
      params.append('content', newNoteContent);
      if (newNoteTags) {
        params.append('tags', newNoteTags);
      }

      const response = await fetch(`/api/knowledge_items/upload_text?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Detail: ${JSON.stringify(errorData.detail)}`);
      }

      // Resetuj formularz i odśwież notatki
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteTags('');
      await fetchKnowledgeItems(); // Odśwież listę
    } catch (err: any) {
      console.error("Błąd dodawania notatki tekstowej:", err);
      setError(`Błąd dodawania notatki: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do dodawania pliku PDF
  const handleAddPdfNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!selectedPdfFile) {
      setError('Proszę wybrać plik PDF.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', pdfTitle);
      formData.append('pdf_file', selectedPdfFile);
      if (pdfTags) {
        formData.append('tags', pdfTags);
      }

      const response = await fetch('/api/knowledge_items/upload_pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Detail: ${JSON.stringify(errorData.detail)}`);
      }

      // Resetuj formularz i odśwież notatki
      setPdfTitle('');
      setSelectedPdfFile(null);
      setPdfTags('');
      await fetchKnowledgeItems(); // Odśwież listę
    } catch (err: any) {
      console.error("Błąd dodawania PDF:", err);
      setError(`Błąd dodawania PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do wyszukiwania semantycznego
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearchResults([]); // Wyczyść poprzednie wyniki
    try {
      const params = new URLSearchParams({ query: searchQuery });
      const response = await fetch(`/api/knowledge_items/search_semantic?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Detail: ${JSON.stringify(errorData.detail)}`);
      }
      const data: KnowledgeItem[] = await response.json();
      setSearchResults(data);
    } catch (err: any) {
      console.error("Błąd wyszukiwania semantycznego:", err);
      setError(`Błąd wyszukiwania: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Knowledge Assistant</h1>
      <p className="status-message">Status Backendu: {backendStatus}</p>

      {error && <p className="status-message error">{error}</p>}
      {loading && <p className="status-message loading">Ładowanie...</p>}

      <hr />

      <h2>Dodaj nową notatkę tekstową</h2>
      <form onSubmit={handleAddTextNote}>
        <div>
          <label htmlFor="noteTitle">Tytuł:</label>
          <input
            type="text"
            id="noteTitle"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="noteContent">Treść:</label>
          <textarea
            id="noteContent"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="noteTags">Tagi (rozdzielone przecinkami):</label>
          <input
            type="text"
            id="noteTags"
            value={newNoteTags}
            onChange={(e) => setNewNoteTags(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>Dodaj notatkę</button>
      </form>

      <hr />

      <h2>Dodaj plik PDF</h2>
      <form onSubmit={handleAddPdfNote}>
        <div>
          <label htmlFor="pdfTitle">Tytuł PDF:</label>
          <input
            type="text"
            id="pdfTitle"
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="pdfFile">Wybierz plik PDF:</label>
          <input
            type="file"
            id="pdfFile"
            accept=".pdf"
            onChange={(e) => setSelectedPdfFile(e.target.files ? e.target.files[0] : null)}
            required
          />
        </div>
        <div>
          <label htmlFor="pdfTags">Tagi PDF (rozdzielone przecinkami):</label>
          <input
            type="text"
            id="pdfTags"
            value={pdfTags}
            onChange={(e) => setPdfTags(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>Dodaj PDF</button>
      </form>

      <hr />
      
      <h2>Wyszukiwanie Semantyczne</h2>
      <form onSubmit={handleSearch}>
        <div>
          <label htmlFor="searchQuery">Wyszukaj notatki:</label>
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>Szukaj</button>
      </form>

      <h3>Wyniki Wyszukiwania:</h3>
      {searchResults.length === 0 && searchQuery && !loading && !error ? (
        <p>Brak wyników dla Twojego zapytania.</p>
      ) : (
        <ul>
          {searchResults.map(item => (
            <li key={`search-${item.id}`}>
              <strong>{item.title}</strong> (ID: {item.id})<br />
              {item.text_content.length > 200 ? item.text_content.substring(0, 200) + '...' : item.text_content}
              <br />
              <small>Tagi: {item.tags.join(', ')}</small>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Twoje notatki:</h2>
      {knowledgeItems.length === 0 && !loading && !error ? (
        <p>Brak notatek w bazie danych. Dodaj jakąś!</p>
      ) : (
        <ul>
          {knowledgeItems.map(item => (
            <li key={item.id}>
              <strong>{item.title}</strong> (ID: {item.id})<br />
              {item.text_content.length > 200 ? item.text_content.substring(0, 200) + '...' : item.text_content}
              <br />
              <small>Tagi: {item.tags.join(', ')}</small>
              <br />
              <small>Utworzono: {new Date(item.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;