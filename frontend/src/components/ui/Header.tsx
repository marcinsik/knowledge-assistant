import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import React, { useRef } from 'react';
import '../../styles/Header.css';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, searchQuery, onSearchChange, isDarkMode, onThemeToggle, onSidebarToggle }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="header">
      <div className="header__row">
        <div className="header__left">
          <button onClick={onSidebarToggle} className="header__menu-btn">
            <Menu className="header__menu-icon" />
          </button>
          <h2 className="header__title">{title}</h2>
        </div>
        <div className="header__right">
          <div className="header__search">
            <Search className="header__search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Szukaj"
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                onSearchChange(newQuery);
              }}
              className="header__search-input"
            />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="header__search-clear">
              <X className="header__search-clear-icon" />
            </button>
          )}
        </div>
        <button onClick={onThemeToggle} className="header__theme-btn">
          {isDarkMode ? <Sun className="header__theme-icon" /> : <Moon className="header__theme-icon" />}
        </button>

      </div>
    </div>
  </header>
  );
};

export default Header;
