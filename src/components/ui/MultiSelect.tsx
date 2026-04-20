'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({ label, options, selected, onChange, placeholder, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const triggerLabel = (() => {
    if (selected.length === 0) return placeholder || `All ${label}`;
    if (selected.length === 1) {
      const opt = options.find(o => o.value === selected[0]);
      return opt?.label || selected[0];
    }
    return `${selected.length} ${label}`;
  })();

  const filteredOptions = search
    ? options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30 min-w-[140px]',
          selected.length > 0 && 'text-foreground font-medium'
        )}
      >
        <span className="truncate flex-1 text-left">{triggerLabel}</span>
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') clear(e as unknown as React.MouseEvent); }}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Clear"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[260px] bg-card rounded-lg border border-border shadow-lg overflow-hidden">
          {options.length > 8 && (
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-2 py-1.5 text-xs bg-muted rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-[280px] overflow-y-auto py-1">
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">No matches.</div>
            )}
            {filteredOptions.map(opt => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/60 transition-smooth',
                    isSelected && 'bg-muted/40'
                  )}
                >
                  <div className={cn(
                    'shrink-0 mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-smooth',
                    isSelected ? 'bg-accent border-accent' : 'border-border'
                  )}>
                    {isSelected && <Check size={11} className="text-accent-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{opt.label}</div>
                    {opt.sublabel && <div className="truncate text-[10px] text-muted-foreground mt-0.5">{opt.sublabel}</div>}
                  </div>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="px-2 py-1.5 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
