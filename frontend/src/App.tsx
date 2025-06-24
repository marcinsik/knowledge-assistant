// Importy ikon z biblioteki Lucide React dla interfejsu użytkownika
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  FileText,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Definicje typów TypeScript dla aplikacji

// Typ reprezentujący pojedynczy element wiedzy (notatkę lub PDF)
interface KnowledgeItem {
  id: number;
  title: string;
  text_content: string;
  original_filename?: string; // Opcjonalna nazwa pliku dla PDF-ów
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Typ dla stanu filtrów i sortowania
interface FilterState {
  tags: string[];
  type: 'all' | 'text' | 'pdf';
  sortBy: 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

// Typ dla wiadomości toast (powiadomienia)
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Konfiguracja API - adres backendu
const API_BASE_URL = 'http://localhost:8000';

// Klasa serwisu API do komunikacji z backendem
class ApiService {
  // Uniwersalna metoda do wykonywania zapytań HTTP
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, options);
      
      // Sprawdzenie czy odpowiedź jest poprawna
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Pobieranie listy wszystkich elementów wiedzy
  async getKnowledgeItems(): Promise<KnowledgeItem[]> {
    return this.request('/api/knowledge_items');
  }

  // Przesyłanie nowej notatki tekstowej
  async uploadTextNote(title: string, content: string, tags?: string): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (tags) {
      formData.append('tags', tags);
    }

    return this.request('/api/knowledge_items/upload_text', {
      method: 'POST',
      body: formData,
    });
  }

  // Przesyłanie pliku PDF
  async uploadPdfFile(title: string, file: File, tags?: string): Promise<KnowledgeItem> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('pdf_file', file);
    if (tags) {
      formData.append('tags', tags);
    }

    return this.request('/api/knowledge_items/upload_pdf', {
      method: 'POST',
      body: formData,
    });
  }
}

// Instancja serwisu API
const apiService = new ApiService();

// Komponenty UI

// Komponent spinnera ładowania z różnymi rozmiarami
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'spinner--sm',
    md: 'spinner--md',
    lg: 'spinner--lg'
  };
  return <div className={`spinner ${sizeClasses[size]}`} />;
};

const Toast: React.FC<{
  toast: ToastMessage;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="toast__icon toast__icon--success" />;
      case 'error':
        return <AlertCircle className="toast__icon toast__icon--error" />;
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : 'toast--hidden'}`}>
      <div className="toast__content">
        {getIcon()}
        <div className="toast__message">
          <p className="toast__text">{toast.message}</p>
        </div>
        <button onClick={() => onClose(toast.id)} className="toast__close">
          <X className="toast__close-icon" />
        </button>
      </div>
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => (
  <div className="toast-container">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={onClose} />
    ))}
  </div>
);

const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}> = ({ isOpen, onToggle, activeView, onViewChange }) => {
  const menuItems = [
    { id: 'all', label: 'All Items', icon: FileText },
    { id: 'add', label: 'Add New', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onToggle} />}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__inner">
          <div className="sidebar__header">
            <h1 className="sidebar__title">Knowledge Assistant</h1>
            <button onClick={onToggle} className="sidebar__close">
              <X className="sidebar__close-icon" />
            </button>
          </div>
          <nav className="sidebar__nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`sidebar__nav-item${activeView === item.id ? ' sidebar__nav-item--active' : ''}`}
                >
                  <Icon className="sidebar__nav-icon" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

const Header: React.FC<{
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
}> = ({ title, searchQuery, onSearchChange, isDarkMode, onThemeToggle, onSidebarToggle }) => (
  <header className="header">
    <div className="header__row">
      <div className="header__left">
        <button onClick={onSidebarToggle} className="header__menu-btn">
          <Menu className="header__menu-icon" />
        </button>
        <h2 className="header__title">{title}</h2>
      </div>
      <div className="header__right">
        <div className="header__search">
          <Search className="header__search-icon" />
          <input
            type="text"
            placeholder="Search knowledge items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="header__search-input"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="header__search-clear">
              <X className="header__search-clear-icon" />
            </button>
          )}
        </div>
        <button onClick={onThemeToggle} className="header__theme-btn">
          {isDarkMode ? <Sun className="header__theme-icon" /> : <Moon className="header__theme-icon" />}
        </button>
        <div className="header__avatar">
          <User className="header__avatar-icon" />
        </div>
      </div>
    </div>
  </header>
);

const TagChip: React.FC<{ tag: string; onRemove?: () => void }> = ({ tag, onRemove }) => (
  <span className="tag-chip">
    {tag}
    {onRemove && (
      <button onClick={onRemove} className="tag-chip__remove">
        <X className="tag-chip__remove-icon" />
      </button>
    )}
  </span>
);

const KnowledgeItemCard: React.FC<{
  item: KnowledgeItem;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
  onView: (item: KnowledgeItem) => void;
}> = ({ item, onEdit, onDelete, onView }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  return (
    <div className="item-card">
      <div onClick={() => onView(item)}>
        <div className="item-card__header">
          <h3 className="item-card__title">{item.title}</h3>
          <div className="item-card__type">
            {item.original_filename && <span className="item-card__pdf-label">PDF</span>}
          </div>
        </div>
        <p className="item-card__content">{item.text_content.substring(0, 150)}...</p>
        <div className="item-card__tags">
          {item.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        <div className="item-card__meta">
          <span className="item-card__date">
            <Calendar className="item-card__date-icon" />
            {formatDate(item.updated_at)}
          </span>
          {item.original_filename && <span className="item-card__filename">{item.original_filename}</span>}
        </div>
      </div>
      <div className="item-card__actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="item-card__action item-card__action--edit"
        >
          <Edit className="item-card__action-icon" />
          Edit
        </button>
        {item.original_filename && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Downloading:', item.original_filename);
            }}
            className="item-card__action item-card__action--download"
          >
            <Download className="item-card__action-icon" />
            Download
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="item-card__action item-card__action--delete"
        >
          <Trash2 className="item-card__action-icon" />
          Delete
        </button>
      </div>
    </div>
  );
};

const AddItemForm: React.FC<{
  onSubmit: (data: { title: string; content?: string; file?: File; tags: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}> = ({ onSubmit, onCancel, loading }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    file: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'text') {
        await onSubmit({
          title: formData.title,
          content: formData.content,
          tags: formData.tags
        });
      } else {
        if (!formData.file) return;
        await onSubmit({
          title: formData.title,
          file: formData.file,
          tags: formData.tags
        });
      }
      setFormData({ title: '', content: '', tags: '', file: null });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="add-form">
      <div className="add-form__header">
        <h3 className="add-form__title">Add New Knowledge Item</h3>
        <button onClick={onCancel} className="add-form__close" disabled={loading}>
          <X className="add-form__close-icon" />
        </button>
      </div>
      <div className="add-form__tabs">
        <div className="add-form__tab-list">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            disabled={loading}
            className={`add-form__tab${activeTab === 'text' ? ' add-form__tab--active' : ''}`}
          >
            <FileText className="add-form__tab-icon" />
            Add Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            disabled={loading}
            className={`add-form__tab${activeTab === 'pdf' ? ' add-form__tab--active' : ''}`}
          >
            <Upload className="add-form__tab-icon" />
            Upload PDF
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="add-form__fields">
        <div className="add-form__field">
          <label className="add-form__label">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="add-form__input"
            required
            disabled={loading}
          />
        </div>
        {activeTab === 'text' ? (
          <div className="add-form__field">
            <label className="add-form__label">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="add-form__textarea"
              required
              disabled={loading}
            />
          </div>
        ) : (
          <div className="add-form__field">
            <label className="add-form__label">PDF File</label>
            <div className="add-form__file-drop">
              <Upload className="add-form__file-drop-icon" />
              <p className="add-form__file-desc">
                Drag and drop your PDF file here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="add-form__file-input"
                id="pdf-upload"
                required
                disabled={loading}
              />
              <label htmlFor="pdf-upload" className="add-form__file-btn">
                Choose File
              </label>
              {formData.file && (
                <p className="add-form__file-selected">
                  Selected: {formData.file.name}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="add-form__field">
          <label className="add-form__label">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Enter tags separated by commas"
            className="add-form__input"
            disabled={loading}
          />
          <p className="add-form__help">
            Separate tags with commas (e.g., React, JavaScript, Frontend)
          </p>
        </div>
        <div className="add-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="add-form__btn add-form__btn--cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="add-form__btn add-form__btn--submit"
            disabled={loading}
          >
            {loading && <LoadingSpinner size="sm" />}
            <span className={loading ? 'add-form__btn-label--loading' : ''}>
              {loading ? 'Processing...' : (activeTab === 'text' ? 'Save' : 'Upload')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

// Main App Component
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Toast functions
  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
      addToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load items on mount
  useEffect(() => {
    loadKnowledgeItems();
  }, [loadKnowledgeItems]);

  // Filter and sort items
  const filteredItems = useCallback(() => {
    let items = [...knowledgeItems];

    // Search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tag filter
    if (filters.tags.length > 0) {
      items = items.filter(item =>
        filters.tags.some(tag => item.tags.includes(tag))
      );
    }

    // Type filter
    if (filters.type !== 'all') {
      items = items.filter(item => {
        if (filters.type === 'pdf') return !!item.original_filename;
        if (filters.type === 'text') return !item.original_filename;
        return true;
      });
    }

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'date') {
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [knowledgeItems, searchQuery, filters]);

  // Handle form submission
  const handleAddItem = async (data: { title: string; content?: string; file?: File; tags: string }) => {
    try {
      setSubmitting(true);
      let newItem: KnowledgeItem;

      if (data.file) {
        newItem = await apiService.uploadPdfFile(data.title, data.file, data.tags);
        addToast('success', 'PDF uploaded successfully!');
      } else if (data.content) {
        newItem = await apiService.uploadTextNote(data.title, data.content, data.tags);
        addToast('success', 'Text note saved successfully!');
      } else {
        throw new Error('No content or file provided');
      }

      setKnowledgeItems(prev => [newItem, ...prev]);
      setActiveView('all');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      addToast('error', errorMessage);
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
      addToast('success', 'Item deleted successfully!');
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'all': return 'All Knowledge Items';
      case 'add': return 'Add New Item';
      case 'settings': return 'Settings';
      default: return 'Knowledge Assistant';
    }
  };

  // Get unique tags for filtering
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
 
   return (
     <div className={`app-root${isDarkMode ? ' app-root--dark' : ''}`}>
       <div className="app-layout">
         <Sidebar
           isOpen={sidebarOpen}
           onToggle={() => setSidebarOpen(!sidebarOpen)}
           activeView={activeView}
           onViewChange={setActiveView}
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
               <div className="item-details">
                 <div className="item-details__header">
                   <div className="item-details__header-row">
                     <button
                       onClick={() => setSelectedItem(null)}
                       className="item-details__back"
                     >
                       <ArrowLeft className="item-details__back-icon" />
                       Back to list
                     </button>
                     <div className="item-details__actions">
                       <button
                         onClick={() => console.log('Edit item:', selectedItem)}
                         className="item-details__action item-details__action--edit"
                       >
                         <Edit className="item-details__action-icon" />
                         Edit
                       </button>
                       {selectedItem.original_filename && (
                         <button
                           onClick={() => console.log('Downloading:', selectedItem.original_filename)}
                           className="item-details__action item-details__action--download"
                         >
                           <Download className="item-details__action-icon" />
                           Download
                         </button>
                       )}
                       <button
                         onClick={() => {
                           if (window.confirm('Are you sure you want to delete this item?')) {
                             handleDeleteItem(selectedItem.id);
                             setSelectedItem(null);
                           }
                         }}
                         className="item-details__action item-details__action--delete"
                       >
                         <Trash2 className="item-details__action-icon" />
                         Delete
                       </button>
                     </div>
                   </div>
                   <div className="item-details__meta-row">
                     <div className="item-details__meta-main">
                       <h1 className="item-details__title">{selectedItem.title}</h1>
                       <div className="item-details__meta">
                         <span className="item-details__meta-item">
                           <Calendar className="item-details__meta-icon" />
                           Created: {new Date(selectedItem.created_at).toLocaleDateString()}
                         </span>
                         {selectedItem.updated_at !== selectedItem.created_at && (
                           <span className="item-details__meta-item">
                             <Calendar className="item-details__meta-icon" />
                             Updated: {new Date(selectedItem.updated_at).toLocaleDateString()}
                           </span>
                         )}
                         {selectedItem.original_filename && (
                           <span className="item-details__meta-item">
                             <FileText className="item-details__meta-icon" />
                             {selectedItem.original_filename}
                           </span>
                         )}
                       </div>
                     </div>
                     {selectedItem.original_filename && (
                       <div className="item-details__pdf-label">
                         <FileText className="item-details__pdf-icon" />
                         PDF
                       </div>
                     )}
                   </div>
                   {selectedItem.tags.length > 0 && (
                     <div className="item-details__tags">
                       {selectedItem.tags.map((tag) => (
                         <span key={tag} className="item-details__tag">
                           {tag}
                         </span>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="item-details__content">
                   <div className="item-details__text">
                     {selectedItem.text_content.split('\n').map((paragraph, index) =>
                       paragraph.trim() === '' ? (
                         <br key={index} />
                       ) : (
                         <p key={index} className="item-details__paragraph">
                           {paragraph}
                         </p>
                       )
                     )}
                   </div>
                 </div>
                 <div className="item-details__footer">
                   <div className="item-details__footer-meta">
                     <span>ID: {selectedItem.id}</span>
                     <span>Length: {selectedItem.text_content.length} chars</span>
                     <span>Words: {selectedItem.text_content.split(/\s+/).length}</span>
                   </div>
                   <div className="item-details__footer-updated">
                     <span>Last modified:</span>
                     <span className="item-details__footer-date">
                       {new Date(selectedItem.updated_at).toLocaleDateString()}
                     </span>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="item-list">
                 <div className="item-list__header">
                   <div className="item-list__header-left">
                     <h3 className="item-list__count">
                       {filteredItems().length} items found
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
                 {filteredItems().length === 0 ? (
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
                     {filteredItems().map((item) => (
                       <KnowledgeItemCard
                         key={item.id}
                         item={item}
                         onEdit={() => console.log('Edit item:', item)}
                         onDelete={handleDeleteItem}
                         onView={setSelectedItem}
                       />
                     ))}
                   </div>
                 )}
               </div>
             )}
           </main>
         </div>
       </div>
       <ToastContainer toasts={toasts} onClose={removeToast} />
     </div>
   );
 };
 
 export default App;