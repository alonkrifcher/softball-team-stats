import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { getAuthUser, hasRequiredRole, createAuthError } from '@/lib/auth/simple';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return createAuthError('Authentication required', 401);
    }

    if (!hasRequiredRole(user.role, 'admin')) {
      return createAuthError('Only admins can create player login', 403);
    }

    // Check if player login already exists
    const existingPlayer = await db.execute(sql`
      SELECT id FROM users WHERE email = 'player@uhj.com'
    `);

    if (existingPlayer.length > 0) {
      return NextResponse.json({ 
        message: 'Player login already exists', 
        credentials: { email: 'player@uhj.com', password: 'uhj2025' }
      });
    }

    // Create the shared player login
    const passwordHash = await bcrypt.hash('uhj2025', 12);
    
    const result = await db.execute(sql`
      INSERT INTO users (
        email, 
        password_hash, 
        role, 
        first_name, 
        last_name, 
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'player@uhj.com',
        ${passwordHash},
        'player',
        'Team',
        'Player',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, role
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Player login created successfully',
      user: result[0],
      credentials: {
        email: 'player@uhj.com',
        password: 'uhj2025'
      }
    });

  } catch (error) {
    console.error('Create player login error:', error);
    return NextResponse.json(
      { error: 'Failed to create player login' },
      { status: 500 }
    );
  }
}