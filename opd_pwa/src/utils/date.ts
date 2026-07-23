import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString?: string, formatPattern: string = 'dd MMM yyyy'): string => {
  if (!dateString) return '';
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? format(parsed, formatPattern) : dateString;
  } catch {
    return dateString;
  }
};

export const formatTime = (timeString?: string): string => {
  if (!timeString) return '';
  return timeString;
};
