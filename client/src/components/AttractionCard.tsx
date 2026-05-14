import { MapPin, Star, Building2, Utensils, Landmark, Bed, Coffee, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AttractionType = 'attraction' | 'restaurant' | 'hotel' | 'cafe' | 'museum' | 'park' | 'default';

interface AttractionCardProps {
  id: string;
  name: string;
  type?: string;
  types?: string[];
  photoUrl?: string;
  rating?: number;
  userRatingCount?: number;
  address?: string;
  priceLevel?: string;
  openNow?: boolean;
  onClick?: () => void;
  className?: string;
}

function getAttractionType(types?: string[]): AttractionType {
  if (!types || types.length === 0) return 'default';
  
  const typeString = types.join(' ').toLowerCase();
  
  if (typeString.includes('restaurant') || typeString.includes('food')) return 'restaurant';
  if (typeString.includes('lodging') || typeString.includes('hotel')) return 'hotel';
  if (typeString.includes('cafe') || typeString.includes('coffee')) return 'cafe';
  if (typeString.includes('museum')) return 'museum';
  if (typeString.includes('park')) return 'park';
  if (typeString.includes('tourist_attraction') || typeString.includes('landmark')) return 'attraction';
  
  return 'default';
}

function getTypeIcon(type: AttractionType) {
  const iconProps = { className: 'h-4 w-4' };
  
  switch (type) {
    case 'restaurant':
      return <Utensils {...iconProps} />;
    case 'hotel':
      return <Bed {...iconProps} />;
    case 'cafe':
      return <Coffee {...iconProps} />;
    case 'museum':
    case 'attraction':
      return <Landmark {...iconProps} />;
    case 'park':
      return <MapPin {...iconProps} />;
    default:
      return <Building2 {...iconProps} />;
  }
}

function getTypeLabel(type: AttractionType, rawType?: string): string {
  if (rawType) {
    return rawType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  const labels: Record<AttractionType, string> = {
    attraction: 'Attraction',
    restaurant: 'Restaurant',
    hotel: 'Hotel',
    cafe: 'Café',
    museum: 'Museum',
    park: 'Park',
    default: 'Place',
  };
  
  return labels[type];
}

function getTypeColor(type: AttractionType): string {
  switch (type) {
    case 'restaurant':
    case 'cafe':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'hotel':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'museum':
    case 'attraction':
      return 'bg-compass-maroon/10 text-compass-maroon border-compass-maroon/20';
    case 'park':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-compass-navy/10 text-compass-navy border-compass-navy/20';
  }
}

function formatPriceLevel(level?: string): string {
  const priceMap: Record<string, string> = {
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': '$',
    'PRICE_LEVEL_MODERATE': '$$',
    'PRICE_LEVEL_EXPENSIVE': '$$$',
    'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
  };
  return priceMap[level || ''] || '';
}

export default function AttractionCard({
  id,
  name,
  type,
  types,
  photoUrl,
  rating,
  userRatingCount,
  address,
  priceLevel,
  openNow,
  onClick,
  className = '',
}: AttractionCardProps) {
  const attractionType = getAttractionType(types);
  const displayType = type || (types?.[0] ? getTypeLabel(attractionType, types[0]) : getTypeLabel(attractionType));
  const typeColor = getTypeColor(attractionType);
  const price = formatPriceLevel(priceLevel);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  
  return (
    <Card
      className={`overflow-hidden rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover-elevate cursor-pointer group transition-all duration-300 ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={`View details for ${name}`}
      data-testid={`card-attraction-${id}`}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {getTypeIcon(attractionType)}
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${typeColor}`}>
            <span className="flex items-center gap-1">
              {getTypeIcon(attractionType)}
              {displayType}
            </span>
          </Badge>
        </div>
        
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {price && (
            <Badge className="bg-compass-gold/90 text-compass-navy hover:bg-compass-gold rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {price}
            </Badge>
          )}
          {openNow !== undefined && (
            <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${openNow ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              <Clock className="h-3 w-3 mr-1" />
              {openNow ? 'Open' : 'Closed'}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-compass-navy mb-1 line-clamp-1">
          {name}
        </h3>
        
        {address && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex items-start gap-1">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-compass-gold" />
            <span>{address}</span>
          </p>
        )}
        
        {rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-compass-gold text-compass-gold" />
              <span className="font-medium text-compass-navy">{rating.toFixed(1)}</span>
            </div>
            {userRatingCount && (
              <span className="text-xs text-muted-foreground">
                ({userRatingCount.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
