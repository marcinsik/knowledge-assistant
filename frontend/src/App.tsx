import { AlertCircle, FileText, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AddItemForm from './components/ui/AddItemForm';
import EditItemForm from './components/ui/EditItemForm';
import FilterSidebar from './components/ui/FilterSidebar';
import Header from './components/ui/Header';
import KnowledgeItemCard from './components/ui/KnowledgeItemCard';
import KnowledgeItemDetail from './components/ui/KnowledgeItemDetail';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import Sidebar from './components/ui/Sidebar';
import SimpleToast, { ToastType } from './components/ui/SimpleToast';
import { apiService, KnowledgeItem } from './services/api';
import { filterKnowledgeItems, FilterState } from './utils/filterKnowledgeItems';


// --- Main App Component ---
const App: React.FC = () => {
  // Wszystkie hooki na górze komponentu!
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [simpleToasts, setSimpleToasts] = useState<{id: string, type: ToastType, message: string}[]>([]);
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load knowledge items
  const loadKnowledgeItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await apiService.getKnowledgeItems();
      setKnowledgeItems(items);
      setFilteredItems(items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toast functions
  const removeSimpleToast = useCallback((id: string) => {
    setSimpleToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addSimpleToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setSimpleToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeSimpleToast(id), 4000);
  }, [removeSimpleToast]);

  useEffect(() => {
    loadKnowledgeItems();
  }, [loadKnowledgeItems]);

  // Zapobieganie cofaniu się strony przy naciśnięciu Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jeśli naciśnięto Backspace i nie ma aktywnego pola input/textarea/contenteditable
      if (e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable;
        
        if (!isInputField) {
          e.preventDefault(); // Zapobiegaj domyślnemu zachowaniu (cofanie strony)
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle form submission
  const handleAddItem = async (data: { title: string; content?: string; file?: File; tags: string }) => {
    try {
      setSubmitting(true);
      let newItem: KnowledgeItem;

      if (data.file) {
        newItem = await apiService.uploadPdfFile({
          title: data.title,
          pdf_file: data.file,
          tags: data.tags
        });
        addSimpleToast('success', 'PDF został pomyślnie wgrany!');
      } else if (data.content) {
        newItem = await apiService.uploadTextNote({
          title: data.title,
          content: data.content!,
          tags: data.tags
        });
        addSimpleToast('success', 'Notatka została pomyślnie zapisana!');
      } else {
        throw new Error('No content or file provided');
      }

      setKnowledgeItems(prev => [newItem, ...prev]);
      // Jeśli nie ma wyszukiwania, dodaj też do filteredItems
      if (!searchQuery.trim()) {
        setFilteredItems(prev => [newItem, ...prev]);
      }
      setActiveView('all');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      addSimpleToast('error', errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      try {
        await apiService.deleteKnowledgeItem(id);
        setKnowledgeItems(prev => prev.filter(item => item.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
        addSimpleToast('success', 'Element został pomyślnie usunięty!');
      } catch (err: any) {
        addSimpleToast('error', err.message || 'Nie udało się usunąć elementu!');
      }
    }
  };

  const handleEditItem = async (id: number, data: { title: string; content: string; tags: string }) => {
    try {
      setSubmitting(true);
      const updatedItem = await apiService.updateKnowledgeItem(id, {
        title: data.title,
        content: data.content,
        tags: data.tags
      });
      
      // Aktualizuj listę notatek
      setKnowledgeItems(prev => 
        prev.map(item => item.id === id ? updatedItem : item)
      );
      
      // Aktualizuj filtrowane wyniki
      setFilteredItems(prev => 
        prev.map(item => item.id === id ? updatedItem : item)
      );
      
      // Jeśli edytujemy aktualnie wybraną notatkę, zaktualizuj ją
      if (selectedItem?.id === id) {
        setSelectedItem(updatedItem);
      }
      
      setEditingItem(null);
      addSimpleToast('success', 'Element został pomyślnie zaktualizowany!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      addSimpleToast('error', errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'all': return 'Asystent Wiedzy';
      case 'add': return 'Dodaj nową notatkę';
      case 'settings': return 'Ustawienia';
      default: return 'Asystent Wiedzy';
    }
  };

  const availableTags = Array.from(new Set(knowledgeItems.flatMap(item => item.tags))).sort();

  // SEMANTIC SEARCH z debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (searchQuery.trim()) {
      debounceTimeout.current = setTimeout(async () => {
        try {
          setLoading(true);
          // Wykonaj wyszukiwanie semantyczne (threshold 0.5 ustawiony w backendzie)
          const results = await apiService.semanticSearch(searchQuery, 50);
          console.log('Semantic search completed:', results.length, 'results');
          console.log('Sample results:', results.slice(0, 3).map(r => ({ title: r.title, tags: r.tags })));
          
          // Następnie zastosuj lokalne filtry na wynikach semantycznych
          const filteredResults = filterKnowledgeItems(results, '', filters);
          console.log('After local filters:', filteredResults.length, 'results');
          console.log('Active filters:', filters);
          
          setFilteredItems(filteredResults);
        } catch (err) {
          console.error('Semantic search error:', err);
          setFilteredItems([]);
          addSimpleToast('error', 'Wyszukiwanie semantyczne nie powiodło się!');
        } finally {
          setLoading(false);
        }
      }, 350);
    }
    
    // Cleanup function
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, filters, addSimpleToast]);

  // Effect dla lokalnych filtrów (gdy nie ma zapytania tekstowego LUB gdy się zmienią dane)
  useEffect(() => {
    if (!searchQuery.trim()) {
      const locallyFiltered = filterKnowledgeItems(knowledgeItems, '', filters);
      setFilteredItems(locallyFiltered);
    }
  }, [filters, knowledgeItems, searchQuery]);

  // Dopiero po hookach warunki zwracające JSX:
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__center">
          <LoadingSpinner size="lg" />
          <p className="app-loading__text">Loading Knowledge Assistant...</p>
        </div>
      </div>
    );
  }

  if (error && knowledgeItems.length === 0) {
    return (
      <div className="app-error">
        <div className="app-error__center">
          <AlertCircle className="app-error__icon" />
          <h3 className="app-error__title">Connection Error</h3>
          <p className="app-error__desc">{error}</p>
          <button
            onClick={loadKnowledgeItems}
            className="app-error__retry"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Funkcja do obsługi zmiany widoku z Sidebara
  const handleSidebarViewChange = (view: string) => {
    setActiveView(view);
    setSelectedItem(null); // zawsze wracaj do listy, nawet jeśli był wybrany szczegół
  };

  return (
    <>
      <div className={`app-root${isDarkMode ? ' app-root--dark' : ''}`}>
        <div className="app-layout">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            activeView={activeView}
            onViewChange={handleSidebarViewChange}
          />
          <FilterSidebar
            filters={filters}
            availableTags={availableTags}
            onChange={setFilters}
          />
          <div className="app-main">
            <Header
              title={getViewTitle()}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isDarkMode={isDarkMode}
              onThemeToggle={() => setIsDarkMode(!isDarkMode)}
              onSidebarToggle={() => setSidebarOpen(true)}
            />
            <main className="app-content">
              {editingItem ? (
                <EditItemForm
                  item={editingItem}
                  onSubmit={handleEditItem}
                  onCancel={() => setEditingItem(null)}
                  loading={submitting}
                />
              ) : activeView === 'add' ? (
                <AddItemForm
                  onSubmit={handleAddItem}
                  onCancel={() => setActiveView('all')}
                  loading={submitting}
                />
              ) : activeView === 'settings' ? (
                <div className="settings-panel">
                  <h3 className="settings-panel__title">Ustawienia</h3>
                  <p className="settings-panel__desc">Panel ustawień - wkrótce!</p>
                </div>
              ) : selectedItem ? (
                  <KnowledgeItemDetail
                    item={selectedItem}
                    onBack={() => setSelectedItem(null)}
                    onEdit={item => setEditingItem(item)}
                    onDelete={handleDeleteItem}
                  />
              ) : (
                <div className="item-list">
                  <div className="item-list__header">
                    <div className="item-list__header-left">
                      <h3 className="item-list__count">
                        Znaleziono {filteredItems.length} elementów
                      </h3>
                      {(searchQuery || filters.tags.length > 0 || filters.type !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              tags: [],
                              type: 'all',
                              sortBy: 'date',
                              sortOrder: 'desc'
                            });
                          }}
                          className="item-list__clear-filters"
                        >
                          Wyczyść wszystkie filtry
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveView('add')}
                      className="item-list__add-btn"
                    >
                      <Plus className="item-list__add-icon" />
                      Dodaj nową
                    </button>
                  </div>
                  {filteredItems.length === 0 ? (
                    <div className="item-list__empty">
                      <FileText className="item-list__empty-icon" />
                      <h3 className="item-list__empty-title">Nie znaleziono elementów</h3>
                      <p className="item-list__empty-desc">
                        {searchQuery || filters.tags.length > 0 || filters.type !== 'all'
                          ? 'Spróbuj dostosować wyszukiwanie lub filtry'
                          : 'Zacznij od dodania swojej pierwszej notatki'
                        }
                      </p>
                      <button
                        onClick={() => setActiveView('add')}
                        className="item-list__add-btn"
                      >
                        <Plus className="item-list__add-icon" />
                        Dodaj swoją pierwszą notatkę
                      </button>
                    </div>
                  ) : (
                    <div className="item-list__grid">
                      {filteredItems.map((item: KnowledgeItem) => (
                        <KnowledgeItemCard
                          key={item.id}
                          item={item}
                          onEdit={() => console.log('Edit item:', item)}
                          onDelete={handleDeleteItem}
                          onView={setSelectedItem} // <- to wywoła KnowledgeItemDetail
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      {/* SimpleToast List */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 2000 }}>
        {simpleToasts.map(t => (
          <SimpleToast key={t.id} id={t.id} type={t.type} message={t.message} onClose={removeSimpleToast} />
        ))}
      </div>
    </>
  );
};

export default App;