import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, User, Compass, Globe, Star, ExternalLink, Phone, Clock, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import TripCard from '@/components/TripCard';
import CityCard from '@/components/CityCard';
import AttractionCard from '@/components/AttractionCard';
import { type PlaceDetails } from '@/components/PlacesSearch';

type SearchType = 'place' | 'trip' | 'user';

interface SearchPlace {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string;
  types: string[];
  priceLevel?: string;
}

const CITY_TYPES = ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'sublocality'];
function isCityType(types: string[]): boolean {
  return types.some(t => CITY_TYPES.includes(t));
}

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<SearchType>>(new Set<SearchType>(['place', 'trip', 'user']));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const toggleType = (type: SearchType) => {
    setActiveTypes(prev => {
      if (prev.has(type) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<{ trips: any[]; users: any[] }>({
    queryKey: ['/api/search', `?q=${encodeURIComponent(query)}`],
    enabled: query.trim().length > 0,
  });

  const { data: placeData, isLoading: isLoadingPlaces } = useQuery<{ places: SearchPlace[] }>({
    queryKey: ['/api/places/search', `?query=${encodeURIComponent(query)}`],
    queryFn: async () => {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch places');
      return response.json();
    },
    enabled: query.trim().length > 0 && activeTypes.has('place'),
  });

  const { data: placeDetails, isLoading: isLoadingDetails } = useQuery<PlaceDetails>({
    queryKey: ['/api/places', selectedPlaceId],
    queryFn: async () => {
      const response = await fetch(`/api/places/${selectedPlaceId}`);
      if (!response.ok) throw new Error('Failed to fetch place details');
      return response.json();
    },
    enabled: !!selectedPlaceId,
  });

  const handleSearch = () => setQuery(searchInput);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const places = activeTypes.has('place') ? (placeData?.places || []) : [];
  const trips = activeTypes.has('trip') ? (searchResults?.trips || []) : [];
  const users = activeTypes.has('user') ? (searchResults?.users || []) : [];
  const isLoading = isLoadingSearch || isLoadingPlaces;
  const hasResults = places.length > 0 || trips.length > 0 || users.length > 0;
  const showEmptyState = query.trim() && !isLoading && !hasResults;

  const filterConfig: Record<SearchType, { label: string; icon: React.ReactNode }> = {
    place: { label: 'Places', icon: <Globe className="h-3.5 w-3.5" /> },
    trip: { label: 'Trips', icon: <MapPin className="h-3.5 w-3.5" /> },
    user: { label: 'People', icon: <User className="h-3.5 w-3.5" /> },
  };

  return (
    <div className="min-h-screen bg-background py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-compass-gold font-medium text-sm uppercase tracking-wider mb-2 block">
            Explore
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-compass-navy mb-4">
            Search Journeys
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Find places, trips, and travelers that inspire your next adventure.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search places, trips, travelers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-16 pl-14 pr-6 rounded-3xl border-2 border-border bg-white focus:border-compass-navy focus:ring-4 focus:ring-compass-navy/10 text-lg shadow-soft"
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {(['place', 'trip', 'user'] as SearchType[]).map((type) => {
              const { label, icon } = filterConfig[type];
              return (
                <Button
                  key={type}
                  variant={activeTypes.has(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleType(type)}
                  className={`gap-1.5 ${
                    activeTypes.has(type)
                      ? 'bg-compass-navy text-white'
                      : 'border-compass-navy/20 text-compass-navy'
                  }`}
                  data-testid={`filter-${type}`}
                >
                  {icon}
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {!query.trim() && (
          <div className="text-center py-20 animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-compass-gold/10 mx-auto mb-8 flex items-center justify-center">
              <Compass className="h-12 w-12 text-compass-gold" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-compass-navy mb-3">
              Start exploring
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Search for places, trips, or travelers to discover your next adventure.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        )}

        {showEmptyState && (
          <div className="text-center py-20 animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-compass-maroon/10 mx-auto mb-8 flex items-center justify-center">
              <Search className="h-12 w-12 text-compass-maroon/50" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-compass-navy mb-3">
              No results found
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              We couldn't find any matches for "{query}". Try a different search term.
            </p>
          </div>
        )}

        {hasResults && !isLoading && (
          <div className="space-y-12 animate-fade-in-up">
            {places.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-compass-gold/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-compass-gold" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Places ({places.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {places.map((place) =>
                    isCityType(place.types) ? (
                      <CityCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        country={place.address}
                        photoUrl={place.photoUrl}
                        rating={place.rating}
                        userRatingCount={place.userRatingCount}
                        onClick={() => setSelectedPlaceId(place.id)}
                      />
                    ) : (
                      <AttractionCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        types={place.types}
                        photoUrl={place.photoUrl}
                        rating={place.rating}
                        userRatingCount={place.userRatingCount}
                        address={place.address}
                        priceLevel={place.priceLevel}
                        onClick={() => setSelectedPlaceId(place.id)}
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {users.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-compass-gold/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-compass-gold" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Travelers ({users.length})
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {users.map((u: any) => (
                    <Link key={u.id} href={`/profile/${u.id}`}>
                      <Card
                        className="rounded-3xl border-0 shadow-soft p-6 text-center cursor-pointer hover-elevate"
                        data-testid={`user-card-${u.id}`}
                      >
                        <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-compass-gold/30 shadow-soft">
                          {u.profileImageUrl && <AvatarImage src={u.profileImageUrl} />}
                          <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-2xl font-serif font-bold">
                            {(u.firstName || u.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-serif font-semibold text-compass-navy truncate">
                          {u.firstName
                            ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
                            : u.email || 'Traveler'}
                        </h3>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {trips.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-compass-navy/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-compass-navy" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Trips ({trips.length})
                  </h2>
                </div>
                <div className="masonry-grid">
                  {trips.map((trip: any, idx: number) => (
                    <div
                      key={trip.id}
                      className={`masonry-item animate-fade-in-up stagger-${(idx % 6) + 1}`}
                    >
                      <TripCard trip={trip} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPlaceId} onOpenChange={(open) => !open && setSelectedPlaceId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {isLoadingDetails ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-compass-navy" />
            </div>
          ) : placeDetails ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif text-compass-navy">
                  {placeDetails.name}
                </DialogTitle>
              </DialogHeader>

              {placeDetails.photoUrl && (
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={placeDetails.photoUrl}
                    alt={placeDetails.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                {placeDetails.description && (
                  <p className="text-muted-foreground">{placeDetails.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {placeDetails.types.slice(0, 4).map((type) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>

                {placeDetails.rating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-compass-gold">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="text-lg font-semibold">{placeDetails.rating.toFixed(1)}</span>
                    </div>
                    {placeDetails.userRatingCount && (
                      <span className="text-muted-foreground">
                        ({placeDetails.userRatingCount.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>{placeDetails.address}</span>
                </div>

                {placeDetails.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-5 w-5" />
                    <span>{placeDetails.phone}</span>
                  </div>
                )}

                {placeDetails.openingHours && placeDetails.openingHours.length > 0 && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      {placeDetails.openingHours.map((hours, idx) => (
                        <div key={idx}>{hours}</div>
                      ))}
                    </div>
                  </div>
                )}

                {placeDetails.website && (
                  <a
                    href={placeDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-compass-navy hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Website
                  </a>
                )}

                {placeDetails.photos && placeDetails.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {placeDetails.photos.slice(1, 5).map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`${placeDetails.name} photo ${idx + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
