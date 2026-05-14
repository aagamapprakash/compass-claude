import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, User, Compass, Filter } from 'lucide-react';
import { Link } from 'wouter';
import TripCard from '@/components/TripCard';

type FilterType = 'all' | 'trips' | 'users';

export default function SearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const { data: searchResults, isLoading } = useQuery<{ trips: any[]; users: any[] }>({
    queryKey: ['/api/search', `?q=${encodeURIComponent(query)}`],
    enabled: query.trim().length > 0,
  });

  const handleSearch = () => {
    setQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const trips = filterType === 'users' ? [] : (searchResults?.trips || []);
  const users = filterType === 'trips' ? [] : (searchResults?.users || []);
  const hasResults = trips.length > 0 || users.length > 0;
  const showEmptyState = query.trim() && !isLoading && !hasResults;

  return (
    <div className="min-h-screen bg-background py-12 md:py-20 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-compass-gold font-medium text-sm uppercase tracking-wider mb-2 block">
            Explore
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-compass-navy mb-4">
            Search Journeys
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Find destinations, travelers, and adventures that inspire you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search destinations, travelers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-16 pl-14 pr-6 rounded-3xl border-2 border-border bg-white focus:border-compass-navy focus:ring-4 focus:ring-compass-navy/10 text-lg shadow-soft"
              data-testid="input-search"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            <Filter className="h-4 w-4 text-muted-foreground mr-2" />
            {(['all', 'trips', 'users'] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className={`rounded-full ${
                  filterType === type
                    ? 'bg-compass-navy text-white'
                    : 'border-compass-navy/20 text-compass-navy'
                }`}
                data-testid={`filter-${type}`}
              >
                {type === 'all' ? 'All' : type === 'trips' ? 'Trips Only' : 'Users Only'}
              </Button>
            ))}
          </div>
        </div>

        {!query.trim() && (
          <div className="text-center py-20 animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-compass-gold/10 mx-auto mb-8 flex items-center justify-center">
              <Compass className="h-12 w-12 text-compass-gold" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-compass-navy mb-3">
              Start exploring
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Search for destinations, travelers, or adventures to discover your next journey.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        )}

        {showEmptyState && (
          <div className="text-center py-20 animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-compass-maroon/10 mx-auto mb-8 flex items-center justify-center">
              <Search className="h-12 w-12 text-compass-maroon/50" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-compass-navy mb-3">
              No results found
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              We couldn't find any matches for "{query}". Try a different search term.
            </p>
          </div>
        )}

        {hasResults && (
          <div className="space-y-12 animate-fade-in-up">
            {users.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-compass-gold/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-compass-gold" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Travelers ({users.length})
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {users.map((u: any) => (
                    <Link key={u.id} href={`/profile/${u.id}`}>
                      <Card
                        className="rounded-3xl border-0 shadow-soft p-6 text-center cursor-pointer hover-elevate"
                        data-testid={`user-card-${u.id}`}
                      >
                        <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-compass-gold/30 shadow-soft">
                          {u.profileImageUrl && <AvatarImage src={u.profileImageUrl} />}
                          <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white text-2xl font-serif font-bold">
                            {(u.firstName || u.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-serif font-semibold text-compass-navy truncate">
                          {u.firstName
                            ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
                            : u.email || 'Traveler'}
                        </h3>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {trips.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-compass-navy/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-compass-navy" />
                  </div>
                  <h2 className="text-2xl font-serif font-semibold text-compass-navy">
                    Destinations ({trips.length})
                  </h2>
                </div>
                <div className="masonry-grid">
                  {trips.map((trip: any, idx: number) => (
                    <div
                      key={trip.id}
                      className={`masonry-item animate-fade-in-up stagger-${(idx % 6) + 1}`}
                    >
                      <TripCard trip={trip} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
