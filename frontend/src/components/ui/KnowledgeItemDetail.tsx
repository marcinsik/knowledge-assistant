import { ArrowLeft, Calendar, Download, Edit, FileText, Trash2 } from 'lucide-react';
import React from 'react';
import { KnowledgeItem } from '../../services/api';
import '../../styles/KnowledgeItemDetail.css';

interface KnowledgeItemDetailProps {
  item: KnowledgeItem;
  onBack: () => void;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
}

const handleDownloadPdf = async (itemId: number, isNote = false) => {
  try {
    const endpoint = isNote 
      ? `/api/knowledge_items/note_pdf/${itemId}`
      : `/api/knowledge_items/pdf/${itemId}`;
    
    console.log('Downloading from:', endpoint); // Debug
    
    const response = await fetch(endpoint);
    
    console.log('Response status:', response.status); // Debug
    console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText); // Debug
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Sprawdź Content-Type
    const contentType = response.headers.get('Content-Type');
    console.log('Content-Type:', contentType); // Debug
    
    if (!contentType || !contentType.includes('application/pdf')) {
      const responseText = await response.text();
      console.error('Expected PDF but got:', contentType, responseText.substring(0, 200)); // Debug
      throw new Error(`Server returned ${contentType} instead of PDF`);
    }
    
    // Pobierz filename z nagłówków
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = isNote ? `note_${itemId}.pdf` : `document_${itemId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    console.log('Downloading as:', filename); // Debug
    
    const blob = await response.blob();
    console.log('Blob size:', blob.size, 'Blob type:', blob.type); // Debug
    
    // Sprawdź czy blob jest PDF
    if (blob.type && !blob.type.includes('application/pdf')) {
      console.error('Blob is not PDF:', blob.type);
      // Sprawdź zawartość jako tekst
      const text = await blob.text();
      console.error('Blob content preview:', text.substring(0, 200));
      throw new Error(`Downloaded file is ${blob.type}, not PDF`);
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('Download completed successfully'); // Debug
  } catch (error) {
    console.error('Błąd pobierania PDF:', error);
    alert(`Wystąpił błąd podczas pobierania pliku PDF: ${(error as Error).message}`);
  }
};

// Test endpoint - dodaj ten przycisk do debugowania
const testEndpoint = async (itemId: number, isNote = false) => {
  const endpoint = isNote 
    ? `/api/knowledge_items/note_pdf/${itemId}`
    : `/api/knowledge_items/pdf/${itemId}`;
  
  try {
    const response = await fetch(endpoint);
    const text = await response.text();
    console.log('Raw response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: text.substring(0, 500)
    });
  } catch (error) {
    console.error('Test failed:', error);
  }
};

const KnowledgeItemDetail: React.FC<KnowledgeItemDetailProps> = ({ item, onBack, onEdit, onDelete }) => {
  return (
    <div className="item-details">
      <div className="item-details__header">
        <button onClick={onBack} className="item-details__back">
          <ArrowLeft className="item-details__back-icon" />
          Powrót do listy
        </button>
        <div className="item-details__actions">
          <button onClick={() => onEdit(item)} className="item-details__action item-details__action--edit">
            <Edit className="item-details__action-icon" /> Edytuj
          </button>
         {item.original_filename && (
            <a
                href={`/api/knowledge_items/pdf/${item.id}`}
                className="item-details__action item-details__action--download"
                download
                onClick={(e) => {
                // Możesz dodać logowanie kliknięcia
                console.log('PDF link clicked');
                }}
            >
                <Download className="item-details__action-icon" /> Pobierz PDF
            </a>
            )}

            <a
            href={`/api/knowledge_items/note_pdf/${item.id}`}
            className="item-details__action item-details__action--download"
            download
            onClick={(e) => {
                console.log('Note PDF link clicked');
            }}
            >
            <Download className="item-details__action-icon" /> Pobierz notatkę jako PDF
            </a>
          <button onClick={() => onDelete(item.id)} className="item-details__action item-details__action--delete">
            <Trash2 className="item-details__action-icon" /> Usuń
          </button>
        </div>
      </div>
      <div className="item-details__meta-row">
        <div className="item-details__meta-main">
          <h1 className="item-details__title">{item.title}</h1>
          <div className="item-details__meta">
            <span className="item-details__meta-item">
              <Calendar className="item-details__meta-icon" />
              Utworzono: {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.updated_at !== item.created_at && (
              <span className="item-details__meta-item">
                <Calendar className="item-details__meta-icon" />
                Zaktualizowano: {new Date(item.updated_at).toLocaleDateString()}
              </span>
            )}
            {item.original_filename && (
              <span className="item-details__meta-item">
                <FileText className="item-details__meta-icon" />
                {item.original_filename}
              </span>
            )}
          </div>
        </div>
        {item.original_filename && (
          <div className="item-details__pdf-label">
            <FileText className="item-details__pdf-icon" /> PDF
          </div>
        )}
      </div>
      {item.tags.length > 0 && (
        <div className="item-details__tags">
          {item.tags.map((tag) => (
            <span key={tag} className="item-details__tag">{tag}</span>
          ))}
        </div>
      )}
      <div className="item-details__content">
        <div className="item-details__text">
          {item.text_content.split('\n').map((paragraph, index) =>
            paragraph.trim() === '' ? (
              <br key={index} />
            ) : (
              <p key={index} className="item-details__paragraph">{paragraph}</p>
            )
          )}
        </div>
      </div>
      <div className="item-details__footer">
        <div className="item-details__footer-meta">
          <span>ID: {item.id}</span>
          <span>Długość: {item.text_content.length} znaków</span>
          <span>Słowa: {item.text_content.split(/\s+/).length}</span>
        </div>
        <div className="item-details__footer-updated">
          <span>Ostatnia modyfikacja:</span>
          <span className="item-details__footer-date">
            {new Date(item.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeItemDetail;
