import { Calendar, Download, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { KnowledgeItem } from '../../services/api';
import TagChip from './TagChip';

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (id: number) => void;
  onView: (item: KnowledgeItem) => void;
}

const KnowledgeItemCard: React.FC<KnowledgeItemCardProps> = ({ item, onEdit, onDelete, onView }) => {
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

export default KnowledgeItemCard;
