// Komponent szczegółowego widoku elementu wiedzy (notatki lub PDF)
import { ArrowLeft, Calendar, Download, Edit, FileText, Tag, Trash2 } from 'lucide-react';
import React from 'react';

// Interfejs reprezentujący element wiedzy
interface KnowledgeItem {
  id: number;
  title: string;
  text_content: string;
  original_filename?: string; // Nazwa pliku dla PDF-ów
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Interfejs dla właściwości komponentu KnowledgeItemDetail
interface KnowledgeItemDetailProps {
  item: KnowledgeItem; // Element wiedzy do wyświetlenia
  onBack: () => void; // Funkcja powrotu do listy
  onEdit: (item: KnowledgeItem) => void; // Funkcja edycji elementu
  onDelete: (id: number) => void; // Funkcja usuwania elementu
}

// Komponent wyświetlający pojedynczy tag z ikoną
const TagChip: React.FC<{ tag: string }> = ({ tag }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
    <Tag className="w-3 h-3 mr-1" />
    {tag}
  </span>
);

// Główny komponent szczegółowego widoku elementu wiedzy
const KnowledgeItemDetail: React.FC<KnowledgeItemDetailProps> = ({
  item,
  onBack,
  onEdit,
  onDelete
}) => {
  // Funkcja formatująca datę do polskiego formatu
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funkcja formatująca treść - dzieli na akapity i zachowuje łamanie linii
  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-4 text-gray-700 leading-relaxed">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-fade-in">
      {/* Nagłówek z przyciskami akcji */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Przycisk powrotu do listy */}
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Powrót do listy
          </button>
          
          {/* Przyciski akcji (edytuj, pobierz, usuń) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edytuj
            </button>
            
            {/* Przycisk pobierania - tylko dla PDF-ów */}
            {item.original_filename && (
              <button
                onClick={() => console.log('Downloading:', item.original_filename)}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Pobierz
              </button>
            )}
            
            {/* Przycisk usuwania z potwierdzeniem */}
            <button
              onClick={() => {
                if (window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
                  onDelete(item.id);
                  onBack();
                }
              }}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Usuń
            </button>
          </div>
        </div>
        
        {/* Informacje o elemencie */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Tytuł elementu */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {item.title}
            </h1>
            
            {/* Metadane - daty utworzenia, modyfikacji, nazwa pliku */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Utworzono: {formatDate(item.created_at)}
              </span>
              
              {/* Data modyfikacji - tylko jeśli różni się od daty utworzenia */}
              {item.updated_at !== item.created_at && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Zaktualizowano: {formatDate(item.updated_at)}
                </span>
              )}
              
              {/* Nazwa oryginalnego pliku - tylko dla PDF-ów */}
              {item.original_filename && (
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {item.original_filename}
                </span>
              )}
            </div>
          </div>
          
          {/* Badge PDF - tylko dla plików PDF */}
          {item.original_filename && (
            <div className="ml-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </span>
            </div>
          )}
        </div>
        
        {/* Sekcja tagów */}
        {item.tags.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Główna treść elementu */}
      <div className="p-6">
        <div className="prose max-w-none">
          <div className="text-gray-900 whitespace-pre-wrap">
            {formatContent(item.text_content)}
          </div>
        </div>
      </div>
      
      {/* Stopka z dodatkowymi metadanymi */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          {/* Statystyki tekstu */}
          <div className="flex items-center space-x-4">
            <span>ID: {item.id}</span>
            <span>Długość: {item.text_content.length} znaków</span>
            <span>Słowa: {item.text_content.split(/\s+/).length}</span>
          </div>
          
          {/* Data ostatniej modyfikacji */}
          <div className="flex items-center space-x-2">
            <span>Ostatnia modyfikacja:</span>
            <span className="font-medium">{formatDate(item.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeItemDetail;
