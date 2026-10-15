import { z } from 'zod';

const cleanPhone = (v: string) => v.replace(/[\s\-().]/g, '');

export const phoneField = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((v) => /^\+?[0-9]{10,15}$/.test(cleanPhone(v)), 'Enter a valid phone number (10-15 digits)');

export const emailField = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');

export const passwordField = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'At most 72 characters')
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), 'Use letters and numbers');

export const moneyField = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .refine((v) => /^\d{1,8}(\.\d{1,2})?$/.test(v), 'Enter a valid amount');

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name'),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const otpSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') });

export const forgotSchema = z.object({ identifier: z.string().trim().min(3, 'Enter your email or phone number') });

export const resetSchema = z
  .object({ newPassword: passwordField, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, 'Required'), newPassword: passwordField, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: emailField,
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?[0-9]{10,15}$/.test(cleanPhone(v)), 'Enter a valid phone number')
    .optional(),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
});

export const memberSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name'),
  phone: phoneField,
  email: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email address'),
  joinedOn: z.string().min(1, 'Choose the joining date'),
  planId: z.string(),
  monthlyFee: moneyField,
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const markPaidSchema = z.object({
  paymentDate: z.string().min(1, 'Choose the payment date'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'OTHER']),
  reference: z.string().trim().max(100).optional(),
  note: z.string().trim().max(500).optional(),
});
