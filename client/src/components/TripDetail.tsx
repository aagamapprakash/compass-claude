import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Calendar, User, Users, UserPlus, HandHeart, Check, X, Clock,
  Heart, Globe, Lock, Link2, Copy, RefreshCw,
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import TransportIcon, { type TransportMode } from './TransportIcon';
import StatusBadge, { getStatusFromDates } from './StatusBadge';
import MapView from './MapView';
import TripStops from './TripStops';
import TripBalances from './TripBalances';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface JoinRequestData {
  id: number;
  tripId: number;
  userId: string;
  status: string;
  username?: string;
  profileImageUrl?: string;
  createdAt: string;
}

interface TripDetailProps {
  trip: {
    id: number;
    destination: string;
    startDate: string;
    endDate?: string | null;
    transportMode: TransportMode;
    description?: string | null;
    userId: string;
    username?: string;
    invitedFriends?: string[];
    allowJoinRequests?: boolean;
    isPublic?: boolean;
    inviteCode?: string | null;
    members?: { userId: string; name: string; role: string }[];
  };
  onInviteFriend?: () => void;
  currentUser?: { id: string; username: string } | null;
  joinRequests?: JoinRequestData[];
  onRequestToJoin?: (tripId: number) => void;
  onApproveRequest?: (requestId: number) => void;
  onRejectRequest?: (requestId: number) => void;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export default function TripDetail({
  trip,
  onInviteFriend,
  currentUser,
  joinRequests = [],
  onRequestToJoin,
  onApproveRequest,
  onRejectRequest,
}: TripDetailProps) {
  const { toast } = useToast();
  const status = getStatusFromDates(trip.startDate, trip.endDate);

  const isOwner = currentUser?.id === trip.userId;
  const isMember = trip.members?.some(m => m.userId === currentUser?.id) || isOwner;
  const isUpcoming = status === 'upcoming';
  const allowsJoinRequests = trip.allowJoinRequests !== false;
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');
  const userPendingRequest = joinRequests.find(r => r.userId === currentUser?.id && r.status === 'pending');
  const userApprovedRequest = joinRequests.find(r => r.userId === currentUser?.id && r.status === 'approved');

  const allMembers = [
    ...(trip.members || []),
    ...(!( trip.members || []).some(m => m.userId === trip.userId) && trip.userId
      ? [{ userId: trip.userId, name: trip.username || 'Owner', role: 'owner' }]
      : []),
  ];

  const { data: likeInfo } = useQuery<{ likeCount: number; isLiked: boolean }>({
    queryKey: ['/api/trips', trip.id, 'like-info'],
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (likeInfo?.isLiked) {
        await apiRequest('DELETE', `/api/trips/${trip.id}/like`);
      } else {
        await apiRequest('POST', `/api/trips/${trip.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', trip.id, 'like-info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed/public'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', trip.userId, 'trips'] });
    },
  });

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/trips/${trip.id}/invite-code`);
      return res.json();
    },
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/invite/${data.inviteCode}`;
      navigator.clipboard.writeText(inviteUrl).catch(() => {});
      toast({ title: 'Invite link copied!', description: 'Share this link with friends.' });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', trip.id] });
    },
  });

  const handleCopyInviteLink = () => {
    if (trip.inviteCode) {
      const inviteUrl = `${window.location.origin}/invite/${trip.inviteCode}`;
      navigator.clipboard.writeText(inviteUrl).catch(() => {});
      toast({ title: 'Link copied!', description: 'Share this link with friends.' });
    }
  };

  const handleRequestToJoin = () => {
    if (!currentUser) {
      toast({ title: 'Sign in required', description: 'Please sign in to request to join.', variant: 'destructive' });
      return;
    }
    onRequestToJoin?.(trip.id);
    toast({ title: 'Request sent!', description: 'The organizer will be notified.' });
  };

  const chipClass = 'border border-foreground px-2 py-1 font-mono text-xs bg-muted/30 flex items-center gap-1';

  return (
    <div>
      {/* ── Header ── */}
      <div className="border-b-2 border-foreground pb-6 mb-6">
        <Link href="/">
          <button className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors" data-testid="button-back">
            <ArrowLeft className="h-3 w-3" /> Back to Journeys
          </button>
        </Link>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight" data-testid="text-destination">
              {trip.destination}
            </h1>

            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <span className={chipClass}>
                <Calendar className="h-3 w-3" />
                {formatShortDate(trip.startDate)}
                {trip.endDate && trip.endDate !== trip.startDate ? ` – ${formatShortDate(trip.endDate)}` : ''}
              </span>

              {allMembers.length > 0 && (
                <span className={chipClass}>
                  <Users className="h-3 w-3" />
                  {allMembers.length} Member{allMembers.length !== 1 ? 's' : ''}
                </span>
              )}

              {trip.isPublic !== undefined && (
                <span className={chipClass}>
                  {trip.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {trip.isPublic ? 'Public Record' : 'Private'}
                </span>
              )}

              <span className={chipClass}>
                <TransportIcon mode={trip.transportMode} size="sm" />
                <span className="capitalize">{trip.transportMode}</span>
              </span>

              <StatusBadge status={status} />

              {currentUser && (
                <button
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className={`${chipClass} hover:bg-muted/60 transition-colors`}
                  data-testid="button-like-trip"
                >
                  <Heart className={`h-3 w-3 ${likeInfo?.isLiked ? 'fill-compass-maroon text-compass-maroon' : ''}`} />
                  {likeInfo?.likeCount ?? 0}
                </button>
              )}
            </div>
          </div>

          {/* Join requests notification (owner) */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="border-2 border-foreground hard-shadow bg-primary/10 p-3 flex items-start gap-2 md:w-64 flex-shrink-0">
              <HandHeart className="h-4 w-4 mt-0.5 text-compass-navy flex-shrink-0" />
              <div>
                <p className="font-mono text-xs font-bold">
                  {pendingRequests.length} Join Request{pendingRequests.length !== 1 ? 's' : ''}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Awaiting your approval.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Left — Itinerary */}
        <div className="md:col-span-7">
          <h2 className="font-serif text-xl font-semibold border-b-2 border-foreground pb-2 mb-6">
            Itinerary Record
          </h2>
          <TripStops
            tripId={trip.id}
            canEdit={isOwner || isMember}
            currentUserId={currentUser?.id}
            isOwner={isOwner}
            isMember={isMember}
            members={(() => {
              const list = trip.members?.map(m => ({ userId: m.userId, name: m.name, role: m.role })) || [];
              if (!list.some(m => m.userId === trip.userId) && trip.userId) {
                return [{ userId: trip.userId, name: trip.username || 'Owner', role: 'owner' }, ...list];
              }
              return list;
            })()}
          />

          {/* Pending join requests (owner) — full list below stops */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="mt-8 border-2 border-foreground hard-shadow p-5">
              <h3 className="font-serif text-lg font-semibold border-b-2 border-foreground pb-2 mb-4 flex items-center gap-2">
                <HandHeart className="h-4 w-4" />
                Pending Requests ({pendingRequests.length})
              </h3>
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 border border-foreground/30 p-3"
                    data-testid={`request-item-${request.id}`}
                  >
                    <div className="w-9 h-9 border-2 border-foreground bg-compass-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-xs font-bold">
                        {(request.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold truncate">{request.username}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApproveRequest?.(request.id)}
                        className="border-2 border-foreground bg-compass-navy text-white rounded-none font-mono text-xs"
                        data-testid={`button-approve-${request.id}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRejectRequest?.(request.id)}
                        className="border-2 border-compass-maroon text-compass-maroon rounded-none font-mono text-xs"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Sidebar cards */}
        <div className="md:col-span-5 flex flex-col gap-6">

          {/* Join CTA */}
          {!isMember && isUpcoming && currentUser && allowsJoinRequests && (
            <div className="border-2 border-foreground hard-shadow p-5">
              <div className="text-center">
                {userPendingRequest ? (
                  <>
                    <div className="border-2 border-foreground w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-compass-gold" />
                    </div>
                    <h3 className="font-serif text-base font-semibold mb-1">Request Pending</h3>
                    <p className="font-mono text-xs text-muted-foreground">Awaiting organizer approval.</p>
                  </>
                ) : userApprovedRequest ? (
                  <>
                    <div className="border-2 border-foreground w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-serif text-base font-semibold mb-1">You're In!</h3>
                    <p className="font-mono text-xs text-muted-foreground">Your request was approved.</p>
                  </>
                ) : (
                  <>
                    <div className="border-2 border-foreground w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <HandHeart className="h-6 w-6 text-compass-gold" />
                    </div>
                    <h3 className="font-serif text-base font-semibold mb-2">Join This Adventure!</h3>
                    <p className="font-mono text-xs text-muted-foreground mb-4">Request to join and the organizer will be notified.</p>
                    <button
                      onClick={handleRequestToJoin}
                      className="w-full border-2 border-foreground bg-compass-navy text-white font-mono text-xs hard-shadow py-2 hover:bg-compass-navy/90 transition-colors"
                      data-testid="button-request-join"
                    >
                      Request to Join
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Field Notes (description) */}
          <div className="border-2 border-foreground hard-shadow bg-muted/10 p-5">
            <div className="flex justify-between items-center border-b-2 border-foreground pb-2 mb-3">
              <h3 className="font-serif text-lg font-semibold">Field Notes</h3>
            </div>
            <div className="font-serif text-sm text-muted-foreground leading-relaxed" data-testid="text-description">
              {trip.description || <em>No field notes for this journey.</em>}
            </div>
          </div>

          {/* Expense Ledger (balances) — members only */}
          {isMember && (
            <div className="border-2 border-foreground hard-shadow p-5">
              <div className="border-b-2 border-foreground pb-2 mb-4">
                <h3 className="font-serif text-lg font-semibold">Expense Ledger</h3>
              </div>
              <TripBalances tripId={trip.id} />
            </div>
          )}

          {/* Travel Party */}
          <div className="border-2 border-foreground hard-shadow p-5">
            <div className="flex justify-between items-center border-b-2 border-foreground pb-2 mb-3">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Travel Party
              </h3>
            </div>

            {trip.username && (
              <Link href={`/profile/${trip.userId}`}>
                <div
                  className="flex items-center gap-2 p-2 border border-foreground/30 hover:bg-muted/30 mb-3 cursor-pointer transition-colors"
                  data-testid="link-user-profile"
                >
                  <div className="w-8 h-8 border border-foreground bg-compass-navy/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-xs font-bold">{trip.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold">{trip.username}</p>
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <User className="h-2.5 w-2.5" /> Organizer
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {trip.members && trip.members.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {trip.members.map(member => (
                  <span key={member.userId} className="border border-foreground px-2 py-0.5 font-mono text-xs">
                    {member.name}
                  </span>
                ))}
              </div>
            ) : !isOwner ? (
              <p className="font-mono text-xs text-muted-foreground text-center py-2">No companions yet</p>
            ) : null}

            {isOwner && (
              <button
                onClick={onInviteFriend}
                className="w-full border-2 border-foreground font-mono text-xs hard-shadow py-2 hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 mt-2"
                data-testid={trip.members && trip.members.length > 0 ? 'button-invite-more' : 'button-invite-friends'}
              >
                <UserPlus className="h-3 w-3" />
                {trip.members && trip.members.length > 0 ? 'Invite More' : 'Invite Friends'}
              </button>
            )}
          </div>

          {/* Location */}
          <div className="border-2 border-foreground hard-shadow overflow-hidden">
            <div className="border-b-2 border-foreground px-4 py-3">
              <h3 className="font-serif text-lg font-semibold">Location</h3>
            </div>
            <MapView destination={trip.destination} />
          </div>

          {/* Invite Link — owner only */}
          {isOwner && (
            <div className="border-2 border-foreground hard-shadow p-5">
              <div className="border-b-2 border-foreground pb-2 mb-3">
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Invite Link
                </h3>
              </div>
              <p className="font-serif text-sm text-muted-foreground mb-3">
                Share this link to let others join instantly.
              </p>
              {trip.inviteCode ? (
                <div className="space-y-2">
                  <div className="border border-foreground bg-muted/20 p-2">
                    <code className="font-mono text-[10px] text-foreground break-all" data-testid="text-invite-link">
                      {window.location.origin}/invite/{trip.inviteCode}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyInviteLink}
                      className="flex-1 border-2 border-foreground font-mono text-xs hard-shadow py-1.5 hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
                      data-testid="button-copy-invite"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={() => generateInviteMutation.mutate()}
                      disabled={generateInviteMutation.isPending}
                      className="border border-foreground font-mono text-xs py-1.5 px-3 hover:bg-muted/30 transition-colors flex items-center gap-1"
                      data-testid="button-regenerate-invite"
                    >
                      <RefreshCw className={`h-3 w-3 ${generateInviteMutation.isPending ? 'animate-spin' : ''}`} />
                      New
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => generateInviteMutation.mutate()}
                  disabled={generateInviteMutation.isPending}
                  className="w-full border-2 border-foreground font-mono text-xs hard-shadow py-2 hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
                  data-testid="button-generate-invite"
                >
                  <Link2 className="h-3 w-3" />
                  {generateInviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
