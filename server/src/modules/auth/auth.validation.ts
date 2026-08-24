import type { RegisterDto, LoginDto } from './auth.types.js';

export interface ValidationError {
  field: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PUBLIC_ROLES = ['BUYER', 'FARMER', 'TRANSPORTER'] as const;

export function validateRegisterInput(data: Partial<RegisterDto>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Full name is required' });
  }

  // Email validation
  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  // Password validation (min 8 characters)
  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
    });
  }

  // Role validation: Enforce public roles only (Reject ADMIN explicitly on backend)
  if (!data.role) {
    errors.push({
      field: 'role',
      message: 'Role is required. Allowed roles: BUYER, FARMER, TRANSPORTER',
    });
  } else if ((data.role as string) === 'ADMIN') {
    errors.push({
      field: 'role',
      message: 'ADMIN role cannot be registered via public registration endpoint',
    });
  } else if (!ALLOWED_PUBLIC_ROLES.includes(data.role as (typeof ALLOWED_PUBLIC_ROLES)[number])) {
    errors.push({
      field: 'role',
      message: `Invalid role '${data.role}'. Allowed roles: BUYER, FARMER, TRANSPORTER`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLoginInput(data: Partial<LoginDto>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
