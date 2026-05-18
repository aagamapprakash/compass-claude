import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FilterBar, { type FilterOption } from '@/components/FilterBar';
import TripCard, { type Trip } from '@/components/TripCard';
import { getStatusFromDates } from '@/components/StatusBadge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { NeonButton } from '@/components/ui/neon-button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Compass, MapPin, Search, Star, Users, GraduationCap, Plane, ChevronRight, Globe } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface FeedTrip extends Trip {
  likeCount: number;
  isLiked: boolean;
  ownerProfileImage?: string;
  memberCount?: number;
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

interface Destination {
  name: string;
  country: string;
  placeId?: string;
  photoUrl?: string;
  rating?: number;
  userRatingCount?: number;
  description?: string;
  attractions: Attraction[];
}

interface DestinationsResponse {
  destinations: Destination[];
}

function DestinationCard({ destination }: { destination: Destination }) {
  const cityName = destination.name.split(',')[0];
  const destinationUrl = `/destination/${encodeURIComponent(cityName)}`;
  
  return (
    <Link href={destinationUrl} data-testid={`card-destination-${cityName.toLowerCase().replace(/\s+/g, '-')}`}>
      <SpotlightCard glowColor="gold" className="overflow-hidden group cursor-pointer">
        <div className="relative h-48 -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px] overflow-hidden">
          {destination.photoUrl ? (
            <img 
              src={destination.photoUrl} 
              alt={destination.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-compass-navy to-compass-maroon flex items-center justify-center">
              <MapPin className="h-12 w-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {destination.rating && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-compass-navy border-0 gap-1">
                <Star className="h-3 w-3 fill-compass-gold text-compass-gold" />
                {destination.rating.toFixed(1)}
              </Badge>
            </div>
          )}
          
          <div className="absolute top-3 left-3">
            <Badge className="bg-compass-navy/80 text-white border-0 backdrop-blur-sm">
              {destination.country}
            </Badge>
          </div>
          
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-2xl font-serif font-bold text-white drop-shadow-lg">
              {cityName}
            </h3>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {destination.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {destination.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            {destination.userRatingCount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {destination.userRatingCount.toLocaleString()} reviews
              </div>
            )}
            <div className="flex items-center gap-1 text-compass-gold">
              <GraduationCap className="h-4 w-4" />
              Study Abroad
            </div>
          </div>
          
          {destination.attractions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-compass-navy">
                Top Attractions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {destination.attractions.slice(0, 3).map((attraction) => (
                  <Badge 
                    key={attraction.id} 
                    variant="outline" 
                    className="text-xs border-compass-navy/20 text-compass-navy"
                  >
                    {attraction.name}
                  </Badge>
                ))}
                {destination.attractions.length > 3 && (
                  <Badge variant="outline" className="text-xs border-compass-gold/30 text-compass-gold">
                    +{destination.attractions.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <NeonButton 
              variant="outline" 
              size="sm" 
              neonColor="gold" 
              className="w-full gap-2"
              data-testid={`button-plan-trip-${cityName.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Plane className="h-4 w-4" />
              Plan a Trip
              <ChevronRight className="h-4 w-4 ml-auto" />
            </NeonButton>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function AttractionCard({ attraction, destinationName }: { attraction: Attraction; destinationName?: string }) {
  const searchQuery = destinationName 
    ? `${attraction.name} ${destinationName}` 
    : attraction.name;
  const attractionUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
  
  return (
    <Link href={attractionUrl} data-testid={`card-attraction-${attraction.id}`}>
      <SpotlightCard glowColor="navy" className="overflow-hidden cursor-pointer group">
        <div className="relative h-32 -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px] overflow-hidden">
          {attraction.photoUrl ? (
            <img 
              src={attraction.photoUrl} 
              alt={attraction.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-compass-navy/20 to-compass-maroon/20 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-compass-navy/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {attraction.rating && (
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-white/90 text-compass-navy border-0 gap-1 text-xs">
                <Star className="h-2.5 w-2.5 fill-compass-gold text-compass-gold" />
                {attraction.rating.toFixed(1)}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-3 space-y-1">
          <h4 className="font-semibold text-compass-navy text-sm line-clamp-1">
            {attraction.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            {attraction.type}
          </p>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function DestinationCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border/50 overflow-hidden bg-white">
      <Skeleton className="h-48 w-full" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<FilterOption>('all');

  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips'],
  });

  const { data: publicTrips = [], isLoading: publicTripsLoading } = useQuery<FeedTrip[]>({
    queryKey: ['/api/feed/public'],
  });

  const { data: destinationsData, isLoading: destinationsLoading, error: destinationsError } = useQuery<DestinationsResponse>({
    queryKey: ['/api/destinations'],
    staleTime: 1000 * 60 * 30,
  });

  const filteredTrips = trips.filter((trip) => {
    if (filter === 'all') return true;
    return getStatusFromDates(trip.startDate, trip.endDate) === filter;
  });

  const counts = {
    all: trips.length,
    upcoming: trips.filter(t => getStatusFromDates(t.startDate, t.endDate) === 'upcoming').length,
    current: trips.filter(t => getStatusFromDates(t.startDate, t.endDate) === 'current').length,
    past: trips.filter(t => getStatusFromDates(t.startDate, t.endDate) === 'past').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="discover">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="h-auto bg-transparent p-0 rounded-none gap-0">
                <TabsTrigger
                  value="discover"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-compass-navy data-[state=active]:text-compass-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-3 px-6 font-medium text-muted-foreground"
                >
                  Discover
                </TabsTrigger>
                <TabsTrigger
                  value="community"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-compass-navy data-[state=active]:text-compass-navy data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-3 px-6 font-medium text-muted-foreground"
                >
                  Community
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3 py-2">
                <Link href="/search">
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-border/60 bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors cursor-pointer w-48" data-testid="input-search-bar">
                    <Search className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-mono text-xs tracking-wide truncate">Search places, trips…</span>
                  </div>
                </Link>
                {isAuthenticated ? (
                  <Link href="/new">
                    <NeonButton
                      variant="solid"
                      size="sm"
                      neonColor="gold"
                      className="flex items-center gap-1.5 whitespace-nowrap"
                      data-testid="button-plan-journey"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Plan Your Journey
                    </NeonButton>
                  </Link>
                ) : (
                  <a href="/api/login">
                    <NeonButton
                      variant="solid"
                      size="sm"
                      neonColor="gold"
                      className="flex items-center gap-1.5 whitespace-nowrap"
                      data-testid="button-get-started"
                    >
                      Plan Your Journey
                    </NeonButton>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="discover" className="mt-0">

      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs uppercase tracking-widest text-primary">Study Abroad Destinations</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-3">
                Popular Destinations
              </h2>
              <p className="text-muted-foreground text-base max-w-xl">
                Explore the world's most popular study abroad destinations and plan your next adventure.
              </p>
            </div>
            
            <span className="font-mono text-xs border border-foreground/30 px-2 py-1 uppercase tracking-wider self-start md:self-auto">
              {destinationsData?.destinations.length || 12} Cities
            </span>
          </div>

          {destinationsError && (
            <div className="text-center py-12">
              <div className="h-16 w-16 border-2 border-foreground/20 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-foreground/25" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                Unable to load destinations
              </h3>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Please try again later or check your connection.
              </p>
            </div>
          )}

          {destinationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <DestinationCardSkeleton key={i} />
              ))}
            </div>
          ) : destinationsData?.destinations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinationsData.destinations.map((destination) => (
                <DestinationCard 
                  key={destination.placeId || destination.name} 
                  destination={destination} 
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {destinationsData?.destinations && destinationsData.destinations.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12 border-t border-border/50">
          <div className="mb-8 border-b border-foreground/10 pb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-primary block mb-1">Landmarks</span>
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Must-See Attractions
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {destinationsData.destinations
              .flatMap(d => d.attractions.slice(0, 2))
              .slice(0, 12)
              .map((attraction) => (
                <AttractionCard key={attraction.id} attraction={attraction} />
              ))}
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="animate-fade-in-up">
              <span className="font-mono text-xs uppercase tracking-widest text-primary mb-2 block">
                The Archive
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-3">
                Recent Journeys
              </h2>
              <p className="text-muted-foreground text-base max-w-xl">
                Discover where fellow travelers are venturing and find inspiration for your next adventure.
              </p>
            </div>
            
            <FilterBar activeFilter={filter} onFilterChange={setFilter} counts={counts} />
          </div>

          {tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <DestinationCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="masonry-grid">
              {filteredTrips.map((trip, index) => (
                <div 
                  key={trip.id} 
                  className={`masonry-item animate-fade-in-up stagger-${(index % 6) + 1}`}
                >
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 animate-fade-in">
              <div className="inline-flex items-center justify-center h-20 w-20 border-2 border-foreground/20 mb-8">
                <Compass className="h-10 w-10 text-foreground/25" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">
                No journeys yet
              </h3>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-base">
                {filter === 'all' 
                  ? "Be the first to share your adventure and inspire others!" 
                  : `No ${filter} journeys to show right now.`}
              </p>
              {isAuthenticated && (
                <Link href="/new">
                  <NeonButton 
                    variant="maroon"
                    size="lg"
                    neonColor="gold"
                    className="flex items-center gap-2 shadow-soft-lg mx-auto"
                    data-testid="button-create-first-trip"
                  >
                    <MapPin className="h-5 w-5" />
                    Create Your First Journey
                  </NeonButton>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <SpotlightCard glowColor="maroon" className="py-12 px-8 border-2 border-foreground hard-shadow">
          <span className="font-mono text-xs uppercase tracking-widest text-primary block mb-3">Start Here</span>
          <h2 className="text-3xl font-serif font-semibold text-foreground mb-4">
            Ready to Plan Your Journey?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm">
            Create your travel itinerary, invite friends, and start your adventure today.
          </p>
          {isAuthenticated ? (
            <Link href="/new">
              <NeonButton 
                variant="solid" 
                size="lg" 
                neonColor="maroon"
                className="gap-2"
                data-testid="button-create-trip-cta"
              >
                <Plane className="h-5 w-5" />
                Create Your Trip
              </NeonButton>
            </Link>
          ) : (
            <a href="/api/login">
              <NeonButton 
                variant="solid" 
                size="lg" 
                neonColor="maroon"
                className="gap-2"
                data-testid="button-create-trip-cta"
              >
                Sign In to Get Started
              </NeonButton>
            </a>
          )}
        </SpotlightCard>
      </section>

        </TabsContent>

        <TabsContent value="community" className="mt-0">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-10 border-b-2 border-foreground/10 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-primary">The Community</span>
              </div>
              <h2 className="text-4xl font-serif font-semibold text-foreground mb-2">
                Community Trips
              </h2>
              <p className="text-muted-foreground text-base max-w-2xl">
                Discover adventures shared by travelers in the community
              </p>
            </div>

            {publicTripsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            )}

            {!publicTripsLoading && publicTrips.length === 0 && (
              <div className="text-center py-20">
                <div className="h-20 w-20 mx-auto mb-6 border-2 border-foreground/20 flex items-center justify-center">
                  <Compass className="h-10 w-10 text-foreground/25" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                  No public trips yet
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Be the first to share a trip! Create a trip and toggle it to public so others can see it.
                </p>
              </div>
            )}

            {!publicTripsLoading && publicTrips.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicTrips.map((trip, idx) => (
                  <div key={trip.id} className={`animate-fade-in-up stagger-${(idx % 6) + 1}`}>
                    <TripCard trip={trip} showUser={true} showLikes={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
