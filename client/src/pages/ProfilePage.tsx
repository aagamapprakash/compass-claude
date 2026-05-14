import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, MapPin, Calendar, Compass, Sparkles, Users, UserPlus, UserMinus, Heart } from 'lucide-react';
import { Link } from 'wouter';
import TripCard, { type Trip } from '@/components/TripCard';
import { getStatusFromDates, type TripStatus } from '@/components/StatusBadge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-3xl border-0 shadow-soft-lg bg-white">
            <CardContent className="py-20 text-center">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-compass-navy/5 mb-8">
                <User className="h-12 w-12 text-compass-navy/30" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-compass-navy mb-3">Traveler Not Found</h2>
              <p className="text-muted-foreground mb-10 text-lg">
                This profile doesn't exist or has been removed.
              </p>
              <Link href="/">
                <Button className="gap-2 bg-compass-navy text-white rounded-xl" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Explore
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = profileUser.firstName
    ? `${profileUser.firstName}${profileUser.lastName ? ' ' + profileUser.lastName : ''}`
    : profileUser.email || 'Traveler';

  const isOwnProfile = currentUser?.id === profileUser.id;

  const groupedTrips: Record<TripStatus, (Trip & { likeCount?: number; isLiked?: boolean })[]> = {
    current: [],
    upcoming: [],
    past: [],
  };

  userTrips.forEach((trip) => {
    const status = getStatusFromDates(trip.startDate, trip.endDate);
    groupedTrips[status].push(trip);
  });

  const totalTrips = userTrips.length;
  const destinations = new Set(userTrips.map((t) => t.destination.split(',').pop()?.trim())).size;

  return (
    <div className="min-h-screen bg-background py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <SpotlightCard glowColor="gold" className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-compass-navy via-compass-maroon to-compass-gold -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px]" />

          <div className="pt-0 pb-8 px-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-editorial ring-4 ring-compass-gold/30">
                {profileUser.profileImageUrl && (
                  <AvatarImage src={profileUser.profileImageUrl} alt={displayName} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-5xl font-serif font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="text-center md:text-left flex-1 pt-4 md:pt-0">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-compass-navy mb-1" data-testid="text-username">
                  {displayName}
                </h1>
                <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="h-4 w-4 text-compass-gold" />
                  Adventure seeker
                </p>
                {!isOwnProfile && isAuthenticated && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      className={followStats?.isFollowing 
                        ? "bg-compass-navy/10 text-compass-navy rounded-xl gap-1.5"
                        : "bg-compass-navy text-white rounded-xl gap-1.5"
                      }
                      variant={followStats?.isFollowing ? "outline" : "default"}
                      data-testid="button-follow-toggle"
                    >
                      {followStats?.isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-compass-navy/5 min-w-[70px]">
                  <Compass className="h-5 w-5 mx-auto mb-2 text-compass-navy" />
                  <p className="text-2xl font-serif font-bold text-compass-navy">{totalTrips}</p>
                  <p className="text-xs text-muted-foreground font-medium">Journeys</p>
                </div>
                <div className="p-4 rounded-2xl bg-compass-maroon/5 min-w-[70px]">
                  <MapPin className="h-5 w-5 mx-auto mb-2 text-compass-maroon" />
                  <p className="text-2xl font-serif font-bold text-compass-maroon">{destinations}</p>
                  <p className="text-xs text-muted-foreground font-medium">Places</p>
                </div>
                <div className="p-4 rounded-2xl bg-compass-gold/10 min-w-[70px]">
                  <Users className="h-5 w-5 mx-auto mb-2 text-compass-gold" />
                  <p className="text-2xl font-serif font-bold text-compass-navy" data-testid="text-follower-count">{followStats?.followerCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Followers</p>
                </div>
                <div className="p-4 rounded-2xl bg-compass-navy/5 min-w-[70px]">
                  <Heart className="h-5 w-5 mx-auto mb-2 text-compass-maroon" />
                  <p className="text-2xl font-serif font-bold text-compass-navy" data-testid="text-following-count">{followStats?.followingCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Following</p>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {groupedTrips.current.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-compass-gold shadow-sm animate-pulse" />
              <h2 className="text-2xl font-serif font-semibold text-compass-navy">Currently Traveling</h2>
            </div>
            <div className="masonry-grid">
              {groupedTrips.current.map((trip, idx) => (
                <div key={trip.id} className={`masonry-item animate-fade-in-up stagger-${idx + 1}`}>
                  <TripCard trip={trip} showUser={false} showLikes={true} />
                </div>
              ))}
            </div>
          </section>
        )}

        {groupedTrips.upcoming.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-compass-navy shadow-sm" />
              <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                Upcoming Adventures ({groupedTrips.upcoming.length})
              </h2>
            </div>
            <div className="masonry-grid">
              {groupedTrips.upcoming.map((trip, idx) => (
                <div key={trip.id} className={`masonry-item animate-fade-in-up stagger-${idx + 1}`}>
                  <TripCard trip={trip} showUser={false} showLikes={true} />
                </div>
              ))}
            </div>
          </section>
        )}

        {groupedTrips.past.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-compass-maroon shadow-sm" />
              <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                Past Journeys ({groupedTrips.past.length})
              </h2>
            </div>
            <div className="masonry-grid">
              {groupedTrips.past.map((trip, idx) => (
                <div key={trip.id} className={`masonry-item animate-fade-in-up stagger-${idx + 1}`}>
                  <TripCard trip={trip} showUser={false} showLikes={true} />
                </div>
              ))}
            </div>
          </section>
        )}

        {userTrips.length === 0 && !tripsLoading && (
          <SpotlightCard glowColor="navy" className="py-16 text-center">
            <div className="h-24 w-24 rounded-3xl bg-compass-navy/5 mx-auto mb-6 flex items-center justify-center">
              <Compass className="h-12 w-12 text-compass-navy/30" />
            </div>
            <h3 className="text-xl font-serif font-semibold text-compass-navy mb-2">No journeys yet</h3>
            <p className="text-muted-foreground">
              {isOwnProfile ? "Start planning your first adventure!" : "This traveler hasn't shared any adventures."}
            </p>
          </SpotlightCard>
        )}
      </div>
    </div>
  );
}
