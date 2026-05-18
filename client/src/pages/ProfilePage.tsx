import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Compass, UserPlus, UserMinus, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { type Trip } from '@/components/TripCard';
import { getStatusFromDates } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import cafeImage from '@assets/stock_images/cozy_european_cafe_s_9663637c.jpg';
import mountainImage from '@assets/stock_images/mountain_lake_sunset_16936e1a.jpg';
import templeImage from '@assets/stock_images/japanese_temple_cher_2cf8bf5d.jpg';
import coastImage from '@assets/stock_images/italian_coast_amalfi_97bb6be1.jpg';

const travelImages = [cafeImage, mountainImage, templeImage, coastImage];

function getTripImage(id: number): string {
  return travelImages[id % travelImages.length];
}

interface ProfileUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface FollowStats {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface ProfilePageProps {
  userId: string;
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: profileUser, isLoading: userLoading } = useQuery<ProfileUser>({
    queryKey: ['/api/users', userId],
  });

  const { data: userTrips = [], isLoading: tripsLoading } = useQuery<(Trip & { likeCount?: number; isLiked?: boolean })[]>({
    queryKey: ['/api/users', userId, 'trips'],
    enabled: !!profileUser,
    staleTime: 0,
  });

  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ['/api/users', userId, 'follow-stats'],
    enabled: !!profileUser,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (followStats?.isFollowing) {
        await apiRequest('DELETE', `/api/users/${userId}/follow`);
      } else {
        await apiRequest('POST', `/api/users/${userId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'follow-stats'] });
      toast({
        title: followStats?.isFollowing ? 'Unfollowed' : 'Following!',
        description: followStats?.isFollowing
          ? `You unfollowed ${displayName}`
          : `You are now following ${displayName}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="border-2 border-foreground p-12 text-center hard-shadow">
            <div className="inline-flex items-center justify-center h-20 w-20 border-2 border-foreground mb-6">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-3">Traveler Not Found</h2>
            <p className="text-muted-foreground font-serif mb-8">
              This profile doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="gap-2 border-2 border-foreground bg-background text-foreground hard-shadow hover:bg-muted font-mono text-xs rounded-none" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profileUser.firstName
    ? `${profileUser.firstName}${profileUser.lastName ? ' ' + profileUser.lastName : ''}`
    : profileUser.email || 'Traveler';

  const handle = profileUser.email ? `@${profileUser.email.split('@')[0]}` : `@traveler`;
  const isOwnProfile = currentUser?.id === profileUser.id;
  const totalTrips = userTrips.length;

  const topHighlights = [...userTrips]
    .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Profile Header */}
        <section className="border-2 border-foreground hard-shadow bg-[hsl(var(--surface-container,40_20%_93%))] p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-grow flex flex-col w-full">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-serif text-3xl font-bold" data-testid="text-username">
                  {displayName}
                </h1>
                <p className="font-mono text-sm text-muted-foreground mt-1">
                  {handle}
                </p>
              </div>

              {isOwnProfile ? (
                <button className="border-2 border-foreground px-4 py-2 bg-compass-navy text-white font-mono text-xs hard-shadow hover:bg-compass-navy/90 transition-colors">
                  Edit Record
                </button>
              ) : isAuthenticated ? (
                <Button
                  size="sm"
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`border-2 border-foreground font-mono text-xs rounded-none hard-shadow gap-1.5 ${
                    followStats?.isFollowing
                      ? 'bg-background text-foreground hover:bg-muted'
                      : 'bg-compass-navy text-white hover:bg-compass-navy/90'
                  }`}
                  data-testid="button-follow-toggle"
                >
                  {followStats?.isFollowing ? (
                    <><UserMinus className="h-3.5 w-3.5" /> Unfollow</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                  )}
                </Button>
              ) : null}
            </div>

            {/* Stats row */}
            <div className="flex gap-8 mt-5 border-b border-dashed border-foreground pb-4 w-full">
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold">{totalTrips}</span>
                <span className="font-mono text-[11px] uppercase text-muted-foreground">Logs</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold" data-testid="text-follower-count">
                  {followStats?.followerCount ?? 0}
                </span>
                <span className="font-mono text-[11px] uppercase text-muted-foreground">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold" data-testid="text-following-count">
                  {followStats?.followingCount ?? 0}
                </span>
                <span className="font-mono text-[11px] uppercase text-muted-foreground">Following</span>
              </div>
            </div>
          </div>

          {/* Square portrait */}
          <div className="w-28 h-28 border-2 border-foreground flex-shrink-0 overflow-hidden">
            {profileUser.profileImageUrl ? (
              <img
                src={profileUser.profileImageUrl}
                alt={displayName}
                className="w-full h-full object-cover grayscale-[50%] contrast-125"
              />
            ) : (
              <div className="w-full h-full bg-compass-navy/10 flex items-center justify-center">
                <span className="font-serif text-4xl font-bold text-compass-navy">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Top Highlights */}
        {!tripsLoading && topHighlights.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-xl font-bold border-b-2 border-foreground pb-2 w-fit">
              Top Highlights
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topHighlights.map((trip) => {
                const dateLabel = new Date(trip.startDate)
                  .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  .toUpperCase();
                return (
                  <Link key={trip.id} href={`/trip/${trip.id}`}>
                    <article className="border-2 border-foreground hard-shadow bg-background p-1.5 flex flex-col gap-1.5 group cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="aspect-[3/4] border border-foreground overflow-hidden relative">
                        <img
                          src={getTripImage(trip.id)}
                          alt={trip.destination}
                          className="w-full h-full object-cover grayscale-[30%] group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-background border border-foreground px-1 py-0.5">
                          <span className="font-mono text-[10px]">{dateLabel}</span>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        <h3 className="font-mono text-xs font-bold truncate">{trip.destination}</h3>
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          <span className="font-mono text-[10px]">{trip.likeCount ?? 0}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Complete Ledger */}
        {!tripsLoading && userTrips.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b-2 border-foreground pb-2">
              <h2 className="font-serif text-xl font-bold">Complete Ledger</h2>
              <div className="flex gap-2">
                <button className="border border-foreground px-2 py-1 bg-background font-mono text-[11px] flex items-center gap-1 hover:bg-muted transition-colors">
                  Filter
                </button>
                <button className="border border-foreground px-2 py-1 bg-background font-mono text-[11px] flex items-center gap-1 hover:bg-muted transition-colors">
                  Sort
                </button>
              </div>
            </div>

            <div className="border-2 border-foreground hard-shadow grid grid-cols-2 md:grid-cols-4">
              {userTrips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <div className="aspect-square overflow-hidden border border-foreground">
                    <img
                      src={getTripImage(trip.id)}
                      alt={trip.destination}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer"
                    />
                  </div>
                </Link>
              ))}
            </div>

            <button className="border-2 border-foreground w-full py-3 bg-background font-mono text-xs hard-shadow hover:bg-muted transition-colors text-center">
              Load Older Archives
            </button>
          </section>
        )}

        {/* Empty state */}
        {userTrips.length === 0 && !tripsLoading && (
          <div className="border-2 border-foreground hard-shadow p-12 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 border-2 border-foreground mb-6">
              <Compass className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground font-serif">
              {isOwnProfile ? 'Start planning your first adventure!' : "This traveler hasn't shared any adventures."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
