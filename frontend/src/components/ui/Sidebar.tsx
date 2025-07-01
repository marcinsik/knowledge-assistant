import { FileText, Plus, Settings, X } from 'lucide-react';
import React from 'react';
import '../../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeView, onViewChange }) => {
  const menuItems = [
    { id: 'all', label: 'Wszystkie notatki', icon: FileText },
    { id: 'add', label: 'Dodaj nową', icon: Plus },
    { id: 'settings', label: 'Ustawienia', icon: Settings }
  ];

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onToggle} />}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__inner">
          <div className="sidebar__header">
            <h1 className="sidebar__title">Asystent Wiedzy</h1>
            <button onClick={onToggle} className="sidebar__close">
              <X className="sidebar__close-icon" />
            </button>
          </div>
          <nav className="sidebar__nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`sidebar__nav-item${activeView === item.id ? ' sidebar__nav-item--active' : ''}`}
                >
                  <Icon className="sidebar__nav-icon" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
