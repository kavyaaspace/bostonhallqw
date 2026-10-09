import React from 'react';
import { Search } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Costume Party',
  'Pub Crawl',
  'Haunted Cruise',
  'Ghost Tour'
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory
}) {
  return (
    <div className="filter-container">
      <div className="search-box">
        <Search size={18} color="var(--cream-muted)" />
        <input
          type="text"
          placeholder="Search by event name, neighborhood, or venue..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search events"
        />
      </div>

      <div className="category-chips" role="tablist" aria-label="Event categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
            role="tab"
            aria-selected={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
