import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Search, MapPin, Star, ArrowLeft, ExternalLink, Phone, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PlacesSearch, { type PlaceSuggestion, type PlaceDetails } from '@/components/PlacesSearch';
import CityCard from '@/components/CityCard';
import AttractionCard from '@/components/AttractionCard';

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

function isCityType(types: string[]): boolean {
  const cityTypes = ['locality', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'sublocality'];
  return types.some(t => cityTypes.includes(t));
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: placeDetails, isLoading: isLoadingDetails } = useQuery<PlaceDetails>({
    queryKey: ['/api/places', selectedPlaceId],
    queryFn: async () => {
      const response = await fetch(`/api/places/${selectedPlaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }
      return response.json();
    },
    enabled: !!selectedPlaceId,
  });

  const searchPlaces = async (query: string, type: string = 'all') => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams({ query });
      if (type && type !== 'all') {
        params.append('types', type);
      }
      const response = await fetch(`/api/places/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.places || []);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlaceSelect = async (suggestion: PlaceSuggestion) => {
    searchPlaces(suggestion.description, selectedType);
  };

  const handleSearch = async (query: string) => {
    searchPlaces(query, selectedType);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (searchQuery.trim()) {
      searchPlaces(searchQuery, type);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-compass-navy/5">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2 text-compass-navy hover:bg-compass-navy/5 rounded-xl mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Journeys
          </Button>
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-compass-navy mb-3">
            Explore the World
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover destinations, hotels, restaurants, and attractions anywhere in the world
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <PlacesSearch
            placeholder="Search for cities, hotels, restaurants, attractions..."
            defaultType="all"
            showTypeFilter={true}
            onSelect={handlePlaceSelect}
            onTypeChange={(type) => setSelectedType(type)}
          />
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim() || isSearching}
              className="gap-2"
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
              Search "{searchQuery || '...'}"
            </Button>
          </div>
        </div>

        {isSearching && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-compass-navy" />
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-compass-navy mb-2">No places found</h3>
            <p className="text-muted-foreground">Try a different search term or location</p>
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((place) => (
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
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-compass-navy/5 flex items-center justify-center">
              <Search className="h-12 w-12 text-compass-navy/30" />
            </div>
            <h3 className="text-xl font-medium text-compass-navy mb-2">
              Start Your Exploration
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for any destination, hotel, restaurant, or attraction to discover amazing places around the world
            </p>
          </div>
        )}

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
    </div>
  );
}
