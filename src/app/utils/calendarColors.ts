export type CalendarModalityColors = {
  presencial: string;
  virtual: string;
};

export const defaultCalendarModalityColors: CalendarModalityColors = {
  presencial: "#4DB6AC",
  virtual: "#7E57C2",
};

export const calendarColorsChangedEvent = "mindcare-calendar-colors-changed";

function storageKey(userId?: string) {
  return `mindcare_calendar_colors_${userId || "default"}`;
}

function normalizeColors(value: Partial<CalendarModalityColors> | null | undefined): CalendarModalityColors {
  return {
    presencial: value?.presencial || defaultCalendarModalityColors.presencial,
    virtual: value?.virtual || defaultCalendarModalityColors.virtual,
  };
}

export function getCalendarModalityColors(userId?: string): CalendarModalityColors {
  if (typeof window === "undefined") return defaultCalendarModalityColors;

  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (!stored) return defaultCalendarModalityColors;
    return normalizeColors(JSON.parse(stored));
  } catch (error) {
    console.warn("Could not read calendar colors:", error);
    return defaultCalendarModalityColors;
  }
}

export function saveCalendarModalityColors(userId: string | undefined, colors: CalendarModalityColors) {
  if (typeof window === "undefined") return;

  const normalized = normalizeColors(colors);
  window.localStorage.setItem(storageKey(userId), JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(calendarColorsChangedEvent, { detail: { userId, colors: normalized } }));
}
