import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import type { Confidence, Quadrant, Sector, WorkflowStatus } from './types';
import { QUADRANT_LABELS, SECTOR_LABELS } from './types';

export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d');
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(new Date(dateStr), new Date());
}

export function formatSIS(sis: number): string {
  return sis.toFixed(1);
}

export function formatAxis(val: number): string {
  return val.toFixed(2);
}

export function formatQuadrant(q: Quadrant): string {
  return QUADRANT_LABELS[q];
}

export function formatSector(s: Sector): string {
  return SECTOR_LABELS[s];
}

export function formatConfidence(c: Confidence): string {
  switch (c) {
    case 'A': return 'High';
    case 'B': return 'Medium';
    case 'C': return 'Low';
  }
}

export function formatWorkflowStatus(s: WorkflowStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function formatLayer(l: 1|2|3): string {
  switch (l) {
    case 1: return 'Core';
    case 2: return 'Inner Circle';
    case 3: return 'Outer Ring';
  }
}
