import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NeonButton } from '@/components/ui/neon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { MapPin, Calendar, Compass, Users, UserPlus, UserMinus, Search, X, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import TripCard, { type Trip } from './TripCard';
import { getStatusFromDates, type TripStatus } from './StatusBadge';
interface UserData {
  id: string;
  username: string;
  friends?: string[];
}

interface UserProfileProps {
  user: {
    id: string;
    username: string;
    friends?: string[];
  };
  trips: Trip[];
  allUsers?: UserData[];
  currentUser?: { id: string; username: string } | null;
  onAddFriend?: (userId: string, friendId: string) => void;
  onRemoveFriend?: (userId: string, friendId: string) => void;
}

function groupTripsByStatus(trips: Trip[]): Record<TripStatus, Trip[]> {
  const grouped: Record<TripStatus, Trip[]> = {
    current: [],
    upcoming: [],
    past: [],
  };

  trips.forEach((trip) => {
    const status = getStatusFromDates(trip.startDate, trip.endDate);
    grouped[status].push(trip);
  });

  return grouped;
}

export default function UserProfile({ 
  user, 
  trips, 
  allUsers = [], 
  currentUser,
  onAddFriend,
  onRemoveFriend,
}: UserProfileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFindFriends, setShowFindFriends] = useState(false);
  
  const groupedTrips = groupTripsByStatus(trips);
  const totalTrips = trips.length;
  const countriesVisited = new Set(trips.map(t => t.destination.split(',').pop()?.trim())).size;

  const friends = allUsers.filter(u => user.friends?.includes(u.id));
  const isOwnProfile = currentUser?.id === user.id;
  const isFriend = currentUser && user.friends?.includes(currentUser.id);

  const searchResults = searchQuery.trim() 
    ? allUsers.filter(u => 
        u.id !== user.id && 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.friends?.includes(u.id)
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Profile Header Card with Spotlight effect */}
      <SpotlightCard glowColor="gold" className="overflow-hidden">
        {/* Gradient Header */}
        <div className="h-32 bg-gradient-to-r from-compass-navy via-compass-maroon to-compass-gold -m-[1px] mt-[-1px] ml-[-1px] mr-[-1px]" />
        
        <div className="pt-0 pb-8 px-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-white shadow-editorial ring-4 ring-compass-gold/30">
              <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-5xl font-serif font-bold">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* User Info */}
            <div className="text-center md:text-left flex-1 pt-4 md:pt-0">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-compass-navy mb-1" data-testid="text-username">
                {user.username}
              </h1>
              <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-4 w-4 text-compass-gold" />
                Adventure seeker
              </p>
              
              {/* Friend actions */}
              {currentUser && !isOwnProfile && (
                <div className="mt-4">
                  {isFriend ? (
                    <NeonButton
                      variant="outline"
                      size="sm"
                      neonColor="maroon"
                      className="gap-2"
                      onClick={() => onRemoveFriend?.(currentUser.id, user.id)}
                      data-testid="button-remove-friend"
                    >
                      <UserMinus className="h-4 w-4" />
                      Remove Friend
                    </NeonButton>
                  ) : (
                    <NeonButton
                      variant="solid"
                      size="sm"
                      neonColor="gold"
                      className="gap-2"
                      onClick={() => onAddFriend?.(currentUser.id, user.id)}
                      data-testid="button-add-friend"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </NeonButton>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-compass-navy/5 min-w-[80px]">
                <Compass className="h-5 w-5 mx-auto mb-2 text-compass-navy" />
                <p className="text-2xl font-serif font-bold text-compass-navy">{totalTrips}</p>
                <p className="text-xs text-muted-foreground font-medium">Journeys</p>
              </div>
              <div className="p-4 rounded-2xl bg-compass-maroon/5 min-w-[80px]">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-compass-maroon" />
                <p className="text-2xl font-serif font-bold text-compass-maroon">{countriesVisited}</p>
                <p className="text-xs text-muted-foreground font-medium">Places</p>
              </div>
              <div className="p-4 rounded-2xl bg-compass-gold/10 min-w-[80px]">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-compass-gold" />
                <p className="text-2xl font-serif font-bold text-compass-navy">{groupedTrips.upcoming.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Upcoming</p>
              </div>
              <div className="p-4 rounded-2xl bg-compass-navy/5 min-w-[80px]">
                <Users className="h-5 w-5 mx-auto mb-2 text-compass-navy" />
                <p className="text-2xl font-serif font-bold text-compass-navy">{friends.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Friends</p>
              </div>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Friends Section */}
      <SpotlightCard glowColor="navy" className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <h2 className="text-xl font-serif text-compass-navy flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-compass-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-compass-gold" />
            </div>
            Friends ({friends.length})
          </h2>
          {isOwnProfile && (
            <NeonButton
              variant="outline"
              size="sm"
              neonColor="navy"
              className="gap-2"
              onClick={() => setShowFindFriends(!showFindFriends)}
              data-testid="button-find-friends"
            >
              {showFindFriends ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {showFindFriends ? 'Close' : 'Find Friends'}
            </NeonButton>
          )}
        </div>
        
        {/* Find Friends Search */}
        {showFindFriends && isOwnProfile && (
          <div className="mb-6 p-6 bg-compass-gold/5 rounded-2xl border border-compass-gold/20">
            <h3 className="font-serif font-semibold text-compass-navy mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-compass-gold" />
              Find New Friends
            </h3>
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-2xl border-compass-gold/30 focus:border-compass-gold h-12 mb-4"
              data-testid="input-search-friends"
            />
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.slice(0, 5).map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-compass-gold/30">
                        <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white font-semibold">
                          {u.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Link href={`/profile/${u.id}`}>
                        <span className="font-medium text-compass-navy hover:text-compass-maroon transition-colors cursor-pointer">
                          {u.username}
                        </span>
                      </Link>
                    </div>
                    <NeonButton
                      variant="solid"
                      size="sm"
                      neonColor="gold"
                      className="gap-1.5"
                      onClick={() => {
                        onAddFriend?.(user.id, u.id);
                        setSearchQuery('');
                      }}
                      data-testid={`button-add-${u.username}`}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </NeonButton>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found matching "{searchQuery}"
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type a username to find new friends
              </p>
            )}
          </div>
        )}

        {/* Friends Grid - Horizontal scroll */}
        {friends.length > 0 ? (
          <div className="horizontal-scroll">
            {friends.map((friend) => (
              <Link key={friend.id} href={`/profile/${friend.id}`}>
                <div 
                  className="flex flex-col items-center p-5 rounded-2xl bg-gradient-to-b from-compass-navy/5 to-transparent hover:from-compass-navy/10 transition-all cursor-pointer min-w-[120px]"
                  data-testid={`friend-card-${friend.id}`}
                >
                  <Avatar className="h-16 w-16 ring-2 ring-compass-gold/30 mb-3 shadow-soft">
                    <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-xl font-serif font-semibold">
                      {friend.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-compass-navy text-sm truncate max-w-full">
                    {friend.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-20 w-20 rounded-3xl bg-compass-navy/5 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-10 w-10 text-compass-navy/30" />
            </div>
            <p className="text-muted-foreground mb-4">No friends yet</p>
            {isOwnProfile && !showFindFriends && (
              <NeonButton
                variant="outline"
                size="sm"
                neonColor="navy"
                className="gap-2"
                onClick={() => setShowFindFriends(true)}
              >
                <Search className="h-4 w-4" />
                Find Friends
              </NeonButton>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* Trip Sections */}
      {groupedTrips.current.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-compass-gold shadow-sm animate-pulse" />
            <h2 className="text-2xl font-serif font-semibold text-compass-navy">
              Currently Traveling
            </h2>
          </div>
          <div className="masonry-grid">
            {groupedTrips.current.map((trip, idx) => (
              <div key={trip.id} className={`masonry-item animate-fade-in-up stagger-${idx + 1}`}>
                <TripCard trip={trip} showUser={false} />
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
                <TripCard trip={trip} showUser={false} />
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
                <TripCard trip={trip} showUser={false} />
              </div>
            ))}
          </div>
        </section>
      )}

      {trips.length === 0 && (
        <SpotlightCard glowColor="navy" className="py-16 text-center">
          <div className="h-24 w-24 rounded-3xl bg-compass-navy/5 mx-auto mb-6 flex items-center justify-center">
            <Compass className="h-12 w-12 text-compass-navy/30" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-compass-navy mb-2">No journeys yet</h3>
          <p className="text-muted-foreground">
            This traveler hasn't shared any adventures.
          </p>
        </SpotlightCard>
      )}
    </div>
  );
}
