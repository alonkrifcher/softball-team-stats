import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    player: 1,
    coach: 2,
    manager: 3,
    admin: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canViewAllStats(userRole: UserRole): boolean {
  return ['admin', 'manager', 'coach'].includes(userRole);
}

export function canEnterStats(userRole: UserRole): boolean {
  return ['admin', 'manager'].includes(userRole);
}

export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'admin';
}

export function canManageRoster(userRole: UserRole): boolean {
  return ['admin', 'manager'].includes(userRole);
}