export type WorkingHours = {
  start: string;
  end: string;
};

export const defaultWorkingHours: WorkingHours = {
  start: "08:00",
  end: "20:00",
};

export const workingHoursChangedEvent = "mindcare-working-hours-changed";

function storageKey(userId?: string) {
  return `mindcare_working_hours_${userId || "default"}`;
}

const defaultStorageKey = storageKey();

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeWorkingHours(value: Partial<WorkingHours> | null | undefined): WorkingHours {
  const start = normalizeTimeValue(value?.start) || defaultWorkingHours.start;
  const end = normalizeTimeValue(value?.end) || defaultWorkingHours.end;
  return timeToMinutes(end) > timeToMinutes(start)
    ? { start, end }
    : defaultWorkingHours;
}

export function normalizeTimeValue(value?: string | null) {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function getWorkingHours(userId?: string): WorkingHours {
  if (typeof window === "undefined") return defaultWorkingHours;

  try {
    const stored = window.localStorage.getItem(storageKey(userId)) || window.localStorage.getItem(defaultStorageKey);
    if (!stored) return defaultWorkingHours;
    return normalizeWorkingHours(JSON.parse(stored));
  } catch (error) {
    console.warn("Could not read working hours:", error);
    return defaultWorkingHours;
  }
}

export function saveWorkingHours(userId: string | undefined, value: WorkingHours) {
  if (typeof window === "undefined") return;

  const normalized = normalizeWorkingHours(value);
  window.localStorage.setItem(storageKey(userId), JSON.stringify(normalized));
  window.localStorage.setItem(defaultStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(workingHoursChangedEvent, { detail: { userId, workingHours: normalized } }));
}

export function isWithinWorkingHours(startTime: string, endTime: string, workingHours: WorkingHours) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const workStart = timeToMinutes(workingHours.start);
  const workEnd = timeToMinutes(workingHours.end);
  return end > start && start >= workStart && end <= workEnd;
}

export function getCalendarHours(workingHours: WorkingHours) {
  const start = Math.floor(timeToMinutes(workingHours.start) / 60);
  const end = Math.ceil(timeToMinutes(workingHours.end) / 60);
  const length = Math.max(1, end - start);
  return Array.from({ length }, (_, index) => start + index);
}

export function getAppointmentTimeSlots(workingHours: WorkingHours, stepMinutes = 5) {
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);
  const slots: string[] = [];

  for (let minutes = start; minutes <= end; minutes += stepMinutes) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}
