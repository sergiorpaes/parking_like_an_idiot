
export interface BoundingBox {
  label: 'plate' | 'face';
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Report {
  id: string;
  timestamp: number;
  author: string; // The username of the vigilante who reported it
  location: { lat: number; lng: number } | null;
  imageUrl: string;
  headline: string;
  points: number;
  reasoning?: string;
  address?: string;
  mapsUrl?: string;
  userMessage?: string;
  venueName?: string;
  likes: number;
  isLikedByUser?: boolean;
  comments: Comment[];
  // New fields for rating system
  ratings: number[];
  averageRating: number;
  idiocyScore: number; // 0-100 AI score
  idiocyCategory?: string; // AI categorized type of violation
  isVehicle?: boolean; // AI validation status
  rejectionReason?: string;
  confidence?: number;
  status?: 'approved' | 'rejected';
}

export interface UserStats {
  username: string;
  specialty: string;
  totalPoints: number;
  level: number;
  rank: number;
  reportsCount: number;
  language: string;
  email: string;
  profilePicture?: string; // Base64 string of the user profile image
  linkedProvider?: 'google' | 'apple' | 'microsoft' | 'none';
  // Gamification tracking
  dailyPoints: number;
  lastActiveDate: string; // ISO date string YYYY-MM-DD
  missions: {
    validReportsToday: number;
    zonesThisWeek: string[];
  };
}

export type AppView = 'login' | 'onboarding' | 'home' | 'camera' | 'leaderboard' | 'rewards' | 'result' | 'profile';
