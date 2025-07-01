import { Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { KnowledgeItem } from '../../services/api';
import '../../styles/EditItemForm.css';

interface EditItemFormProps {
  item: KnowledgeItem;
  onSubmit: (id: number, data: { title: string; content: string; tags: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ item, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  // Inicjalizuj formularz danymi z notatki
  useEffect(() => {
    setFormData({
      title: item.title,
      content: item.text_content,
      tags: item.tags.join(', ')
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    try {
      await onSubmit(item.id, {
        title: formData.title,
        content: formData.content,
        tags: formData.tags
      });
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Nie pozwalaj edytować plików PDF
  if (item.original_filename) {
    return (
      <div className="edit-form">
        <div className="edit-form__header">
          <h3 className="edit-form__title">Nie można edytować pliku PDF</h3>
          <button onClick={onCancel} className="edit-form__close">
            <X className="edit-form__close-icon" />
          </button>
        </div>
        <div className="edit-form__content">
          <p className="edit-form__error">
            Pliki PDF nie mogą być edytowane. Można edytować tylko notatki tekstowe.
          </p>
          <div className="edit-form__actions">
            <button onClick={onCancel} className="edit-form__cancel">
              Zamknij
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-form">
      <div className="edit-form__header">
        <h3 className="edit-form__title">Edytuj notatkę</h3>
        <button onClick={onCancel} className="edit-form__close" disabled={loading}>
          <X className="edit-form__close-icon" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="edit-form__form">
        <div className="edit-form__content">
          {/* Tytuł */}
          <div className="edit-form__field">
            <label htmlFor="edit-title" className="edit-form__label">
              Tytuł *
            </label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="edit-form__input"
              placeholder="Wprowadź tytuł..."
              required
              disabled={loading}
            />
          </div>

          {/* Treść */}
          <div className="edit-form__field">
            <label htmlFor="edit-content" className="edit-form__label">
              Treść
            </label>
            <textarea
              id="edit-content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="edit-form__textarea"
              placeholder="Wprowadź treść..."
              rows={10}
              disabled={loading}
            />
          </div>

          {/* Tagi */}
          <div className="edit-form__field">
            <label htmlFor="edit-tags" className="edit-form__label">
              Tagi
            </label>
            <input
              id="edit-tags"
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="edit-form__input"
              placeholder="Oddziel tagi przecinkami..."
              disabled={loading}
            />
            <small className="edit-form__help">
              Przykład: programowanie, react, tutorial
            </small>
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="edit-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="edit-form__cancel"
            disabled={loading}
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="edit-form__submit"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? (
              <>
                <div className="edit-form__spinner"></div>
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="edit-form__save-icon" />
                Zapisz zmiany
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItemForm;
