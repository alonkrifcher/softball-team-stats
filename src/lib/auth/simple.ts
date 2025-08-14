import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './index';
import { UserRole } from '@/types';

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}

export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    player: 1,
    coach: 2,
    manager: 3,
    admin: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function createAuthError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}