import { X } from 'lucide-react';
import React from 'react';

interface TagChipProps {
  tag: string;
  onRemove?: () => void;
}

const TagChip: React.FC<TagChipProps> = ({ tag, onRemove }) => (
  <span className="tag-chip">
    {tag}
    {onRemove && (
      <button onClick={onRemove} className="tag-chip__remove">
        <X className="tag-chip__remove-icon" />
      </button>
    )}
  </span>
);

export default TagChip;
