import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, MapPin, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import TransportIcon, { type TransportMode } from './TransportIcon';
import StatusBadge, { type TripStatus, getStatusFromDates } from './StatusBadge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

import cafeImage from '@assets/stock_images/cozy_european_cafe_s_9663637c.jpg';
import mountainImage from '@assets/stock_images/mountain_lake_sunset_16936e1a.jpg';
import templeImage from '@assets/stock_images/japanese_temple_cher_2cf8bf5d.jpg';
import coastImage from '@assets/stock_images/italian_coast_amalfi_97bb6be1.jpg';

export interface Trip {
  id: number;
  destination: string;
  startDate: string;
  endDate?: string | null;
  transportMode: TransportMode;
  description?: string | null;
  userId: string;
  username?: string;
  invitedFriends?: string[];
  allowJoinRequests?: boolean;
  isPublic?: boolean;
  likeCount?: number;
  isLiked?: boolean;
}

interface TripCardProps {
  trip: Trip;
  showUser?: boolean;
  showLikes?: boolean;
}

const travelImages = [cafeImage, mountainImage, templeImage, coastImage];

function getDestinationImage(destination: string, id: number): string {
  return travelImages[id % travelImages.length];
}

function formatDateRange(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString('en-US', options);
  }
  
  const end = new Date(endDate);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  if (startYear === endYear) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', options)}`;
  }
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

export default function TripCard({ trip, showUser = true, showLikes = true }: TripCardProps) {
  const status: TripStatus = getStatusFromDates(trip.startDate, trip.endDate);
  const imageUrl = getDestinationImage(trip.destination, trip.id);
  const { user, isAuthenticated } = useAuth();

  const { data: likeInfo } = useQuery<{ likeCount: number; isLiked: boolean }>({
    queryKey: ['/api/trips', trip.id, 'like-info'],
    enabled: showLikes && trip.likeCount === undefined,
  });

  const currentLikeCount = trip.likeCount ?? likeInfo?.likeCount ?? 0;
  const currentIsLiked = trip.isLiked ?? likeInfo?.isLiked ?? false;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (currentIsLiked) {
        await apiRequest('DELETE', `/api/trips/${trip.id}/like`);
      } else {
        await apiRequest('POST', `/api/trips/${trip.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', trip.id, 'like-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed/public'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', trip.userId, 'trips'] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    likeMutation.mutate();
  };

  return (
    <Link href={`/trip/${trip.id}`}>
      <SpotlightCard 
        glowColor="gold"
        className="group cursor-pointer overflow-hidden"
        data-testid={`card-trip-${trip.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px]">
          <img 
            src={imageUrl}
            alt={trip.destination}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-compass-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-4 right-4">
            <StatusBadge status={status} />
          </div>
          
          <div className="absolute bottom-4 left-4 backdrop-blur-md bg-white/90 p-2.5 rounded-2xl shadow-soft border border-white/50">
            <TransportIcon mode={trip.transportMode} size="sm" />
          </div>
          
          {showLikes && isAuthenticated && (
            <button
              onClick={handleLike}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-soft border border-white/50 transition-colors"
              data-testid={`button-like-trip-${trip.id}`}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${currentIsLiked ? 'fill-compass-maroon text-compass-maroon' : 'text-compass-navy/60'}`} 
              />
              {currentLikeCount > 0 && (
                <span className="text-xs font-semibold text-compass-navy">{currentLikeCount}</span>
              )}
            </button>
          )}

          {!showLikes && trip.invitedFriends && trip.invitedFriends.length > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-compass-gold/90 backdrop-blur-sm text-compass-navy shadow-soft">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">
                {trip.invitedFriends.length}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="h-4 w-4 text-compass-gold mt-1 flex-shrink-0" />
            <h3 className="font-serif text-xl font-semibold text-compass-navy line-clamp-1 group-hover:text-compass-maroon transition-colors duration-300">
              {trip.destination}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          
          {trip.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
              {trip.description}
            </p>
          )}
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {showUser && trip.username && (
              <div className="flex items-center gap-3 pt-4 border-t border-border/50 flex-1">
                <Avatar className="h-8 w-8 ring-2 ring-compass-gold/30">
                  <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-xs font-semibold">
                    {trip.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-compass-navy">{trip.username}</span>
              </div>
            )}

            {showLikes && !isAuthenticated && currentLikeCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground pt-4 border-t border-border/50">
                <Heart className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{currentLikeCount}</span>
              </div>
            )}
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}
