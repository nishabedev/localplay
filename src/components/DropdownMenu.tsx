import React, { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: MenuItem[];
  buttonClassName?: string;
  iconColor?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, buttonClassName = '', iconColor = 'white' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button - Three vertical dots */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-2 rounded-lg transition-colors ${buttonClassName}`}
        title="More options"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" style={{ fill: iconColor }}>
          <circle cx="10" cy="4" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                item.onClick();
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                item.danger
                  ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-600/20'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
