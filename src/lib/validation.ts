import { z } from "zod";

/**
 * Centralized validation schemas for security hardening.
 * All user inputs must be validated before use.
 */

// Sanitize string: trim, remove control chars, limit length
export function sanitizeString(input: unknown, maxLength = 200): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove control chars
    .slice(0, maxLength);
}

// Sanitize HTML-sensitive content (prevent XSS in rendered text)
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Auth validation
export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(128, "Senha muito longa"),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  confirmPassword: z.string().max(128),
  telefone: z.string()
    .max(20, "Telefone muito longo")
    .regex(/^[\d\s()+-]*$/, "Telefone contém caracteres inválidos")
    .optional()
    .or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Test submission validation
export const testSubmissionSchema = z.object({
  respondentName: z.string().trim().min(1).max(200),
  respondentEmail: z.string().trim().email().max(255),
  testSlug: z.string().trim().min(1).max(50),
  scores: z.record(z.unknown()),
});

// Payment request validation
export const paymentRequestSchema = z.object({
  submissionId: z.string().uuid("ID de submissão inválido"),
});

export const subscriptionRequestSchema = z.object({
  planSlug: z.string().trim().min(1).max(50).regex(/^[a-z0-9-]+$/, "Plano inválido"),
});
