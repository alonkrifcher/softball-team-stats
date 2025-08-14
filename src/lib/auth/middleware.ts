import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './index';
import { UserRole } from '@/types';

export function withAuth(handler: (request: NextRequest, payload: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return handler(request, payload);
  };
}

export function withRole(requiredRole: UserRole, handler: (request: NextRequest, payload: any) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, payload: any) => {
    const roleHierarchy: Record<UserRole, number> = {
      player: 1,
      coach: 2,
      manager: 3,
      admin: 4,
    };

    if (roleHierarchy[payload.role] < roleHierarchy[requiredRole]) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, payload);
  });
}