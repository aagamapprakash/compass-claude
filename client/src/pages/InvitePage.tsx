import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Users, Compass, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import TransportIcon, { type TransportMode } from '@/components/TransportIcon';

interface InviteInfo {
  id: number;
  destination: string;
  startDate: string;
  endDate?: string | null;
  transportMode: string;
  description?: string | null;
  ownerName: string;
  memberCount: number;
}

interface InvitePageProps {
  code: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function InvitePage({ code }: InvitePageProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: invite, isLoading, error } = useQuery<InviteInfo>({
    queryKey: ['/api/invite', code],
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/invite/${code}/accept`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'You joined the trip!',
        description: `You're now a member of the ${invite?.destination} trip.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      setLocation(`/trip/${data.tripId}`);
    },
    onError: (error: Error) => {
      const message = error.message.includes('already')
        ? error.message.split(': ').pop()
        : 'Something went wrong. Please try again.';
      toast({
        title: 'Could not join',
        description: message,
        variant: 'destructive',
      });
      if (error.message.includes('already a member') || error.message.includes('owner')) {
        setLocation(`/trip/${invite?.id}`);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-compass-navy/5 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-compass-navy/5 flex items-center justify-center px-4">
        <SpotlightCard glowColor="maroon" className="max-w-md w-full text-center py-12 px-8">
          <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-compass-maroon/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-compass-maroon" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-compass-navy mb-3" data-testid="text-invite-error">
            Invite link not found
          </h2>
          <p className="text-muted-foreground mb-8">
            This invite link is invalid or has expired. Ask the trip organizer for a new one.
          </p>
          <Button
            onClick={() => setLocation('/')}
            className="bg-compass-navy text-white rounded-xl gap-2"
            data-testid="button-go-home"
          >
            <Compass className="h-4 w-4" />
            Go to Home
          </Button>
        </SpotlightCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-compass-navy/5 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-compass-gold to-compass-maroon mb-4 shadow-soft">
            <Compass className="h-7 w-7 text-white" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">You've been invited to join a trip</p>
        </div>

        <SpotlightCard glowColor="gold" className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-compass-navy via-compass-maroon to-compass-gold" />
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-compass-gold mt-1 flex-shrink-0" />
              <h1 className="text-2xl font-serif font-bold text-compass-navy" data-testid="text-invite-destination">
                {invite.destination}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-compass-navy/5">
                <Calendar className="h-4 w-4 text-compass-navy/60" />
                <div>
                  <p className="text-xs text-muted-foreground">Starts</p>
                  <p className="text-sm font-medium text-compass-navy">{formatDate(invite.startDate)}</p>
                </div>
              </div>
              {invite.endDate && invite.endDate !== invite.startDate && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-compass-navy/5">
                  <Calendar className="h-4 w-4 text-compass-navy/60" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ends</p>
                    <p className="text-sm font-medium text-compass-navy">{formatDate(invite.endDate)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <TransportIcon mode={invite.transportMode as TransportMode} size="sm" />
                <span className="capitalize">{invite.transportMode}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{invite.memberCount} {invite.memberCount === 1 ? 'member' : 'members'}</span>
              </div>
            </div>

            {invite.description && (
              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                {invite.description}
              </p>
            )}

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Organized by</p>
              <p className="font-medium text-compass-navy" data-testid="text-invite-owner">{invite.ownerName}</p>
            </div>
          </div>
        </SpotlightCard>

        {isAuthenticated ? (
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="w-full bg-compass-navy text-white rounded-xl gap-2 h-12 text-base"
            data-testid="button-accept-invite"
          >
            {acceptMutation.isPending ? (
              'Joining...'
            ) : (
              <>
                <Check className="h-5 w-5" />
                Join this trip
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <a href="/api/login" className="block">
              <Button
                className="w-full bg-compass-navy text-white rounded-xl gap-2 h-12 text-base"
                data-testid="button-sign-in-to-join"
              >
                <ArrowRight className="h-5 w-5" />
                Sign in to join this trip
              </Button>
            </a>
            <p className="text-center text-xs text-muted-foreground">
              You need to sign in before you can join this trip
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
