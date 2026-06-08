import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * A premium, glassmorphic replacement for the native HTML <select> element.
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Callback fired when value changes
 * @param {Array} props.options - Array of { value, label } or strings
 * @param {string} props.placeholder - Text when no value is selected
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.className - Additional classes for the trigger
 * @param {boolean} props.required - Validation flag
 */
const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select option...', 
  disabled = false,
  className = '',
  required = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setSearchTerm('');
  }, [isOpen]);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  const filteredOptions = normalizedOptions.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val) => {
    if (disabled) return;
    onChange({ target: { value: val } }); // Mock native event for compatibility
    setIsOpen(false);
  };

  return (
    <div className={`relative ${isOpen ? 'z-[90]' : 'z-10'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full
          bg-white/60 backdrop-blur-xl border border-white/40
          rounded-2xl px-4 py-3 text-sm font-bold text-gray-700
          shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-lg
          transition-all duration-300 focus:ring-2 focus:ring-blue-500/50
          ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-200' : ''}
          ${className}
        `}
      >
        <span className={!selectedOption ? 'text-gray-400 font-medium' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-200">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 text-center">
                No Options
              </li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  className={`
                    flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer
                    text-sm font-bold transition-all duration-200
                    ${opt.disabled 
                      ? 'opacity-30 cursor-not-allowed grayscale' 
                      : value === opt.value 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check size={14} className="text-blue-500 flex-shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Hidden input for native form validation if required */}
      {required && (
        <input 
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0 }}
          value={value || ''}
          required={required}
          readOnly
        />
      )}
    </div>
  );
};

export default CustomSelect;
