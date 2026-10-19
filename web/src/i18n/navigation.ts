import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware drop-ins for next/link, next/navigation's router/pathname.
// Use these (not the plain next/* versions) in components that are
// translated, so navigation preserves the active locale.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
