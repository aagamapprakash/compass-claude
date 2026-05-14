import { MapPin, Star, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CityCardProps {
  id: string;
  name: string;
  country?: string;
  photoUrl?: string;
  rating?: number;
  userRatingCount?: number;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export default function CityCard({
  id,
  name,
  country,
  photoUrl,
  rating,
  userRatingCount,
  description,
  onClick,
  className = '',
}: CityCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      className={`overflow-hidden rounded-3xl border-0 shadow-lg hover:shadow-2xl hover-elevate cursor-pointer group transition-all duration-300 ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={`View details for ${name}${country ? `, ${country}` : ''}`}
      data-testid={`card-city-${id}`}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-compass-navy/20 to-compass-navy/40 flex items-center justify-center">
            <MapPin className="h-16 w-16 text-compass-navy/30" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-compass-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {country && (
          <Badge className="absolute top-4 left-4 bg-white/90 text-compass-navy hover:bg-white backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
            {country}
          </Badge>
        )}
        
        {rating && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-compass-gold/90 backdrop-blur-sm rounded-full px-3 py-1">
            <Star className="h-3 w-3 fill-compass-navy text-compass-navy" />
            <span className="text-xs font-semibold text-compass-navy">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 bg-white relative">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif font-semibold text-xl text-compass-navy line-clamp-1">
            {name}
          </h3>
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}
        
        {userRatingCount && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{userRatingCount.toLocaleString()} reviews</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
