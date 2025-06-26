import { FileText, Upload, X } from 'lucide-react';
import React, { useState } from 'react';

interface AddItemFormProps {
  onSubmit: (data: { title: string; content?: string; file?: File; tags: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSubmit, onCancel, loading }) => {
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
      // Możesz dodać obsługę błędów
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
            className="add-form__btn-cancel"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="add-form__btn-submit"
            disabled={loading}
          >
            {loading && <span className="add-form__btn-label--loading">Processing...</span>}
            <span className={loading ? 'add-form__btn-label--loading' : ''}>
              {loading ? 'Processing...' : (activeTab === 'text' ? 'Save' : 'Upload')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItemForm;
