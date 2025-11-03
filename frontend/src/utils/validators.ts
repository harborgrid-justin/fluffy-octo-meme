// Validation utility functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && cleaned.length === 10;
}

export function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function containsUpperCase(value: string): boolean {
  return /[A-Z]/.test(value);
}

export function containsLowerCase(value: string): boolean {
  return /[a-z]/.test(value);
}

export function containsNumber(value: string): boolean {
  return /\d/.test(value);
}

export function containsSpecialChar(value: string): boolean {
  return /[!@#$%^&*(),.?":{}|<>]/.test(value);
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    containsUpperCase(password) &&
    containsLowerCase(password) &&
    containsNumber(password) &&
    containsSpecialChar(password)
  );
}

export function isFutureDate(date: string | Date): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate > new Date();
}

export function isPastDate(date: string | Date): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  return inputDate < new Date();
}
