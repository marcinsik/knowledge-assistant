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
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );
};

// Komponent pojedynczego powiadomienia toast
const Toast: React.FC<{
  toast: ToastMessage;
  onClose: (id: string) => void;
}> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Automatyczne pokazanie i ukrycie toast po 5 sekundach
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  // Funkcja zwracająca odpowiednią ikonę dla typu wiadomości
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Funkcja zwracająca kolor tła dla typu wiadomości
  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Funkcja zwracająca kolor tekstu dla typu wiadomości
  const getTextColor = () => {
    switch (toast.type) {
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
        ${getBgColor()}
      `}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Kontener dla wszystkich powiadomień toast (pozycjonowany w prawym górnym rogu)
const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Komponent bocznego menu nawigacyjnego
const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}> = ({ isOpen, onToggle, activeView, onViewChange }) => {
  // Definicja elementów menu
  const menuItems = [
    { id: 'all', label: 'All Items', icon: FileText },
    { id: 'add', label: 'Add New', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Overlay dla urządzeń mobilnych */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Panel boczny z animacją przesuwania */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'w-64' : 'w-0 lg:w-64'}
      `}>
        <div className="p-6">
          {/* Nagłówek z tytułem aplikacji */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-gray-900">Knowledge Assistant</h1>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Menu nawigacyjne */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors
                    ${activeView === item.id 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
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

// Komponent nagłówka aplikacji z wyszukiwarką i przełącznikami
const Header: React.FC<{
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
}> = ({ title, searchQuery, onSearchChange, isDarkMode, onThemeToggle, onSidebarToggle }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Lewa strona - przycisk menu i tytuł */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        </div>
        
        {/* Prawa strona - wyszukiwarka i kontrolki */}
        <div className="flex items-center space-x-4">
          {/* Pole wyszukiwania */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search knowledge items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            {/* Przycisk czyszczenia wyszukiwania */}
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Przełącznik trybu ciemnego */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Avatar użytkownika */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

// Komponent wyświetlający tag z opcjonalnym przyciskiem usuwania
const TagChip: React.FC<{ tag: string; onRemove?: () => void }> = ({ tag, onRemove }) => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {tag}
    {onRemove && (
      <button
        onClick={onRemove}
        className="ml-1 hover:text-blue-600"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

// Komponent karty pojedynczego elementu wiedzy
const KnowledgeItemCard: React.FC<{
  item: KnowledgeItem;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
  onView: (item: KnowledgeItem) => void;
}> = ({ item, onEdit, onDelete, onView }) => {
  // Funkcja formatująca datę do czytelnej postaci
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer animate-fade-in">
      <div onClick={() => onView(item)}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center space-x-2">
            {item.original_filename && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                PDF
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.text_content.substring(0, 150)}...
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(item.updated_at)}
          </span>
          {item.original_filename && (
            <span className="truncate max-w-32">
              {item.original_filename}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
        {item.original_filename && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Downloading:', item.original_filename);
            }}
            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

// Komponent formularza dodawania nowego elementu wiedzy (tekst lub PDF)
const AddItemForm: React.FC<{
  onSubmit: (data: { title: string; content?: string; file?: File; tags: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}> = ({ onSubmit, onCancel, loading }) => {
  // Stan aktywnej zakładki (tekst lub PDF)
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  // Stan danych formularza
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    file: null as File | null
  });

  // Obsługa wysyłania formularza
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeTab === 'text') {
        // Wysyłanie notatki tekstowej
        await onSubmit({
          title: formData.title,
          content: formData.content,
          tags: formData.tags
        });
      } else {
        // Wysyłanie pliku PDF
        if (!formData.file) return;
        await onSubmit({
          title: formData.title,
          file: formData.file,
          tags: formData.tags
        });
      }
      
      // Czyszczenie formularza po udanym wysłaniu
      setFormData({ title: '', content: '', tags: '', file: null });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Add New Knowledge Item</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Add Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            disabled={loading}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pdf'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload PDF
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>
        
        {activeTab === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              required
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PDF File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your PDF file here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="hidden"
                id="pdf-upload"
                required
                disabled={loading}
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Choose File
              </label>
              {formData.file && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {formData.file.name}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Enter tags separated by commas"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas (e.g., React, JavaScript, Frontend)
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={loading}
          >
            {loading && <LoadingSpinner size="sm" />}
            <span className={loading ? 'ml-2' : ''}>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Knowledge Assistant...</p>
        </div>
      </div>
    );
  }

  if (error && knowledgeItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadKnowledgeItems}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={getViewTitle()}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isDarkMode={isDarkMode}
            onThemeToggle={() => setIsDarkMode(!isDarkMode)}
            onSidebarToggle={() => setSidebarOpen(true)}
          />
          
          <main className="flex-1 overflow-auto p-6">
            {activeView === 'add' ? (
              <AddItemForm
                onSubmit={handleAddItem}
                onCancel={() => setActiveView('all')}
                loading={submitting}
              />
            ) : activeView === 'settings' ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <p className="text-gray-600">Settings panel - coming soon!</p>
              </div>
            ) : selectedItem ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Powrót do listy
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => console.log('Edit item:', selectedItem)}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edytuj
                      </button>
                      
                      {selectedItem.original_filename && (
                        <button
                          onClick={() => console.log('Downloading:', selectedItem.original_filename)}
                          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Pobierz
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
                            handleDeleteItem(selectedItem.id);
                            setSelectedItem(null);
                          }
                        }}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Usuń
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedItem.title}
                      </h1>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Utworzono: {new Date(selectedItem.created_at).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {selectedItem.updated_at !== selectedItem.created_at && (
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Zaktualizowano: {new Date(selectedItem.updated_at).toLocaleDateString('pl-PL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        
                        {selectedItem.original_filename && (
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {selectedItem.original_filename}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedItem.original_filename && (
                      <div className="ml-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          <FileText className="w-4 h-4 mr-1" />
                          PDF
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  {selectedItem.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="prose max-w-none">
                    <div className="text-gray-900 whitespace-pre-wrap">
                      {selectedItem.text_content.split('\n').map((paragraph, index) => {
                        if (paragraph.trim() === '') {
                          return <br key={index} />;
                        }
                        return (
                          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Footer with metadata */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>ID: {selectedItem.id}</span>
                      <span>Długość: {selectedItem.text_content.length} znaków</span>
                      <span>Słowa: {selectedItem.text_content.split(/\s+/).length}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span>Ostatnia modyfikacja:</span>
                      <span className="font-medium">{new Date(selectedItem.updated_at).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">
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
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setActiveView('add')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </button>
                </div>
                
                {filteredItems().length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || filters.tags.length > 0 || filters.type !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first knowledge item'
                      }
                    </p>
                    <button
                      onClick={() => setActiveView('add')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
