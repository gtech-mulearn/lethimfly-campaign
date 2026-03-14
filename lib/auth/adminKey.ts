import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the admin Authorization header against the ADMIN_SECRET_KEY env variable.
 * Returns a 401 NextResponse if invalid, or null if valid.
 */
export function validateAdminKey(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providedKey = authHeader.replace('Bearer ', '').trim();
  const serverKey = process.env.ADMIN_SECRET_KEY;

  if (!serverKey) {
    console.error('ADMIN_SECRET_KEY env variable is not set!');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (providedKey !== serverKey) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
  }

  return null; // null means valid
}
