import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { NeonButton } from '@/components/ui/neon-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Calendar, MapPin, Compass, Users, X, UserPlus, Plane, Train, Car, Bus, Map, HandHeart, Plus, Trash2, ChevronUp, ChevronDown, FileText, Route, Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useState, useCallback } from 'react';
import type { TransportMode } from './TransportIcon';
import PlacesSearch, { type PlaceSuggestion } from './PlacesSearch';

const tripFormSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  transportMode: z.enum(['airplane', 'train', 'car', 'bus', 'other']),
  description: z.string().optional(),
  invitedFriends: z.array(z.string()).optional(),
  allowJoinRequests: z.boolean().optional(),
  isPublic: z.boolean().optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type TripFormData = z.infer<typeof tripFormSchema>;

export interface PlannedStop {
  name: string;
  placeId?: string;
  notes?: string;
  startDate?: string;
  endDate?: string;
}

export interface TripFormSubmitData extends TripFormData {
  stops?: PlannedStop[];
}

interface TripFormProps {
  onSubmit: (data: TripFormSubmitData) => void;
  isLoading?: boolean;
  availableFriends?: string[];
}

const transportOptions: { value: TransportMode; label: string; icon: React.ReactNode }[] = [
  { value: 'airplane', label: 'Airplane', icon: <Plane className="h-4 w-4" /> },
  { value: 'train', label: 'Train', icon: <Train className="h-4 w-4" /> },
  { value: 'car', label: 'Car', icon: <Car className="h-4 w-4" /> },
  { value: 'bus', label: 'Bus', icon: <Bus className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Map className="h-4 w-4" /> },
];

export default function TripForm({ onSubmit, isLoading = false, availableFriends = [] }: TripFormProps) {
  const [friendInput, setFriendInput] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [stops, setStops] = useState<PlannedStop[]>([]);
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopName, setStopName] = useState('');
  const [stopPlaceId, setStopPlaceId] = useState<string | undefined>();
  const [stopNotes, setStopNotes] = useState('');
  const [stopStartDate, setStopStartDate] = useState('');
  const [stopEndDate, setStopEndDate] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      destination: '',
      startDate: '',
      endDate: '',
      transportMode: 'airplane',
      description: '',
      invitedFriends: [],
      allowJoinRequests: true,
      isPublic: false,
    },
  });

  const transportMode = watch('transportMode');
  const allowJoinRequests = watch('allowJoinRequests');
  const isPublic = watch('isPublic');

  const addFriend = () => {
    if (friendInput.trim() && !invitedFriends.includes(friendInput.trim())) {
      const newFriends = [...invitedFriends, friendInput.trim()];
      setInvitedFriends(newFriends);
      setValue('invitedFriends', newFriends);
      setFriendInput('');
    }
  };

  const removeFriend = (friend: string) => {
    const newFriends = invitedFriends.filter(f => f !== friend);
    setInvitedFriends(newFriends);
    setValue('invitedFriends', newFriends);
  };

  const resetStopForm = useCallback(() => {
    setStopName('');
    setStopPlaceId(undefined);
    setStopNotes('');
    setStopStartDate('');
    setStopEndDate('');
    setShowStopForm(false);
  }, []);

  const addStop = useCallback(() => {
    if (!stopName.trim()) return;
    setStops(prev => [...prev, {
      name: stopName.trim(),
      placeId: stopPlaceId,
      notes: stopNotes.trim() || undefined,
      startDate: stopStartDate || undefined,
      endDate: stopEndDate || undefined,
    }]);
    resetStopForm();
  }, [stopName, stopPlaceId, stopNotes, stopStartDate, stopEndDate, resetStopForm]);

  const removeStop = useCallback((index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveStop = useCallback((index: number, direction: 'up' | 'down') => {
    setStops(prev => {
      const newStops = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= newStops.length) return prev;
      [newStops[index], newStops[swapIndex]] = [newStops[swapIndex], newStops[index]];
      return newStops;
    });
  }, []);

  const handleFormSubmit = (data: TripFormData) => {
    onSubmit({
      ...data,
      invitedFriends,
      allowJoinRequests: data.allowJoinRequests ?? true,
      isPublic: data.isPublic ?? false,
      stops: stops.length > 0 ? stops : undefined,
    });
  };

  return (
    <SpotlightCard 
      glowColor="gold"
      className="max-w-2xl mx-auto p-8"
    >
      <div className="pb-4 mb-6 border-b border-border/30">
        <div className="flex items-center gap-4 text-compass-navy">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-compass-navy to-compass-maroon flex items-center justify-center shadow-soft">
            <Compass className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-3xl font-serif font-bold block">Plan Your Journey</span>
            <span className="text-sm text-muted-foreground font-sans font-normal">Create a new adventure</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        <div className="space-y-3">
          <Label htmlFor="destination" className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-compass-gold" />
            Destination
          </Label>
          <PlacesSearch
            placeholder="Search for any city, place, or address..."
            defaultType="destination"
            showTypeFilter={false}
            onSelect={(suggestion: PlaceSuggestion) => {
              setValue('destination', suggestion.description);
            }}
          />
          {errors.destination && (
            <p className="text-sm text-compass-maroon">{errors.destination.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="startDate" className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-compass-gold" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              className="rounded-2xl border-2 border-border focus:border-compass-navy h-14 px-5"
              {...register('startDate')}
              data-testid="input-start-date"
            />
            {errors.startDate && (
              <p className="text-sm text-compass-maroon">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="endDate" className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-compass-gold" />
              End Date
              <span className="text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              className="rounded-2xl border-2 border-border focus:border-compass-navy h-14 px-5"
              {...register('endDate')}
              data-testid="input-end-date"
            />
            {errors.endDate && (
              <p className="text-sm text-compass-maroon">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="transportMode" className="text-compass-navy font-medium text-sm uppercase tracking-wider">
            Transport Mode
          </Label>
          <Select
            value={transportMode}
            onValueChange={(value) => setValue('transportMode', value as TransportMode)}
          >
            <SelectTrigger className="rounded-2xl border-2 border-border h-14 px-5" data-testid="select-transport">
              <SelectValue placeholder="Select transport mode" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {transportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-xl py-3">
                  <span className="flex items-center gap-3">
                    <span className="text-compass-navy">{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-compass-navy font-medium text-sm uppercase tracking-wider">
            Description
            <span className="text-muted-foreground font-normal normal-case tracking-normal ml-2">(Optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="What are you planning to do? Share some highlights..."
            className="min-h-32 resize-y rounded-2xl border-2 border-border focus:border-compass-navy p-5 text-base"
            {...register('description')}
            data-testid="input-description"
          />
        </div>

        <div className="space-y-4 p-6 bg-compass-navy/5 rounded-3xl border border-compass-navy/15">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
              <Route className="h-4 w-4 text-compass-gold" />
              Itinerary Stops
              <span className="text-muted-foreground font-normal normal-case tracking-normal">(Optional)</span>
            </Label>
            {!showStopForm && (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowStopForm(true)}
                className="bg-compass-gold text-compass-navy rounded-xl gap-1"
                data-testid="button-add-stop-form"
              >
                <Plus className="h-4 w-4" />
                Add Stop
              </Button>
            )}
          </div>

          {stops.length === 0 && !showStopForm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Plan your route by adding stops along the way
            </p>
          )}

          {stops.length > 0 && (
            <div className="relative">
              <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-compass-gold via-compass-navy/20 to-compass-maroon/30" />
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={index}
                    className="relative flex items-start gap-3 pl-0.5"
                    data-testid={`planned-stop-${index}`}
                  >
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-compass-navy text-white text-xs font-semibold p-0">
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 p-3 bg-background rounded-xl border border-border min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-compass-navy text-sm truncate">{stop.name}</p>
                          {(stop.startDate || stop.endDate) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {stop.startDate && new Date(stop.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {stop.startDate && stop.endDate && ' - '}
                              {stop.endDate && new Date(stop.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                          {stop.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{stop.notes}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => moveStop(index, 'up')}
                            disabled={index === 0}
                            className="text-compass-navy/50"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => moveStop(index, 'down')}
                            disabled={index === stops.length - 1}
                            className="text-compass-navy/50"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStop(index)}
                            className="text-compass-maroon/60"
                            data-testid={`button-remove-stop-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showStopForm && (
            <div className="p-4 bg-compass-gold/5 rounded-2xl border border-compass-gold/20 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-compass-navy flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-compass-gold" />
                  Stop Name
                </label>
                <PlacesSearch
                  onSelect={(s: PlaceSuggestion) => {
                    setStopName(s.description);
                    setStopPlaceId(s.placeId);
                  }}
                  placeholder="Search for a place..."
                  defaultType="attraction"
                  showTypeFilter={false}
                />
                <Input
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  placeholder="Or type a name manually"
                  className="rounded-xl border-compass-navy/20"
                  data-testid="input-stop-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-compass-navy/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={stopStartDate}
                    onChange={(e) => setStopStartDate(e.target.value)}
                    className="rounded-xl border-compass-navy/20"
                    data-testid="input-stop-start-date"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-compass-navy/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={stopEndDate}
                    onChange={(e) => setStopEndDate(e.target.value)}
                    className="rounded-xl border-compass-navy/20"
                    data-testid="input-stop-end-date"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-compass-navy/70 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Notes
                </label>
                <Textarea
                  value={stopNotes}
                  onChange={(e) => setStopNotes(e.target.value)}
                  placeholder="Any details about this stop..."
                  className="rounded-xl border-compass-navy/20 min-h-[60px] resize-y"
                  data-testid="input-stop-notes"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetStopForm}
                  className="rounded-xl text-compass-navy/60"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addStop}
                  disabled={!stopName.trim()}
                  className="bg-compass-navy text-white rounded-xl gap-1"
                  data-testid="button-save-stop"
                >
                  <Plus className="h-4 w-4" />
                  Add to Itinerary
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-6 bg-compass-gold/5 rounded-3xl border border-compass-gold/20">
          <Label className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
            <Users className="h-4 w-4 text-compass-gold" />
            Invite Friends
          </Label>
          <div className="flex gap-3">
            <Input
              placeholder="Enter friend's username"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFriend())}
              className="rounded-2xl border-2 border-compass-gold/30 focus:border-compass-gold h-12 flex-1"
              data-testid="input-invite-friend"
            />
            <Button 
              type="button" 
              onClick={addFriend}
              className="bg-compass-gold text-compass-navy rounded-2xl h-12 px-5 shadow-soft"
              data-testid="button-add-friend"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
          {invitedFriends.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {invitedFriends.map((friend) => (
                <Badge 
                  key={friend} 
                  className="bg-compass-navy text-white rounded-full pl-4 pr-2 py-2 flex items-center gap-2 text-sm"
                >
                  {friend}
                  <button
                    type="button"
                    onClick={() => removeFriend(friend)}
                    className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center transition-colors"
                    data-testid={`button-remove-friend-${friend}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Invited friends will be able to see and join your trip
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 p-6 bg-compass-navy/5 rounded-3xl border border-compass-navy/15">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-compass-navy/10 flex items-center justify-center">
              {isPublic ? <Globe className="h-5 w-5 text-compass-navy" /> : <Lock className="h-5 w-5 text-compass-navy/60" />}
            </div>
            <div>
              <Label htmlFor="isPublic" className="text-compass-navy font-medium cursor-pointer">
                {isPublic ? 'Public trip' : 'Private trip'}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic ? 'Visible to everyone on the Explore feed' : 'Only visible to you and trip members'}
              </p>
            </div>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={(checked) => setValue('isPublic', checked)}
            data-testid="switch-is-public"
          />
        </div>

        <div className="flex items-center justify-between gap-2 p-6 bg-compass-maroon/5 rounded-3xl border border-compass-maroon/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-compass-maroon/10 flex items-center justify-center">
              <HandHeart className="h-5 w-5 text-compass-maroon" />
            </div>
            <div>
              <Label htmlFor="allowJoinRequests" className="text-compass-navy font-medium cursor-pointer">
                Allow requests to join
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Others can request to join this trip
              </p>
            </div>
          </div>
          <Switch
            id="allowJoinRequests"
            checked={allowJoinRequests}
            onCheckedChange={(checked) => setValue('allowJoinRequests', checked)}
            data-testid="switch-allow-join"
          />
        </div>

        <NeonButton 
          type="submit" 
          variant="solid"
          size="lg"
          neonColor="gold"
          className="w-full h-14 shadow-editorial text-lg" 
          disabled={isLoading}
          data-testid="button-submit-trip"
        >
          {isLoading ? 'Creating...' : 'Create Journey'}
        </NeonButton>
      </form>
    </SpotlightCard>
  );
}
