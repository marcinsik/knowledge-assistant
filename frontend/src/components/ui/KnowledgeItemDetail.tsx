import { ArrowLeft, Calendar, Download, Edit, FileText, Trash2 } from 'lucide-react';
import React from 'react';
import { KnowledgeItem } from '../../services/api';

interface KnowledgeItemDetailProps {
  item: KnowledgeItem;
  onBack: () => void;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
}

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
            <button onClick={() => window.open(`/api/knowledge_items/download/${item.id}`)} className="item-details__action item-details__action--download">
              <Download className="item-details__action-icon" /> Pobierz
            </button>
          )}
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
