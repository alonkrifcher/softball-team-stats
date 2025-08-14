import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './index';
import { UserRole } from '@/types';

export async function authenticate(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: 'Invalid token', status: 401 };
  }

  return { payload };
}

export function checkRole(userRole: UserRole, requiredRole: UserRole) {
  const roleHierarchy: Record<UserRole, number> = {
    player: 1,
    coach: 2,
    manager: 3,
    admin: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function withAuth(handler: (request: NextRequest, payload: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await authenticate(request);
    
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    return handler(request, auth.payload);
  };
}

export function withRole(requiredRole: UserRole, handler: (request: NextRequest, payload: any) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, payload: any) => {
    if (!checkRole(payload.role, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, payload);
  });
}