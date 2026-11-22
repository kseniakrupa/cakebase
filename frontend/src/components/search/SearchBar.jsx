import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpRight, CornerDownLeft } from 'lucide-react';
import { getSuggestions } from '../../services/search';
import { normalize } from '../../utils/text';

export default function SearchBar({
  initialValue = '',
  size = 'default',
  placeholder = 'Торт, рецепт или техника…',
  autoFocus = false,
  onSubmitted,
  onClose,
  showSuggestions = true,
  className = '',
}) {
  const [value, setValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const listId = useId();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (autoFocus) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [autoFocus]);

  useEffect(() => {
    const handler = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = useMemo(() => {
    if (!showSuggestions || !focused) return [];
    return getSuggestions(value, 8);
  }, [value, focused, showSuggestions]);

  const open = focused && suggestions.length > 0;
  const normalizedValue = normalize(value);

  const submit = (query) => {
    const cleaned = query.trim();
    if (!cleaned) return;
    setFocused(false);
    setActiveIndex(-1);
    navigate(`/search?q=${encodeURIComponent(cleaned)}`);
    onSubmitted?.(cleaned);
    onClose?.();
  };

  const choose = (suggestion) => {
    setFocused(false);
    setActiveIndex(-1);
    navigate(suggestion.url);
    onSubmitted?.(suggestion.label);
    onClose?.();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setFocused(true);
        return;
      }
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return;
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        choose(suggestions[activeIndex]);
      } else {
        submit(value);
      }
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        setFocused(false);
        setActiveIndex(-1);
      } else {
        onClose?.();
      }
    }
  };

  return (
    <div
      className={`search-bar search-bar--${size} ${open ? 'is-open' : ''} ${className}`.trim()}
      ref={wrapperRef}
    >
      <form
        className="search-bar__form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <Search size={size === 'large' ? 22 : 18} aria-hidden="true" className="search-bar__icon" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Поиск по базе знаний"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={() => {
              setValue('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Очистить запрос"
          >
            ×
          </button>
        )}
        <button type="submit" className="search-bar__submit">
          <span>Найти</span>
          <CornerDownLeft size={15} aria-hidden="true" />
        </button>
      </form>

      {open && (
        <div className="search-suggestions" id={listId} role="listbox" aria-label="Поисковые подсказки">
          {!normalizedValue && <p className="search-suggestions__label">Популярное сейчас</p>}
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.type}-${suggestion.label}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={`search-suggestion${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(suggestion)}
                >
                  <span className="search-suggestion__main">
                    <span className="search-suggestion__label">{suggestion.label}</span>
                    <span className="search-suggestion__meta">
                      <span className={`search-suggestion__type type-dot type-dot--${suggestion.type}`} />
                      {suggestion.typeLabel}
                      {suggestion.detail ? ` · ${suggestion.detail}` : ''}
                    </span>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="search-suggestions__hint">
            <kbd>↑</kbd><kbd>↓</kbd> — навигация, <kbd>Enter</kbd> — перейти
          </p>
        </div>
      )}
    </div>
  );
}
