import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Email must be valid'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['buyer']).optional().default('buyer'),
});

export const loginSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(8, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email must be valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional(),
});
