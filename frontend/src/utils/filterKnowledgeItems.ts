import { KnowledgeItem } from '../services/api';

export interface FilterState {
  tags: string[];
  type: 'all' | 'pdf' | 'text';
  sortBy: 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

export function filterKnowledgeItems(
  items: KnowledgeItem[],
  searchQuery: string,
  filters: FilterState
): KnowledgeItem[] {
  let filtered = [...items];

  if (searchQuery) {
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter(item =>
      filters.tags.some(tag => item.tags.includes(tag))
    );
  }

  if (filters.type !== 'all') {
    filtered = filtered.filter(item => {
      if (filters.type === 'pdf') return !!item.original_filename;
      if (filters.type === 'text') return !item.original_filename;
      return true;
    });
  }

  filtered.sort((a, b) => {
    let comparison = 0;
    if (filters.sortBy === 'date') {
      comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    } else {
      comparison = a.title.localeCompare(b.title);
    }
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}
