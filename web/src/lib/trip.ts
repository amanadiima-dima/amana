import { Plane, Train, Bus, Car, Ship, type LucideIcon } from 'lucide-react';

export interface TransportModeMeta {
  value: 'PLANE' | 'TRAIN' | 'BUS' | 'CAR' | 'BOAT';
  label: string;
  icon: LucideIcon;
  emoji: string;
}

export const TRANSPORT_MODES: TransportModeMeta[] = [
  { value: 'PLANE', label: 'Plane', icon: Plane, emoji: '✈️' },
  { value: 'TRAIN', label: 'Train', icon: Train, emoji: '🚆' },
  { value: 'BUS', label: 'Bus', icon: Bus, emoji: '🚌' },
  { value: 'CAR', label: 'Car', icon: Car, emoji: '🚗' },
  { value: 'BOAT', label: 'Boat', icon: Ship, emoji: '⛴️' },
];

export const modeMeta = (m?: string | null): TransportModeMeta =>
  TRANSPORT_MODES.find((x) => x.value === m) ?? TRANSPORT_MODES[0];

/** Minutes → "5h 30m" / "45m" / "2h". Returns null for missing/zero. */
export function formatDuration(mins?: number | null): string | null {
  if (mins == null || Number.isNaN(mins) || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
