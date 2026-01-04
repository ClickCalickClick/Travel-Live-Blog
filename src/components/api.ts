import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cf1072ab`;

export interface Location {
  lat: number;
  lng: number;
  label: string;
  timestamp: string;
}

export interface BlogPost {
  id: string;
  text: string;
  imageUrl: string | null;
  imageUrls?: string[];  // Multiple images support
  location: string;
  timestamp: string;
  lat?: number;  // Location coordinates
  lng?: number;
  nextEvent?: string;  // What's happening next
  type?: string;
}

export interface TripStop {
  stopIndex: number;
  stopName: string;
  timestamp: string;
}

let adminPassword = '';

export const setAdminPassword = (password: string) => {
  adminPassword = password;
};

// Verify admin password with backend
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
        'x-admin-password': password
      }
    });

    if (response.ok) {
      setAdminPassword(password);
      return true;
    }

    // Log detailed error from backend
    const errorData = await response.json();
    console.error('Password verification failed:', errorData);

    return false;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Get current location
export async function getCurrentLocation(): Promise<Location | null> {
  try {
    const response = await fetch(`${API_BASE}/location`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });
    const data = await response.json();
    return data.location;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// Update location
export async function updateLocation(lat: number, lng: number, label: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({ lat, lng, label }),
    });
    if (!response.ok) {
      throw new Error('Failed to update location');
    }
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// Get all blog posts
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_BASE}/blog`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Create blog post
export async function createBlogPost(text: string, image: File | null, location: string): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('location', location);
    if (image) {
      formData.append('image', image);
    }

    const response = await fetch(`${API_BASE}/blog`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        'x-admin-password': adminPassword
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create blog post');
    }
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

// Get current trip stop
export async function getCurrentStop(): Promise<TripStop | null> {
  try {
    const response = await fetch(`${API_BASE}/trip/stop`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    });
    const data = await response.json();
    return data.stop;
  } catch (error) {
    console.error('Error fetching trip stop:', error);
    return null;
  }
}

// Update trip stop
export async function updateTripStop(stopIndex: number, stopName: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/trip/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({ stopIndex, stopName }),
    });
    if (!response.ok) {
      throw new Error('Failed to update trip stop');
    }
  } catch (error) {
    console.error('Error updating trip stop:', error);
    throw error;
  }
}