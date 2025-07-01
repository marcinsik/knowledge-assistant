import React from 'react';
import { FilterState } from '../../utils/filterKnowledgeItems';
import '../../styles/FilterSidebar.css';

interface FilterSidebarProps {
  filters: FilterState;
  availableTags: string[];
  onChange: (filters: FilterState) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, availableTags, onChange }) => {
  const handleTagToggle = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags });
  };

  return (
    <aside className="filter-sidebar">
      <h3 className="filter-sidebar__title">Filtrowanie i sortowanie</h3>
      <div className="filter-sidebar__section">
        <label>Typ:</label>
        <select
          value={filters.type}
          onChange={e => onChange({ ...filters, type: e.target.value as FilterState['type'] })}
        >
          <option value="all">Wszystkie</option>
          <option value="text">Notatki tekstowe</option>
          <option value="pdf">PDF</option>
        </select>
      </div>
      <div className="filter-sidebar__section">
        <label>Sortuj według:</label>
        <select
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
        >
          <option value="date">Data</option>
          <option value="title">Tytuł</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={e => onChange({ ...filters, sortOrder: e.target.value as FilterState['sortOrder'] })}
        >
          <option value="desc">Malejąco</option>
          <option value="asc">Rosnąco</option>
        </select>
      </div>
      <div className="filter-sidebar__section">
        <label>Tagi:</label>
        <div className="filter-sidebar__tags">
          {availableTags.length === 0 && <span className="filter-sidebar__no-tags">Brak tagów</span>}
          {availableTags.map(tag => (
            <label key={tag} className="filter-sidebar__tag">
              <input
                type="checkbox"
                checked={filters.tags.includes(tag)}
                onChange={() => handleTagToggle(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;