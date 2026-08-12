import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface SearchablePatientItem {
  id: string;
  name: string;
  description?: string;
}

interface SearchablePatientPickerProps {
  label?: string;
  placeholder: string;
  query: string;
  items: SearchablePatientItem[];
  disabled?: boolean;
  allOptionLabel?: string;
  selectedId?: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: SearchablePatientItem | null) => void;
}

export function SearchablePatientPicker({
  label = "Paciente",
  placeholder,
  query,
  items,
  disabled = false,
  allOptionLabel,
  selectedId,
  onQueryChange,
  onSelect,
}: SearchablePatientPickerProps) {
  const [open, setOpen] = useState(false);
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) =>
      [item.name, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [items, query]);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-2xl bg-input-background pl-11"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-xl">
            {allOptionLabel && (
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent ${
                  !selectedId ? "bg-primary/10" : ""
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{allOptionLabel}</p>
                  <p className="text-xs text-muted-foreground">Mostrar todos los registros</p>
                </div>
              </button>
            )}

            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent ${
                    item.id === selectedId ? "bg-primary/10" : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{item.name}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                No encontramos pacientes con esa búsqueda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
