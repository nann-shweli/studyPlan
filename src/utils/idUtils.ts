/**
 * Generates a lightweight pseudo-unique ID.
 * Good enough for offline-first MVP (no network collisions).
 */
export const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};
