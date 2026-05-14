import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Globe, Heart } from 'lucide-react';
import TripCard, { type Trip } from '@/components/TripCard';

interface FeedTrip extends Trip {
  likeCount: number;
  isLiked: boolean;
  ownerProfileImage?: string;
  memberCount?: number;
}

export default function SocialFeedPage() {
  const { data: publicTrips = [], isLoading } = useQuery<FeedTrip[]>({
    queryKey: ['/api/feed/public'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-compass-navy/5">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-compass-navy to-compass-maroon mb-4 shadow-soft">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-compass-navy mb-3">
            Community Trips
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover adventures shared by travelers in the community
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-80 w-full rounded-3xl" />
            ))}
          </div>
        )}

        {!isLoading && publicTrips.length === 0 && (
          <div className="text-center py-20">
            <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-compass-navy/5 flex items-center justify-center">
              <Compass className="h-12 w-12 text-compass-navy/30" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-compass-navy mb-2">
              No public trips yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Be the first to share a trip! Create a trip and toggle it to public so others can see it.
            </p>
          </div>
        )}

        {!isLoading && publicTrips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTrips.map((trip, idx) => (
              <div key={trip.id} className={`animate-fade-in-up stagger-${(idx % 6) + 1}`}>
                <TripCard trip={trip} showUser={true} showLikes={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
