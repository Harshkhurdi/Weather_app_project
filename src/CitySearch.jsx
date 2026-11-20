import React, { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './icons';
import { findCities, placeLabel, POPULAR_CITIES, localMatches } from './weather';

export default function CitySearch({ onSelect, controlRef }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(-1);
  const [response, setResponse] = useState(null);
  const root = useRef(null);
  const input = controlRef;
  const listId = useId();
  const term = query.trim();
  const ready = response?.term === term;
  const fallback = term ? localMatches(term) : POPULAR_CITIES.slice(0, 5);
  const options = ready && response.options.length ? response.options : fallback;
  const waiting = term.length >= 2 && !ready;

  useEffect(() => {
    function shortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
    }
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setExpanded(false);
    }
    document.addEventListener('keydown', shortcut);
    document.addEventListener('pointerdown', dismiss);
    return () => {
      document.removeEventListener('keydown', shortcut);
      document.removeEventListener('pointerdown', dismiss);
    };
  }, []);

  useEffect(() => {
    if (!expanded || term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await findCities(term, controller.signal);
        if (controller.signal.aborted) return;
        setResponse({ term, options: results });
        setActive(-1);
      } catch {
        if (!controller.signal.aborted) setResponse({ term, options: [], failed: true });
      }
    }, 260);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, expanded]);

  useEffect(() => {
    if (expanded && active >= 0) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, expanded, listId]);

  function select(city) {
    onSelect(city);
    setQuery('');
    setActive(-1);
    setExpanded(false);
  }

  function handleKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setExpanded(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setExpanded(true);
      if (!options.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive(index => index < 0 && step < 0 ? options.length - 1 : (index + step + options.length) % options.length);
    } else if (event.key === 'Enter' && expanded && options.length) {
      event.preventDefault();
      select(options[active] ?? options[0]);
    }
  }

  return (
    <div ref={root} className="city-search" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
    }}>
      <div className="search-field">
        <Icon name="search" size={19} />
        <input ref={input} value={query} onChange={event => {
          setQuery(event.target.value);
          setResponse(null);
          setActive(-1);
          setExpanded(true);
        }} onFocus={() => { setExpanded(true); setActive(-1); }} onClick={() => setExpanded(true)} onKeyDown={handleKey}
          placeholder="Search city or postcode" aria-label="Search city or postcode" autoComplete="off" spellCheck="false"
          role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && active >= 0 && options[active] ? `${listId}-${active}` : undefined} />
        {query ? (
          <button type="button" className="clear-query" aria-label="Clear search" onClick={() => {
            setQuery(''); setActive(-1); input.current?.focus();
          }}><Icon name="close" size={15} /></button>
        ) : <kbd aria-hidden="true">{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'} K</kbd>}
      </div>
      {expanded && (
        <div className="search-results">
          <p className="search-label" aria-live="polite">
            {!term ? 'Popular locations' : waiting ? 'Searching…' : ready && response.failed ? 'Online search unavailable' : options.length ? 'Matching locations' : term.length < 2 ? 'Enter at least two characters' : 'No locations found'}
          </p>
          <ul id={listId} role="listbox" aria-label="Locations">
            {options.map((city, index) => (
              <li key={city.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}
                onMouseDown={event => event.preventDefault()} onClick={() => select(city)}>
                <Icon name="pin" size={17} />
                <span><b>{city.name}</b><small>{placeLabel(city)}</small></span>
                <Icon name="right" size={16} className="search-result-arrow" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
