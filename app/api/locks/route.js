// app/api/locks/route.js
import { NextRequest } from 'next/server';

// Helper function to get user from token
function getUserFromToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const base64Url = token.split('.')[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
    
    return JSON.parse(atob(base64));
  } catch (err) {
    console.error('Token decode error:', err);
    return null;
  }
}

// GET /api/locks?vehicle_id=123 - Check locks for a vehicle
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    
    if (!vehicleId) {
      return Response.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    // Check for existing active locks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicleId}&status=eq.active&expires_at=gt.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': request.headers.get('authorization'),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check locks');
    }

    const locks = await response.json();
    
    return Response.json({ 
      locks,
      activeLockCount: locks.length
    });

  } catch (error) {
    console.error('Error checking locks:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/locks - Create a new lock
export async function POST(request) {
  try {
    const user = getUserFromToken(request.headers.get('authorization'));
    if (!user) {
      return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
    }

    const { vehicle_id, start_time, end_time } = await request.json();
    
    if (!vehicle_id || !start_time || !end_time) {
      return Response.json({ 
        error: 'vehicle_id, start_time, and end_time are required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check for existing active locks by other users
    const existingLocksResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicle_id}&status=eq.active&expires_at=gt.${new Date().toISOString()}&user_id=neq.${user.sub}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
        },
      }
    );

    if (!existingLocksResponse.ok) {
      throw new Error('Failed to check existing locks');
    }

    const existingLocks = await existingLocksResponse.json();
    
    if (existingLocks.length > 0) {
      return Response.json({ 
        error: 'Vehicle is currently locked by another user',
        locked_by_other: true,
        existing_locks: existingLocks
      }, { status: 409 });
    }

    // Check if user already has a lock for this vehicle
    const userLockResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicle_id}&user_id=eq.${user.sub}&status=eq.active&expires_at=gt.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
        },
      }
    );

    if (!userLockResponse.ok) {
      throw new Error('Failed to check user locks');
    }

    const userLocks = await userLockResponse.json();
    
    if (userLocks.length > 0) {
      // User already has a lock, return existing lock
      return Response.json({ 
        message: 'User already has an active lock for this vehicle',
        lock: userLocks[0],
        existing_lock: true
      });
    }

    // Create new lock (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const lockData = {
      vehicle_id,
      user_id: user.sub,
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
      session_id: crypto.randomUUID(),
      device_info: request.headers.get('user-agent') || 'unknown'
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/locks`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(lockData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create lock: ${error}`);
    }

    const newLock = await createResponse.json();
    
    return Response.json({ 
      message: 'Lock created successfully',
      lock: Array.isArray(newLock) ? newLock[0] : newLock
    });

  } catch (error) {
    console.error('Error creating lock:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/locks - Extend lock by 20 minutes
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request.headers.get('authorization'));
    if (!user) {
      return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
    }

    const { vehicle_id } = await request.json();
    
    if (!vehicle_id) {
      return Response.json({ 
        error: 'vehicle_id is required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // First, get the user's current lock
    const currentLockResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicle_id}&user_id=eq.${user.sub}&status=eq.active&expires_at=gt.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
        },
      }
    );

    if (!currentLockResponse.ok) {
      throw new Error('Failed to fetch current lock');
    }

    const currentLocks = await currentLockResponse.json();
    
    if (currentLocks.length === 0) {
      return Response.json({ 
        error: 'No active lock found for this user and vehicle',
        no_lock_found: true
      }, { status: 404 });
    }

    const currentLock = currentLocks[0];
    
    // Calculate new expiry time: current expires_at + 20 minutes
    const currentExpiresAt = new Date(currentLock.expires_at);
    const newExpiresAt = new Date(currentExpiresAt.getTime() + 20 * 60 * 1000); // Add 20 minutes

    // Update the lock with new expiry time
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/locks?id=eq.${currentLock.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          expires_at: newExpiresAt.toISOString()
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to extend lock: ${error}`);
    }

    const updatedLock = await updateResponse.json();
    
    return Response.json({ 
      message: 'Lock extended by 20 minutes',
      lock: Array.isArray(updatedLock) ? updatedLock[0] : updatedLock,
      extended: true,
      previous_expires_at: currentExpiresAt.toISOString(),
      new_expires_at: newExpiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error extending lock:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/locks?vehicle_id=123 - Remove lock for current user
export async function DELETE(request) {
  try {
    const user = getUserFromToken(request.headers.get('authorization'));
    if (!user) {
      return Response.json({ error: 'Invalid or missing authentication' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');
    
    if (!vehicleId) {
      return Response.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Remove user's lock for this vehicle
    const response = await fetch(
      `${supabaseUrl}/rest/v1/locks?vehicle_id=eq.${vehicleId}&user_id=eq.${user.sub}&status=eq.active`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${request.headers.get('authorization').split(' ')[1]}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to remove lock');
    }

    return Response.json({ message: 'Lock removed successfully' });

  } catch (error) {
    console.error('Error removing lock:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}