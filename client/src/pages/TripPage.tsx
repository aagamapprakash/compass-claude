import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import TripDetail from '@/components/TripDetail';
import type { TransportMode } from '@/components/TransportIcon';

interface TripData {
  id: number;
  destination: string;
  startDate: string;
  endDate?: string | null;
  transportMode: TransportMode;
  description?: string | null;
  userId: string;
  username?: string;
  allowJoinRequests?: boolean;
  isPublic?: boolean;
  inviteCode?: string | null;
  members?: { userId: string; name: string; role: string }[];
}

interface JoinRequestData {
  id: number;
  tripId: number;
  userId: string;
  status: string;
  username?: string;
  profileImageUrl?: string;
  createdAt: string;
}

interface TripPageProps {
  tripId: string;
}

export default function TripPage({ tripId }: TripPageProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { data: trip, isLoading: tripLoading } = useQuery<TripData>({
    queryKey: ['/api/trips', tripId],
  });

  const { data: joinRequests = [] } = useQuery<JoinRequestData[]>({
    queryKey: ['/api/trips', tripId, 'requests'],
    enabled: !!trip,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/trips/${tripId}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'requests'] });
      toast({ title: 'Request sent!', description: 'The trip organizer will be notified.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('PATCH', `/api/join-requests/${requestId}`, { status: 'approved' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      toast({ title: 'Approved!', description: 'The traveler has been added to your trip.' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('PATCH', `/api/join-requests/${requestId}`, { status: 'rejected' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId, 'requests'] });
      toast({ title: 'Declined', description: 'The request has been declined.' });
    },
  });

  if (tripLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <Card className="rounded-2xl border-compass-navy/10 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-compass-navy/5 mb-6">
              <Compass className="h-10 w-10 text-compass-navy/30" />
            </div>
            <h2 className="text-2xl font-bold text-compass-navy mb-2">Journey Not Found</h2>
            <p className="text-muted-foreground mb-8">
              This journey doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="gap-2 bg-compass-navy rounded-xl" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUser = isAuthenticated && user
    ? { id: user.id, username: user.firstName || user.email || 'User' }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 bg-gradient-to-b from-compass-navy/5 to-white min-h-screen">
      <TripDetail
        trip={trip}
        currentUser={currentUser}
        joinRequests={joinRequests}
        onRequestToJoin={() => joinMutation.mutate()}
        onApproveRequest={(id) => approveMutation.mutate(id)}
        onRejectRequest={(id) => rejectMutation.mutate(id)}
      />
    </div>
  );
}
