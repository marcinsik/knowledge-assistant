import { AlertCircle, FileText, Plus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import AddItemForm from './components/ui/AddItemForm';
import { ErrorMessage } from './components/ui/ErrorMessage';
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

  // Load knowledge items
  const loadKnowledgeItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await apiService.getKnowledgeItems();
      setKnowledgeItems(items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [ErrorMessage]);

  useEffect(() => {
    loadKnowledgeItems();
  }, [loadKnowledgeItems]);


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
        addSimpleToast('success', 'PDF uploaded successfully!');
      } else if (data.content) {
        newItem = await apiService.uploadTextNote({
          title: data.title,
          content: data.content!,
          tags: data.tags
        });
        addSimpleToast('success', 'Text note saved successfully!');
      } else {
        throw new Error('No content or file provided');
      }

      setKnowledgeItems(prev => [newItem, ...prev]);
      setActiveView('all');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      addSimpleToast('error', errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setKnowledgeItems(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      addSimpleToast('success', 'Item deleted successfully!');
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'all': return 'Knowledge Assistant';
      case 'add': return 'Add New Item';
      case 'settings': return 'Settings';
      default: return 'Knowledge Assistant';
    }
  };

  const filtered = filterKnowledgeItems(knowledgeItems, searchQuery, filters);
  const availableTags = Array.from(new Set(knowledgeItems.flatMap(item => item.tags))).sort();

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

  const addSimpleToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setSimpleToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => removeSimpleToast(id), 4000);
  };
  const removeSimpleToast = (id: string) => {
    setSimpleToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <div className={`app-root${isDarkMode ? ' app-root--dark' : ''}`}>
        <div className="app-layout">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            activeView={activeView}
            onViewChange={setActiveView}
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
              {activeView === 'add' ? (
                <AddItemForm
                  onSubmit={handleAddItem}
                  onCancel={() => setActiveView('all')}
                  loading={submitting}
                />
              ) : activeView === 'settings' ? (
                <div className="settings-panel">
                  <h3 className="settings-panel__title">Settings</h3>
                  <p className="settings-panel__desc">Settings panel - coming soon!</p>
                </div>
              ) : selectedItem ? (
                  <KnowledgeItemDetail
                    item={selectedItem}
                    onBack={() => setSelectedItem(null)}
                    onEdit={item => {/* obsługa edycji */}}
                    onDelete={handleDeleteItem}
                  />
              ) : (
                <div className="item-list">
                  <div className="item-list__header">
                    <div className="item-list__header-left">
                      <h3 className="item-list__count">
                        {filtered.length} items found
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
                          Clear all filters
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveView('add')}
                      className="item-list__add-btn"
                    >
                      <Plus className="item-list__add-icon" />
                      Add New
                    </button>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="item-list__empty">
                      <FileText className="item-list__empty-icon" />
                      <h3 className="item-list__empty-title">No items found</h3>
                      <p className="item-list__empty-desc">
                        {searchQuery || filters.tags.length > 0 || filters.type !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first knowledge item'
                        }
                      </p>
                      <button
                        onClick={() => setActiveView('add')}
                        className="item-list__add-btn"
                      >
                        <Plus className="item-list__add-icon" />
                        Add Your First Item
                      </button>
                    </div>
                  ) : (
                    <div className="item-list__grid">
                      {filtered.map((item: KnowledgeItem) => (
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