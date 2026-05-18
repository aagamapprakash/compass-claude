import { Calendar, Heart, MapPin, Users } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import TransportIcon, { type TransportMode } from './TransportIcon';
import StatusBadge, { type TripStatus, getStatusFromDates } from './StatusBadge';
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

function getDestinationImage(_destination: string, id: number): string {
  return travelImages[id % travelImages.length];
}

function formatLedgerDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export default function TripCard({ trip, showUser = true, showLikes = true }: TripCardProps) {
  const status: TripStatus = getStatusFromDates(trip.startDate, trip.endDate);
  const imageUrl = getDestinationImage(trip.destination, trip.id);
  const { isAuthenticated } = useAuth();

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

  const cityName = trip.destination.split(',')[0];

  return (
    <Link href={`/trip/${trip.id}`}>
      <article
        className="group bg-card border-2 border-foreground hard-shadow hard-shadow-active flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
        data-testid={`card-trip-${trip.id}`}
      >
        {/* Image */}
        <div className="relative h-56 border-b-2 border-foreground overflow-hidden">
          <img
            src={imageUrl}
            alt={trip.destination}
            className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
          />

          {/* Date stamp */}
          <div className="absolute top-3 right-3 bg-card border border-foreground px-2 py-0.5 font-mono text-xs tracking-wider">
            {formatLedgerDate(trip.startDate)}
          </div>

          {/* Transport icon — bottom left */}
          <div className="absolute bottom-3 left-3 bg-card border border-foreground p-1.5">
            <TransportIcon mode={trip.transportMode} size="sm" />
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-grow">
          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="border border-foreground/40 px-2 py-0.5 font-mono text-xs uppercase tracking-wider">
              {cityName}
            </span>
            <StatusBadge status={status} />
            {trip.invitedFriends && trip.invitedFriends.length > 0 && (
              <span className="border border-foreground/40 px-2 py-0.5 font-mono text-xs uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3" />
                {trip.invitedFriends.length}
              </span>
            )}
          </div>

          <h3 className="font-serif text-xl font-semibold mb-1.5 group-hover:text-primary transition-colors leading-snug">
            {trip.destination}
          </h3>

          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span>{formatLedgerDate(trip.startDate)}{trip.endDate ? ` — ${formatLedgerDate(trip.endDate)}` : ''}</span>
          </div>

          {trip.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {trip.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-foreground/20 px-5 py-3 flex items-center justify-between bg-secondary/50">
          <div className="flex items-center gap-4">
            {showLikes && (
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-like-trip-${trip.id}`}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${currentIsLiked ? 'fill-compass-maroon text-compass-maroon' : ''}`}
                />
                <span>{currentLikeCount > 0 ? currentLikeCount : '—'}</span>
              </button>
            )}
            {showUser && trip.username && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">{trip.username}</span>
              </div>
            )}
          </div>

          <span className="font-mono text-xs border-b border-foreground/40 hover:border-foreground transition-colors">
            Read Entry →
          </span>
        </div>
      </article>
    </Link>
  );
}
