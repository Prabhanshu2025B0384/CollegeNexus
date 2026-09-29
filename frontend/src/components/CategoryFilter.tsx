import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const allCategories = ['All', ...categories.filter((c) => c !== 'All')];

  return (
    <div className="category-filter-wrapper">
      <div className="category-chips-list">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              className={`category-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <style>{`
        .category-filter-wrapper {
          overflow-x: auto;
          padding: 0.25rem 0 0.75rem;
          -webkit-overflow-scrolling: touch;
        }

        .category-chips-list {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .category-chip {
          padding: 0.45rem 0.95rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gray-600);
          background-color: #ffffff;
          border: 1px solid var(--gray-300);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .category-chip:hover {
          color: var(--navy-900);
          border-color: var(--gray-400);
          background-color: var(--gray-50);
        }

        .category-chip.active {
          color: #ffffff;
          background-color: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </div>
  );
};
