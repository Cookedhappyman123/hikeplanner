import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_TRIP } from '../lib/hikePlanner.js';

const STORAGE_KEY = 'hikeplanner.trip.v1';

const TripContext = createContext(null);

function loadInitialTrip() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Corrupt or inaccessible storage — fall back to the mock demo trip.
  }
  return JSON.parse(JSON.stringify(DEFAULT_TRIP));
}

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadInitialTrip);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    } catch (e) {
      // Storage full/blocked (private browsing, etc.) — state still works
      // for this session, it just won't survive a reload.
    }
  }, [trip]);

  const value = useMemo(() => ({
    trip,
    setTrip,
    // Shallow-merges `patch` into trip.days[index]. Used by the day view
    // (direction/leg-mode/start-time toggles) and the accommodation
    // screen (saving a night's stay).
    updateDay(index, patch) {
      setTrip((prev) => {
        const days = prev.days.slice();
        days[index] = { ...days[index], ...patch };
        return { ...prev, days };
      });
    },
    resetTrip() {
      setTrip(JSON.parse(JSON.stringify(DEFAULT_TRIP)));
    }
  }), [trip]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip() must be used within a <TripProvider>');
  return ctx;
}
