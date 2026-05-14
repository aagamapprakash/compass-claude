import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import TripForm from '@/components/TripForm';
import type { TripFormSubmitData, PlannedStop } from '@/components/TripForm';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/auth-utils';

export default function NewTrip() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormSubmitData) => {
      const { stops, ...tripData } = data;
      const res = await apiRequest('POST', '/api/trips', {
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        transportMode: tripData.transportMode,
        description: tripData.description,
        allowJoinRequests: tripData.allowJoinRequests ?? true,
        isPublic: tripData.isPublic ?? false,
      });
      const trip = await res.json();

      if (stops && stops.length > 0) {
        for (const stop of stops) {
          await apiRequest('POST', `/api/trips/${trip.id}/stops`, {
            name: stop.name,
            placeId: stop.placeId || null,
            notes: stop.notes || null,
            startDate: stop.startDate || null,
            endDate: stop.endDate || null,
          });
        }
      }

      return trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: 'Journey created!',
        description: `Your trip to ${trip.destination} has been saved.`,
      });
      setLocation(`/trip/${trip.id}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: 'Unauthorized', description: 'Please sign in again.', variant: 'destructive' });
        setTimeout(() => { window.location.href = '/api/login'; }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to create trip. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: TripFormSubmitData) => {
    createTripMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background py-12 md:py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-compass-gold font-medium text-sm uppercase tracking-wider mb-2 block">
            New Adventure
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-compass-navy mb-4">
            Where to next?
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Share your upcoming journey with friends and create memories together.
          </p>
        </div>
        <div className="animate-fade-in-up">
          <TripForm onSubmit={handleSubmit} isLoading={createTripMutation.isPending} />
        </div>
      </div>
    </div>
  );
}
