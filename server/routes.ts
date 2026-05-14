import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertTripSchema, insertTripStopSchema, insertExpenseSchema, expenseSplits as expenseSplitsTable } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Sanitize API key to remove any non-ASCII characters that cause ByteString errors
function sanitizeApiKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  // Remove any non-ASCII characters (keep only printable ASCII: 32-126)
  return key.replace(/[^\x20-\x7E]/g, '').trim();
}

// Top study abroad destinations with curated static data
const STUDY_ABROAD_DESTINATIONS = [
  { 
    name: 'Madrid, Spain', 
    country: 'Spain', 
    description: 'Spain\'s vibrant capital offers world-class art, lively nightlife, and rich cultural heritage. Perfect for students seeking to immerse in Spanish language and culture.',
    imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop',
    rating: 4.6,
    attractions: ['Prado Museum', 'Retiro Park', 'Royal Palace', 'Plaza Mayor', 'Gran Vía']
  },
  { 
    name: 'Paris, France', 
    country: 'France',
    description: 'The City of Light captivates with its iconic landmarks, world-renowned cuisine, and unparalleled artistic heritage. A dream destination for art and culture lovers.',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
    rating: 4.7,
    attractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Montmartre', 'Champs-Élysées']
  },
  { 
    name: 'London, United Kingdom', 
    country: 'United Kingdom',
    description: 'A global hub of history, culture, and innovation. London offers endless opportunities for learning, exploration, and career development.',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop',
    rating: 4.5,
    attractions: ['British Museum', 'Tower of London', 'Big Ben', 'Buckingham Palace', 'Hyde Park']
  },
  { 
    name: 'Barcelona, Spain', 
    country: 'Spain',
    description: 'Mediterranean beaches meet Gaudí\'s architectural masterpieces. Barcelona blends relaxed coastal living with vibrant urban culture.',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop',
    rating: 4.6,
    attractions: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter', 'Barceloneta Beach']
  },
  { 
    name: 'Rome, Italy', 
    country: 'Italy',
    description: 'The Eternal City where ancient history meets modern Italian life. Walk through millennia of civilization and savor authentic Italian cuisine.',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop',
    rating: 4.7,
    attractions: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum', 'Pantheon']
  },
  { 
    name: 'Florence, Italy', 
    country: 'Italy',
    description: 'The birthplace of the Renaissance, Florence is an open-air museum of art, architecture, and Italian culture. A must for art history students.',
    imageUrl: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=600&h=400&fit=crop',
    rating: 4.8,
    attractions: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Piazzale Michelangelo', 'Accademia Gallery']
  },
  { 
    name: 'Berlin, Germany', 
    country: 'Germany',
    description: 'A city defined by history and reinvention. Berlin\'s creative energy, diverse neighborhoods, and affordable living make it ideal for students.',
    imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop',
    rating: 4.5,
    attractions: ['Brandenburg Gate', 'Berlin Wall Memorial', 'Museum Island', 'Reichstag', 'East Side Gallery']
  },
  { 
    name: 'Amsterdam, Netherlands', 
    country: 'Netherlands',
    description: 'Canals, bikes, and a famously open culture. Amsterdam offers world-class universities and a welcoming international community.',
    imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop',
    rating: 4.6,
    attractions: ['Anne Frank House', 'Van Gogh Museum', 'Rijksmuseum', 'Vondelpark', 'Canal Ring']
  },
  { 
    name: 'Prague, Czech Republic', 
    country: 'Czech Republic',
    description: 'A fairy-tale city of Gothic spires and cobblestone streets. Prague offers rich history and affordable living for students.',
    imageUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&h=400&fit=crop',
    rating: 4.7,
    attractions: ['Charles Bridge', 'Prague Castle', 'Old Town Square', 'Astronomical Clock', 'Petřín Hill']
  },
  { 
    name: 'Dublin, Ireland', 
    country: 'Ireland',
    description: 'Friendly locals, literary heritage, and vibrant pub culture. Dublin is perfect for English-speaking students seeking a European adventure.',
    imageUrl: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=600&h=400&fit=crop',
    rating: 4.5,
    attractions: ['Trinity College', 'Temple Bar', 'Guinness Storehouse', 'St. Patrick\'s Cathedral', 'Phoenix Park']
  },
  { 
    name: 'Tokyo, Japan', 
    country: 'Japan',
    description: 'Ancient traditions blend with cutting-edge technology. Tokyo offers a completely unique cultural immersion for adventurous students.',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    rating: 4.8,
    attractions: ['Senso-ji Temple', 'Shibuya Crossing', 'Tokyo Tower', 'Meiji Shrine', 'Tsukiji Market']
  },
  { 
    name: 'Sydney, Australia', 
    country: 'Australia',
    description: 'Sun, surf, and world-class education. Sydney combines outdoor lifestyle with cosmopolitan culture in a stunning harbor setting.',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop',
    rating: 4.6,
    attractions: ['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach', 'Royal Botanic Garden', 'Taronga Zoo']
  },
];

interface PlacePhoto {
  name: string;
  widthPx?: number;
  heightPx?: number;
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: PlacePhoto[];
  editorialSummary?: { text: string };
  priceLevel?: string;
}

interface DestinationWithDetails {
  name: string;
  country: string;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  userRatingCount?: number;
  description?: string;
  attractions: Attraction[];
}

interface Attraction {
  id: string;
  name: string;
  type: string;
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string;
  address?: string;
}

async function getPlaceDetails(query: string, apiKey: string): Promise<PlaceResult | null> {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.editorialSummary',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      console.error(`Places API error for ${query}:`, response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.places?.[0] || null;
  } catch (error) {
    console.error(`Error fetching place details for ${query}:`, error);
    return null;
  }
}

async function getAttractions(city: string, apiKey: string): Promise<Attraction[]> {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.photos',
      },
      body: JSON.stringify({
        textQuery: `top tourist attractions in ${city}`,
        maxResultCount: 6,
      }),
    });

    if (!response.ok) {
      console.error(`Places API error for attractions in ${city}:`, response.status);
      return [];
    }

    const data = await response.json();
    const places: PlaceResult[] = data.places || [];

    return places.map((place) => ({
      id: place.id,
      name: place.displayName?.text || 'Unknown',
      type: formatPlaceType(place.types?.[0]),
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      photoUrl: place.photos?.[0] ? getPhotoUrl(place.photos[0].name) : undefined,
      address: place.formattedAddress,
    }));
  } catch (error) {
    console.error(`Error fetching attractions for ${city}:`, error);
    return [];
  }
}

function getPhotoUrl(photoName: string): string {
  // Return a proxied URL that doesn't expose the API key
  return `/api/places/photo?ref=${encodeURIComponent(photoName)}`;
}

function formatPlaceType(type?: string): string {
  if (!type) return 'Attraction';
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Generate static fallback data
function getStaticDestinations(): DestinationWithDetails[] {
  return STUDY_ABROAD_DESTINATIONS.map((dest, index) => ({
    name: dest.name,
    country: dest.country,
    placeId: `static-${index}`,
    photoUrl: dest.imageUrl,
    rating: dest.rating,
    userRatingCount: Math.floor(Math.random() * 50000) + 10000,
    description: dest.description,
    attractions: dest.attractions.map((name, i) => ({
      id: `attraction-${index}-${i}`,
      name,
      type: 'Tourist Attraction',
      rating: 4.3 + Math.random() * 0.6,
    })),
  }));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ===== TRIP API ENDPOINTS =====

  app.get('/api/trips', async (req: Request, res: Response) => {
    try {
      const allTrips = await storage.getTrips();
      const tripsWithOwners = await Promise.all(
        allTrips.map(async (trip) => {
          const owner = await storage.getUser(trip.userId);
          const members = await storage.getTripMembers(trip.id);
          return {
            ...trip,
            username: owner?.firstName
              ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}`
              : owner?.email || 'Unknown',
            memberCount: members.length,
          };
        })
      );
      res.json(tripsWithOwners);
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });

  app.get('/api/trips/:id', async (req: Request, res: Response) => {
    try {
      const trip = await storage.getTrip(parseInt(req.params.id));
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const owner = await storage.getUser(trip.userId);
      const members = await storage.getTripMembers(trip.id);
      const membersWithDetails = await Promise.all(
        members.map(async (m) => {
          const user = await storage.getUser(m.userId);
          return {
            ...m,
            name: user?.firstName
              ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
              : user?.email || 'Unknown',
            profileImageUrl: user?.profileImageUrl,
          };
        })
      );

      res.json({
        ...trip,
        username: owner?.firstName
          ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}`
          : owner?.email || 'Unknown',
        ownerProfileImage: owner?.profileImageUrl,
        members: membersWithDetails,
      });
    } catch (error) {
      console.error('Error fetching trip:', error);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  });

  app.post('/api/trips', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const parsed = insertTripSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid trip data', details: parsed.error.issues });
      }

      const trip = await storage.createTrip(parsed.data);
      res.status(201).json(trip);
    } catch (error) {
      console.error('Error creating trip:', error);
      res.status(500).json({ error: 'Failed to create trip' });
    }
  });

  app.delete('/api/trips/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const trip = await storage.getTrip(parseInt(req.params.id));
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      if (trip.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

      await storage.deleteTrip(trip.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting trip:', error);
      res.status(500).json({ error: 'Failed to delete trip' });
    }
  });

  // ===== INVITE LINK ENDPOINTS =====

  app.post('/api/trips/:id/invite-code', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      if (trip.userId !== userId) return res.status(403).json({ error: 'Only the trip owner can generate invite links' });

      const code = await storage.generateInviteCode(tripId);
      res.json({ inviteCode: code });
    } catch (error) {
      console.error('Error generating invite code:', error);
      res.status(500).json({ error: 'Failed to generate invite code' });
    }
  });

  app.get('/api/invite/:code', async (req: Request, res: Response) => {
    try {
      const trip = await storage.getTripByInviteCode(req.params.code);
      if (!trip) return res.status(404).json({ error: 'Invalid or expired invite link' });

      const owner = await storage.getUser(trip.userId);
      const members = await storage.getTripMembers(trip.id);
      res.json({
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        transportMode: trip.transportMode,
        description: trip.description,
        ownerName: owner?.firstName
          ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}`
          : owner?.email || 'Unknown',
        memberCount: members.length,
      });
    } catch (error) {
      console.error('Error fetching invite info:', error);
      res.status(500).json({ error: 'Failed to fetch invite info' });
    }
  });

  app.post('/api/invite/:code/accept', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const trip = await storage.getTripByInviteCode(req.params.code);
      if (!trip) return res.status(404).json({ error: 'Invalid or expired invite link' });

      if (trip.userId === userId) {
        return res.status(400).json({ error: 'You are already the owner of this trip' });
      }

      const existingMembers = await storage.getTripMembers(trip.id);
      const alreadyMember = existingMembers.some(m => m.userId === userId);
      if (alreadyMember) {
        return res.status(400).json({ error: 'You are already a member of this trip' });
      }

      const member = await storage.addTripMember(trip.id, userId, 'member');

      const pendingRequests = await storage.getJoinRequests(trip.id);
      const userPending = pendingRequests.find(r => r.userId === userId && r.status === 'pending');
      if (userPending) {
        await storage.updateJoinRequestStatus(userPending.id, 'approved');
      }

      res.status(201).json({ success: true, tripId: trip.id, member });
    } catch (error) {
      console.error('Error accepting invite:', error);
      res.status(500).json({ error: 'Failed to accept invite' });
    }
  });

  // ===== JOIN REQUEST ENDPOINTS =====

  app.post('/api/trips/:id/join', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      if (!trip.allowJoinRequests) return res.status(400).json({ error: 'This trip does not accept join requests' });
      if (trip.userId === userId) return res.status(400).json({ error: 'Cannot request to join your own trip' });

      const existingRequest = await storage.getJoinRequest(tripId, userId);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'You already have a pending request' });
      }

      const request = await storage.createJoinRequest(tripId, userId);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating join request:', error);
      res.status(500).json({ error: 'Failed to create join request' });
    }
  });

  app.get('/api/trips/:id/requests', async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      const requests = await storage.getJoinRequests(tripId);
      const requestsWithUsers = await Promise.all(
        requests.map(async (r) => {
          const user = await storage.getUser(r.userId);
          return {
            ...r,
            username: user?.firstName
              ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
              : user?.email || 'Unknown',
            profileImageUrl: user?.profileImageUrl,
          };
        })
      );
      res.json(requestsWithUsers);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      res.status(500).json({ error: 'Failed to fetch join requests' });
    }
  });

  app.patch('/api/join-requests/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { status } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected' });
      }

      const requestId = parseInt(req.params.id);

      const existingRequest = await storage.getJoinRequestById(requestId);
      if (!existingRequest) return res.status(404).json({ error: 'Request not found' });
      
      const trip = await storage.getTrip(existingRequest.tripId);
      if (!trip || trip.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to manage this request' });
      }

      const updatedRequest = await storage.updateJoinRequestStatus(requestId, status);
      if (!updatedRequest) return res.status(404).json({ error: 'Request not found' });

      if (status === 'approved') {
        await storage.addTripMember(updatedRequest.tripId, updatedRequest.userId);
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating join request:', error);
      res.status(500).json({ error: 'Failed to update join request' });
    }
  });

  app.get('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const pendingRequests = await storage.getPendingRequestsForOwner(userId);
      res.json(pendingRequests);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // ===== TRIP STOPS ENDPOINTS =====

  app.get('/api/trips/:id/stops', async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      const stops = await storage.getTripStops(tripId);
      res.json(stops);
    } catch (error) {
      console.error('Error fetching trip stops:', error);
      res.status(500).json({ error: 'Failed to fetch trip stops' });
    }
  });

  app.post('/api/trips/:id/stops', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId || 
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized to add stops to this trip' });

      const existingStops = await storage.getTripStops(tripId);
      const parsed = insertTripStopSchema.parse({
        ...req.body,
        tripId,
        sortOrder: existingStops.length,
      });

      const stop = await storage.createTripStop(parsed);
      res.status(201).json(stop);
    } catch (error) {
      console.error('Error creating trip stop:', error);
      res.status(500).json({ error: 'Failed to create trip stop' });
    }
  });

  app.patch('/api/trips/:tripId/stops/:stopId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const tripId = parseInt(req.params.tripId);
      const stopId = parseInt(req.params.stopId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId || 
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized' });

      const updateSchema = insertTripStopSchema.partial().omit({ tripId: true, sortOrder: true });
      const parsed = updateSchema.parse(req.body);
      const updated = await storage.updateTripStop(stopId, parsed);
      if (!updated) return res.status(404).json({ error: 'Stop not found' });
      res.json(updated);
    } catch (error) {
      console.error('Error updating trip stop:', error);
      res.status(500).json({ error: 'Failed to update trip stop' });
    }
  });

  app.delete('/api/trips/:tripId/stops/:stopId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const tripId = parseInt(req.params.tripId);
      const stopId = parseInt(req.params.stopId);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId || 
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized' });

      await storage.deleteTripStop(stopId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting trip stop:', error);
      res.status(500).json({ error: 'Failed to delete trip stop' });
    }
  });

  app.put('/api/trips/:id/stops/reorder', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId || 
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized' });

      const { stopIds } = req.body;
      if (!Array.isArray(stopIds) || !stopIds.every((id: unknown) => typeof id === 'number')) {
        return res.status(400).json({ error: 'stopIds must be an array of numbers' });
      }

      const existingStops = await storage.getTripStops(tripId);
      const existingIds = new Set(existingStops.map(s => s.id));
      const providedIds = new Set(stopIds as number[]);
      if (existingIds.size !== providedIds.size || !Array.from(existingIds).every(id => providedIds.has(id))) {
        return res.status(400).json({ error: 'stopIds must contain exactly all stop IDs for this trip' });
      }

      await storage.reorderTripStops(tripId, stopIds);
      const stops = await storage.getTripStops(tripId);
      res.json(stops);
    } catch (error) {
      console.error('Error reordering trip stops:', error);
      res.status(500).json({ error: 'Failed to reorder trip stops' });
    }
  });

  // ===== EXPENSE ENDPOINTS =====

  app.get('/api/trips/:id/expenses', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId ||
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized to view expenses for this trip' });

      const tripExpenses = await storage.getExpenses(tripId);
      const expensesWithDetails = await Promise.all(
        tripExpenses.map(async (expense) => {
          const paidByUser = await storage.getUser(expense.paidByUserId);
          const assignedToUser = expense.assignedToUserId ? await storage.getUser(expense.assignedToUserId) : null;
          const splits = await storage.getExpenseSplits(expense.id);
          const splitsWithUsers = await Promise.all(
            splits.map(async (split) => {
              const splitUser = await storage.getUser(split.userId);
              return {
                ...split,
                userName: splitUser?.firstName
                  ? `${splitUser.firstName}${splitUser.lastName ? ' ' + splitUser.lastName : ''}`
                  : splitUser?.email || 'Unknown',
              };
            })
          );
          return {
            ...expense,
            paidByName: paidByUser?.firstName
              ? `${paidByUser.firstName}${paidByUser.lastName ? ' ' + paidByUser.lastName : ''}`
              : paidByUser?.email || 'Unknown',
            paidByProfileImage: paidByUser?.profileImageUrl,
            assignedToName: assignedToUser
              ? (assignedToUser.firstName
                ? `${assignedToUser.firstName}${assignedToUser.lastName ? ' ' + assignedToUser.lastName : ''}`
                : assignedToUser.email || 'Unknown')
              : null,
            splits: splitsWithUsers,
          };
        })
      );
      res.json(expensesWithDetails);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  });

  app.post('/api/trips/:id/expenses', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId ||
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized to add expenses to this trip' });

      const { splitAmong, splitDetails: splitDetailsRaw, ...expenseBody } = req.body;

      const members = await storage.getTripMembers(tripId);
      const allMemberUserIds = Array.from(new Set([trip.userId, ...members.map(m => m.userId)]));

      if (expenseBody.paidByUserId && !allMemberUserIds.includes(expenseBody.paidByUserId)) {
        return res.status(400).json({ error: 'paidByUserId must be a valid trip member' });
      }
      const paidByUserId = expenseBody.paidByUserId || userId;

      const parsed = insertExpenseSchema.safeParse({ ...expenseBody, paidByUserId, tripId });
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid expense data', details: parsed.error.issues });
      }

      let splitUserIds: string[];
      if (Array.isArray(splitAmong) && splitAmong.length > 0) {
        splitUserIds = splitAmong.filter((id: string) => allMemberUserIds.includes(id));
        if (splitUserIds.length === 0) {
          return res.status(400).json({ error: 'splitAmong must include valid trip members' });
        }
      } else {
        splitUserIds = allMemberUserIds;
      }

      let splitDetails: { userId: string; amount: number }[] | undefined;
      if (Array.isArray(splitDetailsRaw) && splitDetailsRaw.length > 0) {
        splitDetails = (splitDetailsRaw as { userId: string; amount: number }[])
          .filter(s => allMemberUserIds.includes(s.userId) && typeof s.amount === 'number' && s.amount > 0);
        const splitTotal = splitDetails.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitTotal - parsed.data.amount) > 1) {
          return res.status(400).json({ error: 'Custom split amounts must sum to the total expense amount' });
        }
      }

      const expense = await storage.addExpense(parsed.data, splitUserIds, splitDetails);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  });

  app.patch('/api/expenses/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const expenseId = parseInt(req.params.id);
      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      const trip = await storage.getTrip(expense.tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      if (expense.paidByUserId !== userId && trip.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this expense' });
      }

      const { splitDetails: splitDetailsRaw, ...updateBody } = req.body;
      const updateSchema = insertExpenseSchema.partial().omit({ tripId: true, paidByUserId: true, splitType: true });
      const parsed = updateSchema.safeParse(updateBody);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid expense data', details: parsed.error.issues });
      }

      const newAmount = parsed.data.amount ?? expense.amount;

      let splitDetails: { userId: string; amount: number }[] | undefined;
      if (Array.isArray(splitDetailsRaw) && splitDetailsRaw.length > 0) {
        const members = await storage.getTripMembers(expense.tripId);
        const allMemberUserIds = Array.from(new Set([trip.userId, ...members.map(m => m.userId)]));
        splitDetails = (splitDetailsRaw as { userId: string; amount: number }[])
          .filter(s => allMemberUserIds.includes(s.userId) && typeof s.amount === 'number' && s.amount > 0);
        const splitTotal = splitDetails.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitTotal - newAmount) > 1) {
          return res.status(400).json({ error: 'Custom split amounts must sum to the total expense amount' });
        }
      }

      const updated = await storage.updateExpense(expenseId, parsed.data);
      if (!updated) return res.status(404).json({ error: 'Expense not found' });

      if (splitDetails || (parsed.data.amount !== undefined && parsed.data.amount !== expense.amount)) {
        await storage.recalculateExpenseSplits(expenseId, newAmount, splitDetails);
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const expenseId = parseInt(req.params.id);
      const expense = await storage.getExpense(expenseId);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      const trip = await storage.getTrip(expense.tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      if (expense.paidByUserId !== userId && trip.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this expense' });
      }

      await storage.deleteExpense(expenseId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  });

  app.patch('/api/expense-splits/:id/settle', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const splitId = parseInt(req.params.id);
      const { settled } = req.body;
      if (typeof settled !== 'boolean') {
        return res.status(400).json({ error: 'settled must be a boolean' });
      }

      const allExpenseSplits = await db.select().from(expenseSplitsTable).where(eq(expenseSplitsTable.id, splitId));
      if (allExpenseSplits.length === 0) return res.status(404).json({ error: 'Expense split not found' });
      const split = allExpenseSplits[0];

      const expense = await storage.getExpense(split.expenseId);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      const trip = await storage.getTrip(expense.tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId ||
        (await storage.getTripMembers(trip.id)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized to settle this split' });

      const updated = await storage.settleExpenseSplit(splitId, settled);
      if (!updated) return res.status(404).json({ error: 'Expense split not found' });
      res.json(updated);
    } catch (error) {
      console.error('Error settling expense split:', error);
      res.status(500).json({ error: 'Failed to settle expense split' });
    }
  });

  app.get('/api/trips/:id/balances', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const isMember = trip.userId === userId ||
        (await storage.getTripMembers(tripId)).some(m => m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not authorized to view balances for this trip' });

      const balances = await storage.getTripBalances(tripId);
      const balancesWithNames = await Promise.all(
        balances.map(async (b) => {
          const fromUser = await storage.getUser(b.from);
          const toUser = await storage.getUser(b.to);
          return {
            ...b,
            fromName: fromUser?.firstName
              ? `${fromUser.firstName}${fromUser.lastName ? ' ' + fromUser.lastName : ''}`
              : fromUser?.email || 'Unknown',
            toName: toUser?.firstName
              ? `${toUser.firstName}${toUser.lastName ? ' ' + toUser.lastName : ''}`
              : toUser?.email || 'Unknown',
          };
        })
      );
      res.json(balancesWithNames);
    } catch (error) {
      console.error('Error fetching balances:', error);
      res.status(500).json({ error: 'Failed to fetch balances' });
    }
  });

  // ===== SOCIAL FEED ENDPOINTS =====

  app.get('/api/feed/public', async (req: Request, res: Response) => {
    try {
      const publicTrips = await storage.getPublicTrips();
      const currentUserId = (req as any).user?.id;
      const tripIds = publicTrips.map(t => t.id);
      const [likeCounts, userLikedIds] = await Promise.all([
        storage.getTripLikeCountsBatch(tripIds),
        currentUserId ? storage.getUserLikedTripIds(currentUserId, tripIds) : Promise.resolve(new Set<number>()),
      ]);

      const tripsWithDetails = await Promise.all(
        publicTrips.map(async (trip) => {
          const owner = await storage.getUser(trip.userId);
          const members = await storage.getTripMembers(trip.id);
          return {
            ...trip,
            username: owner?.firstName
              ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}`
              : owner?.email || 'Unknown',
            ownerProfileImage: owner?.profileImageUrl,
            memberCount: members.length,
            likeCount: likeCounts[trip.id] || 0,
            isLiked: userLikedIds.has(trip.id),
          };
        })
      );
      res.json(tripsWithDetails);
    } catch (error) {
      console.error('Error fetching public feed:', error);
      res.status(500).json({ error: 'Failed to fetch public feed' });
    }
  });

  // ===== FOLLOW ENDPOINTS =====

  app.post('/api/users/:id/follow', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const followerId = (req.user as any)?.id;
      const followingId = req.params.id;
      if (!followerId) return res.status(401).json({ error: 'Unauthorized' });
      if (followerId === followingId) return res.status(400).json({ error: 'Cannot follow yourself' });

      const already = await storage.isFollowing(followerId, followingId);
      if (already) return res.status(400).json({ error: 'Already following this user' });

      const targetUser = await storage.getUser(followingId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });

      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json(follow);
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

  app.delete('/api/users/:id/follow', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const followerId = (req.user as any)?.id;
      const followingId = req.params.id;
      if (!followerId) return res.status(401).json({ error: 'Unauthorized' });

      await storage.unfollowUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  });

  app.get('/api/users/:id/followers', async (req: Request, res: Response) => {
    try {
      const followers = await storage.getFollowers(req.params.id);
      res.json(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ error: 'Failed to fetch followers' });
    }
  });

  app.get('/api/users/:id/following', async (req: Request, res: Response) => {
    try {
      const following = await storage.getFollowing(req.params.id);
      res.json(following);
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ error: 'Failed to fetch following' });
    }
  });

  app.get('/api/users/:id/follow-stats', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req as any).user?.id;
      const [followerCount, followingCount, isFollowing] = await Promise.all([
        storage.getFollowerCount(userId),
        storage.getFollowingCount(userId),
        currentUserId && currentUserId !== userId
          ? storage.isFollowing(currentUserId, userId)
          : Promise.resolve(false),
      ]);
      res.json({ followerCount, followingCount, isFollowing });
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      res.status(500).json({ error: 'Failed to fetch follow stats' });
    }
  });

  // ===== LIKE ENDPOINTS =====

  app.post('/api/trips/:id/like', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      const trip = await storage.getTrip(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });

      const alreadyLiked = await storage.isTripLikedByUser(tripId, userId);
      if (alreadyLiked) return res.status(400).json({ error: 'Already liked' });

      const like = await storage.likeTripByUser(tripId, userId);
      const likeCount = await storage.getTripLikeCount(tripId);
      res.status(201).json({ ...like, likeCount });
    } catch (error) {
      console.error('Error liking trip:', error);
      res.status(500).json({ error: 'Failed to like trip' });
    }
  });

  app.delete('/api/trips/:id/like', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const tripId = parseInt(req.params.id);
      await storage.unlikeTripByUser(tripId, userId);
      const likeCount = await storage.getTripLikeCount(tripId);
      res.json({ success: true, likeCount });
    } catch (error) {
      console.error('Error unliking trip:', error);
      res.status(500).json({ error: 'Failed to unlike trip' });
    }
  });

  app.get('/api/trips/:id/like-info', async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      const [likeCount, isLiked] = await Promise.all([
        storage.getTripLikeCount(tripId),
        currentUserId ? storage.isTripLikedByUser(tripId, currentUserId) : Promise.resolve(false),
      ]);
      res.json({ likeCount, isLiked });
    } catch (error) {
      console.error('Error fetching like info:', error);
      res.status(500).json({ error: 'Failed to fetch like info' });
    }
  });

  // ===== USER & SEARCH ENDPOINTS =====

  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.get('/api/users/:id/trips', async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req as any).user?.id;
      const userTrips = await storage.getTripsByUser(userId);
      const visibleTrips = currentUserId === userId
        ? userTrips
        : userTrips.filter(t => t.isPublic);
      
      const tripIds = visibleTrips.map(t => t.id);
      const [likeCounts, userLikedIds] = await Promise.all([
        storage.getTripLikeCountsBatch(tripIds),
        currentUserId ? storage.getUserLikedTripIds(currentUserId, tripIds) : Promise.resolve(new Set<number>()),
      ]);

      const tripsWithLikes = visibleTrips.map(trip => ({
        ...trip,
        likeCount: likeCounts[trip.id] || 0,
        isLiked: userLikedIds.has(trip.id),
      }));

      res.json(tripsWithLikes);
    } catch (error) {
      console.error('Error fetching user trips:', error);
      res.status(500).json({ error: 'Failed to fetch user trips' });
    }
  });

  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.json({ trips: [], users: [] });

      const [matchedTrips, matchedUsers] = await Promise.all([
        storage.searchTrips(query),
        storage.searchUsers(query),
      ]);

      const tripsWithOwners = await Promise.all(
        matchedTrips.map(async (trip) => {
          const owner = await storage.getUser(trip.userId);
          return {
            ...trip,
            username: owner?.firstName
              ? `${owner.firstName}${owner.lastName ? ' ' + owner.lastName : ''}`
              : owner?.email || 'Unknown',
          };
        })
      );

      res.json({ trips: tripsWithOwners, users: matchedUsers });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // ===== DESTINATIONS & PLACES API ENDPOINTS =====

  // Get all study abroad destinations with details
  app.get('/api/destinations', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      
      // If no API key or API fails, use static data
      if (!apiKey) {
        console.log('No Google Places API key configured, using static data');
        return res.json({ destinations: getStaticDestinations() });
      }

      // Try to fetch from Google Places API
      const destinations: DestinationWithDetails[] = [];
      let useStaticData = false;

      // Test API with first destination
      const testPlace = await getPlaceDetails(STUDY_ABROAD_DESTINATIONS[0].name, apiKey);
      if (!testPlace) {
        console.log('Google Places API not responding, using static data');
        return res.json({ destinations: getStaticDestinations() });
      }

      // Fetch details for each destination in parallel (limited batches)
      const batchSize = 4;
      for (let i = 0; i < STUDY_ABROAD_DESTINATIONS.length; i += batchSize) {
        const batch = STUDY_ABROAD_DESTINATIONS.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (dest) => {
            const placeDetails = await getPlaceDetails(dest.name, apiKey);
            const cityName = dest.name.split(',')[0];
            const attractions = await getAttractions(cityName, apiKey);
            
            return {
              name: dest.name,
              country: dest.country,
              placeId: placeDetails?.id,
              photoUrl: placeDetails?.photos?.[0] 
                ? getPhotoUrl(placeDetails.photos[0].name) 
                : undefined,
              rating: placeDetails?.rating,
              userRatingCount: placeDetails?.userRatingCount,
              description: placeDetails?.editorialSummary?.text,
              attractions,
            };
          })
        );
        destinations.push(...results);
      }

      res.json({ destinations });
    } catch (error) {
      console.error('Error fetching destinations:', error);
      // Fallback to static data on error
      res.json({ destinations: getStaticDestinations() });
    }
  });

  // Get single destination details with attractions
  app.get('/api/destinations/:city', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      const city = req.params.city;
      
      // Find in static data first
      const staticDest = STUDY_ABROAD_DESTINATIONS.find(
        d => d.name.toLowerCase().includes(city.toLowerCase())
      );
      
      if (!apiKey) {
        if (staticDest) {
          const staticIndex = STUDY_ABROAD_DESTINATIONS.indexOf(staticDest);
          return res.json({
            name: staticDest.name,
            placeId: `static-${staticIndex}`,
            photoUrl: staticDest.imageUrl,
            rating: staticDest.rating,
            userRatingCount: Math.floor(Math.random() * 50000) + 10000,
            description: staticDest.description,
            address: staticDest.name,
            attractions: staticDest.attractions.map((name, i) => ({
              id: `attraction-${staticIndex}-${i}`,
              name,
              type: 'Tourist Attraction',
              rating: 4.3 + Math.random() * 0.6,
            })),
          });
        }
        return res.status(404).json({ error: 'Destination not found' });
      }

      const placeDetails = await getPlaceDetails(city, apiKey);
      const attractions = await getAttractions(city, apiKey);

      if (!placeDetails) {
        // Fallback to static data
        if (staticDest) {
          const staticIndex = STUDY_ABROAD_DESTINATIONS.indexOf(staticDest);
          return res.json({
            name: staticDest.name,
            placeId: `static-${staticIndex}`,
            photoUrl: staticDest.imageUrl,
            rating: staticDest.rating,
            userRatingCount: Math.floor(Math.random() * 50000) + 10000,
            description: staticDest.description,
            address: staticDest.name,
            attractions: staticDest.attractions.map((name, i) => ({
              id: `attraction-${staticIndex}-${i}`,
              name,
              type: 'Tourist Attraction',
              rating: 4.3 + Math.random() * 0.6,
            })),
          });
        }
        return res.status(404).json({ error: 'Destination not found' });
      }

      res.json({
        name: placeDetails.displayName?.text || city,
        placeId: placeDetails.id,
        photoUrl: placeDetails.photos?.[0] 
          ? getPhotoUrl(placeDetails.photos[0].name) 
          : undefined,
        rating: placeDetails.rating,
        userRatingCount: placeDetails.userRatingCount,
        description: placeDetails.editorialSummary?.text,
        address: placeDetails.formattedAddress,
        attractions,
      });
    } catch (error) {
      console.error('Error fetching destination details:', error);
      res.status(500).json({ error: 'Failed to fetch destination details' });
    }
  });

  // Places autocomplete endpoint
  app.get('/api/places/autocomplete', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      const { input, types } = req.query;

      if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Input query required' });
      }

      if (!apiKey) {
        return res.status(503).json({ error: 'Places API not configured' });
      }

      // Build request body for new Places API
      const requestBody: {
        input: string;
        includedPrimaryTypes?: string[];
      } = {
        input: input,
      };

      // Map type filter to Places API types
      if (types && typeof types === 'string') {
        const typeMap: Record<string, string[]> = {
          'destination': ['locality', 'sublocality', 'administrative_area_level_1', 'country'],
          'hotel': ['lodging', 'hotel'],
          'restaurant': ['restaurant', 'cafe', 'bar', 'food'],
          'attraction': ['tourist_attraction', 'museum', 'park', 'amusement_park', 'art_gallery', 'zoo', 'aquarium'],
          'all': [],
        };
        if (typeMap[types] && typeMap[types].length > 0) {
          requestBody.includedPrimaryTypes = typeMap[types];
        }
      }

      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Places Autocomplete API error:', response.status, await response.text());
        return res.status(500).json({ error: 'Failed to fetch autocomplete results' });
      }

      const data = await response.json();
      
      // Transform to simpler format for frontend
      const suggestions = (data.suggestions || []).map((suggestion: any) => ({
        placeId: suggestion.placePrediction?.placeId || '',
        mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text || '',
        secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
        description: suggestion.placePrediction?.text?.text || '',
        types: suggestion.placePrediction?.types || [],
      }));

      res.json({ suggestions });
    } catch (error) {
      console.error('Error in autocomplete:', error);
      res.status(500).json({ error: 'Failed to fetch autocomplete results' });
    }
  });

  // Search places by text query
  app.get('/api/places/search', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      const { query, types, location, radius } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query required' });
      }

      if (!apiKey) {
        return res.status(503).json({ error: 'Places API not configured' });
      }

      const requestBody: any = {
        textQuery: query,
        maxResultCount: 20,
      };

      // Add type filter
      if (types && typeof types === 'string' && types !== 'all') {
        const typeMap: Record<string, string[]> = {
          'hotel': ['lodging', 'hotel'],
          'restaurant': ['restaurant', 'cafe', 'bar', 'food'],
          'attraction': ['tourist_attraction', 'museum', 'park', 'amusement_park', 'art_gallery'],
        };
        if (typeMap[types]) {
          requestBody.includedType = typeMap[types][0];
        }
      }

      // Add location bias if provided
      if (location && typeof location === 'string') {
        const [lat, lng] = location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          requestBody.locationBias = {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: parseInt(radius as string) || 50000,
            },
          };
        }
      }

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.photos,places.priceLevel,places.location',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('Places Search API error:', response.status, await response.text());
        return res.status(500).json({ error: 'Failed to search places' });
      }

      const data = await response.json();
      
      const places = (data.places || []).map((place: PlaceResult) => ({
        id: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        photoUrl: place.photos?.[0]?.name ? getPhotoUrl(place.photos[0].name) : null,
        types: place.types || [],
        priceLevel: place.priceLevel,
      }));

      res.json({ places });
    } catch (error) {
      console.error('Error searching places:', error);
      res.status(500).json({ error: 'Failed to search places' });
    }
  });

  // Proxy for place photos (to hide API key)
  app.get('/api/places/photo', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      const { ref } = req.query;

      if (!ref || typeof ref !== 'string') {
        return res.status(400).json({ error: 'Photo reference required' });
      }

      if (!apiKey) {
        return res.status(503).json({ error: 'Places API not configured' });
      }

      const photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`;
      
      const response = await fetch(photoUrl);
      
      if (!response.ok) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      // Get content type and pipe the image
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error fetching photo:', error);
      res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });

  // Get place details by place ID
  app.get('/api/places/:placeId', async (req: Request, res: Response) => {
    try {
      const apiKey = sanitizeApiKey(process.env.GOOGLE_PLACES_API_KEY);
      const { placeId } = req.params;

      if (!apiKey) {
        return res.status(503).json({ error: 'Places API not configured' });
      }

      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,photos,editorialSummary,types,priceLevel,websiteUri,nationalPhoneNumber,regularOpeningHours,location',
        },
      });

      if (!response.ok) {
        console.error('Places Details API error:', response.status, await response.text());
        return res.status(500).json({ error: 'Failed to fetch place details' });
      }

      const place = await response.json();
      
      res.json({
        id: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        photoUrl: place.photos?.[0]?.name ? getPhotoUrl(place.photos[0].name) : null,
        photos: (place.photos || []).slice(0, 5).map((p: any) => getPhotoUrl(p.name)),
        description: place.editorialSummary?.text || '',
        types: place.types || [],
        priceLevel: place.priceLevel,
        website: place.websiteUri,
        phone: place.nationalPhoneNumber,
        openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
        location: place.location,
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      res.status(500).json({ error: 'Failed to fetch place details' });
    }
  });

  return httpServer;
}
