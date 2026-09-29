import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search events by name, topic, or venue...',
}) => {
  return (
    <div className="search-bar-container">
      <Search className="search-icon" size={18} />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}

      <style>{`
        .search-bar-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 540px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--gray-400);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 2.75rem;
          border: 1.5px solid var(--gray-300);
          border-radius: var(--radius-full);
          background-color: #ffffff;
          font-size: 0.95rem;
          color: var(--navy-900);
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .search-clear-btn {
          position: absolute;
          right: 0.85rem;
          color: var(--gray-400);
          padding: 0.25rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-clear-btn:hover {
          color: var(--navy-900);
          background-color: var(--gray-100);
        }
      `}</style>
    </div>
  );
};
