import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { NeonButton } from '@/components/ui/neon-button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Star, 
  Users, 
  GraduationCap, 
  Plane, 
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Camera,
  Building2,
  Landmark,
  TreePine
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function getAttractionIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('museum') || lowerType.includes('gallery')) {
    return <Building2 className="h-4 w-4" />;
  }
  if (lowerType.includes('park') || lowerType.includes('garden')) {
    return <TreePine className="h-4 w-4" />;
  }
  if (lowerType.includes('landmark') || lowerType.includes('monument') || lowerType.includes('palace')) {
    return <Landmark className="h-4 w-4" />;
  }
  return <Camera className="h-4 w-4" />;
}

function AttractionDetailCard({ attraction }: { attraction: Attraction }) {
  return (
    <SpotlightCard glowColor="navy" className="overflow-hidden group">
      <div className="relative h-40 -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px] overflow-hidden">
        {attraction.photoUrl ? (
          <img 
            src={attraction.photoUrl} 
            alt={attraction.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-compass-navy/20 to-compass-maroon/20 flex items-center justify-center">
            {getAttractionIcon(attraction.type)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {attraction.rating && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-compass-navy border-0 gap-1">
              <Star className="h-3 w-3 fill-compass-gold text-compass-gold" />
              {attraction.rating.toFixed(1)}
            </Badge>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 right-3">
          <Badge className="bg-compass-navy/80 text-white border-0 backdrop-blur-sm text-xs">
            {attraction.type}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-compass-navy text-base line-clamp-1">
          {attraction.name}
        </h4>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {attraction.userRatingCount && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {attraction.userRatingCount.toLocaleString()} reviews
            </div>
          )}
        </div>
        
        {attraction.address && (
          <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {attraction.address}
          </p>
        )}
      </div>
    </SpotlightCard>
  );
}

function DestinationPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-[50vh] w-full" />
      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
        <div className="bg-background rounded-3xl shadow-soft p-8 space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DestinationPage() {
  const [, params] = useRoute('/destination/:name');
  const destinationName = params?.name ? decodeURIComponent(params.name) : '';
  
  const { data, isLoading, error } = useQuery<DestinationsResponse>({
    queryKey: ['/api/destinations'],
    staleTime: 1000 * 60 * 30,
  });
  
  const destination = data?.destinations.find(
    d => d.name.toLowerCase() === destinationName.toLowerCase() ||
         d.name.split(',')[0].toLowerCase() === destinationName.toLowerCase()
  );
  
  if (isLoading) {
    return <DestinationPageSkeleton />;
  }
  
  if (error || !destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-compass-maroon/10 mx-auto flex items-center justify-center">
            <MapPin className="h-10 w-10 text-compass-maroon/50" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-compass-navy">
            Destination Not Found
          </h2>
          <p className="text-muted-foreground">
            We couldn't find information about this destination.
          </p>
          <Link href="/">
            <NeonButton variant="outline" neonColor="gold" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </NeonButton>
          </Link>
        </div>
      </div>
    );
  }
  
  const cityName = destination.name.split(',')[0];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px]">
        {destination.photoUrl ? (
          <img 
            src={destination.photoUrl} 
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-compass-navy to-compass-maroon" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
            data-testid="button-like-destination"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
            data-testid="button-share-destination"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </section>
      
      {/* Content Card */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 pb-16">
        <div className="bg-background rounded-3xl shadow-soft border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-border/50">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-compass-navy text-white border-0">
                    {destination.country}
                  </Badge>
                  <Badge className="bg-compass-gold/10 text-compass-gold border-compass-gold/20 gap-1">
                    <GraduationCap className="h-3 w-3" />
                    Study Abroad
                  </Badge>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-compass-navy">
                  {cityName}
                </h1>
                
                {/* Rating */}
                {destination.rating && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(destination.rating!) 
                                ? 'fill-compass-gold text-compass-gold' 
                                : 'text-compass-gold/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-compass-navy">
                        {destination.rating.toFixed(1)}
                      </span>
                    </div>
                    {destination.userRatingCount && (
                      <span className="text-muted-foreground">
                        {destination.userRatingCount.toLocaleString()} reviews on Google
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* CTA */}
              <div className="flex flex-col gap-3">
                <Link href={`/new?destination=${encodeURIComponent(destination.name)}`}>
                  <NeonButton 
                    variant="solid" 
                    size="lg" 
                    neonColor="gold"
                    className="gap-2 w-full md:w-auto"
                    data-testid="button-plan-trip"
                  >
                    <Plane className="h-5 w-5" />
                    Plan a Trip
                  </NeonButton>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {destination.description && (
            <div className="p-8 border-b border-border/50">
              <h2 className="text-lg font-semibold text-compass-navy mb-3">
                About {cityName}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {destination.description}
              </p>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="p-8 border-b border-border/50">
            <h2 className="text-lg font-semibold text-compass-navy mb-4">
              At a Glance
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-compass-navy/5 rounded-2xl p-4 text-center">
                <MapPin className="h-6 w-6 text-compass-navy mx-auto mb-2" />
                <p className="text-sm font-medium text-compass-navy">{destination.country}</p>
                <p className="text-xs text-muted-foreground">Country</p>
              </div>
              <div className="bg-compass-gold/10 rounded-2xl p-4 text-center">
                <Star className="h-6 w-6 text-compass-gold mx-auto mb-2" />
                <p className="text-sm font-medium text-compass-navy">{destination.rating?.toFixed(1) || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Google Rating</p>
              </div>
              <div className="bg-compass-maroon/10 rounded-2xl p-4 text-center">
                <Camera className="h-6 w-6 text-compass-maroon mx-auto mb-2" />
                <p className="text-sm font-medium text-compass-navy">{destination.attractions.length}</p>
                <p className="text-xs text-muted-foreground">Top Attractions</p>
              </div>
              <div className="bg-compass-navy/5 rounded-2xl p-4 text-center">
                <Clock className="h-6 w-6 text-compass-navy mx-auto mb-2" />
                <p className="text-sm font-medium text-compass-navy">5-7 days</p>
                <p className="text-xs text-muted-foreground">Recommended</p>
              </div>
            </div>
          </div>
          
          {/* Top Attractions */}
          {destination.attractions.length > 0 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Top Attractions
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Must-visit places in {cityName}
                  </p>
                </div>
                <Badge className="bg-compass-navy/10 text-compass-navy border-0">
                  {destination.attractions.length} places
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destination.attractions.map((attraction) => (
                  <AttractionDetailCard 
                    key={attraction.id} 
                    attraction={attraction} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <SpotlightCard glowColor="maroon" className="py-10 px-8">
            <h3 className="text-2xl font-serif font-bold text-compass-navy mb-3">
              Ready to explore {cityName}?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start planning your adventure and invite friends to join you.
            </p>
            <Link href={`/new?destination=${encodeURIComponent(destination.name)}`}>
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
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
