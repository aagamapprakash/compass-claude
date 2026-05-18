import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Check, X, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('PATCH', `/api/join-requests/${requestId}`, { status: 'approved' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: 'Approved!', description: 'The traveler has been added to your trip.' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest('PATCH', `/api/join-requests/${requestId}`, { status: 'rejected' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: 'Declined', description: 'The request has been declined.' });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <Card className="rounded-2xl border-compass-navy/10 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-compass-navy/5 mb-6">
              <Bell className="h-10 w-10 text-compass-navy/30" />
            </div>
            <h2 className="text-2xl font-bold text-compass-navy mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your notifications.
            </p>
            <a href="/api/login">
              <Button className="gap-2 bg-compass-navy" data-testid="button-login-redirect">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
      <Link href="/">
        <Button variant="ghost" className="gap-2 text-compass-navy hover:bg-compass-navy/5 mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to Journeys
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 bg-gradient-to-br from-compass-gold to-compass-maroon rounded-2xl flex items-center justify-center">
          <Bell className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-compass-navy">Notifications</h1>
          <p className="text-muted-foreground">Manage your trip join requests</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-compass-navy">
            Pending Requests ({notifications.length})
          </h2>
          {notifications.map((notification: any) => (
            <Card key={notification.id} className="rounded-2xl border-compass-gold/30 shadow-lg" data-testid={`card-request-${notification.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border-2 border-compass-navy/20">
                    {notification.profileImageUrl && (
                      <AvatarImage src={notification.profileImageUrl} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-compass-navy to-compass-maroon text-white font-semibold">
                      {(notification.requesterName || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-compass-navy">
                      <span className="text-compass-maroon">{notification.requesterName}</span> wants to join your trip
                    </p>
                    {notification.tripDestination && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="font-medium">{notification.tripDestination}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(notification.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 text-white rounded-xl gap-1"
                      data-testid={`button-approve-${notification.id}`}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(notification.id)}
                      disabled={rejectMutation.isPending}
                      className="border-red-300 text-red-600 rounded-xl gap-1"
                      data-testid={`button-reject-${notification.id}`}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-compass-navy/10 shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-compass-navy/5 mb-4">
              <Bell className="h-8 w-8 text-compass-navy/30" />
            </div>
            <h2 className="text-xl font-semibold text-compass-navy mb-2">No Pending Requests</h2>
            <p className="text-muted-foreground">
              You don't have any pending join requests for your trips.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
