import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Users, UserPlus, HandHeart, Check, X, Clock, Heart, Globe, Lock, Link2, Copy, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import TransportIcon, { type TransportMode } from './TransportIcon';
import StatusBadge, { getStatusFromDates, getStatusColor } from './StatusBadge';
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
  const statusColor = getStatusColor(status);
  
  const isOwner = currentUser?.id === trip.userId;
  const isMember = trip.members?.some(m => m.userId === currentUser?.id) || isOwner;
  const isUpcoming = status === 'upcoming';
  const allowsJoinRequests = trip.allowJoinRequests !== false;
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');
  const userPendingRequest = joinRequests.find(
    (r) => r.userId === currentUser?.id && r.status === 'pending'
  );
  const userApprovedRequest = joinRequests.find(
    (r) => r.userId === currentUser?.id && r.status === 'approved'
  );

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
      navigator.clipboard.writeText(inviteUrl).then(() => {
        toast({
          title: 'Invite link copied!',
          description: 'Share this link with friends to invite them to your trip.',
        });
      }).catch(() => {
        toast({
          title: 'Invite link generated',
          description: inviteUrl,
        });
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips', trip.id] });
    },
  });

  const handleCopyInviteLink = () => {
    if (trip.inviteCode) {
      const inviteUrl = `${window.location.origin}/invite/${trip.inviteCode}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        toast({
          title: 'Link copied!',
          description: 'Share this link with friends to invite them.',
        });
      }).catch(() => {
        toast({
          title: 'Invite link',
          description: inviteUrl,
        });
      });
    }
  };

  const handleRequestToJoin = () => {
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to request to join this trip.',
        variant: 'destructive',
      });
      return;
    }
    if (onRequestToJoin) {
      onRequestToJoin(trip.id);
      toast({
        title: 'Request sent!',
        description: 'The trip organizer will be notified of your request.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/">
        <Button variant="ghost" className="gap-2 text-[#00357a] hover:bg-[#00357a]/5 rounded-xl" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Back to Journeys
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden rounded-2xl border-[#00357a]/10 shadow-lg">
            <div 
              className="h-2"
              style={{ background: `linear-gradient(to right, ${statusColor}, ${statusColor}88)` }}
            />
            <div className="relative bg-gradient-to-br from-[#00357a]/10 to-[#7B1E3C]/10 aspect-[21/9] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
              <TransportIcon mode={trip.transportMode} size="lg" />
            </div>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#00357a]" data-testid="text-destination">
                  {trip.destination}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {trip.isPublic !== undefined && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      {trip.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {trip.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  )}
                  {currentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeMutation.mutate()}
                      disabled={likeMutation.isPending}
                      className="gap-1.5 rounded-xl"
                      data-testid="button-like-trip"
                    >
                      <Heart className={`h-4 w-4 ${likeInfo?.isLiked ? 'fill-compass-maroon text-compass-maroon' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{likeInfo?.likeCount ?? 0}</span>
                    </Button>
                  )}
                  <StatusBadge status={status} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[#00357a]/60 mb-6">
                <div className="flex items-center gap-2 bg-[#00357a]/5 px-3 py-1.5 rounded-lg">
                  <TransportIcon mode={trip.transportMode} size="sm" />
                  <span className="capitalize font-medium">{trip.transportMode}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-lg mb-6 text-[#00357a]">
                <Calendar className="h-5 w-5 text-[#00357a]/60" />
                <span className="font-medium">{formatDate(trip.startDate)}</span>
                {trip.endDate && trip.endDate !== trip.startDate && (
                  <>
                    <span className="text-[#00357a]/40">to</span>
                    <span className="font-medium">{formatDate(trip.endDate)}</span>
                  </>
                )}
              </div>

              {trip.description && (
                <div className="p-4 bg-[#00357a]/5 rounded-xl">
                  <h3 className="font-semibold text-[#00357a] mb-2">About this journey</h3>
                  <p className="text-[#00357a]/70 leading-relaxed" data-testid="text-description">
                    {trip.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <TripStops
            tripId={trip.id}
            canEdit={isOwner || isMember}
            currentUserId={currentUser?.id}
            isOwner={isOwner}
            isMember={isMember}
            members={(() => {
              const memberList = trip.members?.map(m => ({ userId: m.userId, name: m.name, role: m.role })) || [];
              const ownerInList = memberList.some(m => m.userId === trip.userId);
              if (!ownerInList && trip.userId) {
                return [{ userId: trip.userId, name: trip.username || 'Owner', role: 'owner' }, ...memberList];
              }
              return memberList;
            })()}
          />

          {isOwner && pendingRequests.length > 0 && (
            <Card className="rounded-2xl border-[#F5C542]/30 shadow-lg bg-[#F5C542]/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-[#F5C542]" />
                  Pending Join Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#00357a]/10"
                    data-testid={`request-item-${request.id}`}
                  >
                    <Avatar className="h-10 w-10 border-2 border-[#00357a]/20">
                      <AvatarFallback className="bg-gradient-to-br from-[#00357a] to-[#7B1E3C] text-white font-semibold text-sm">
                        {(request.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-[#00357a]">{request.username}</p>
                      <p className="text-xs text-[#00357a]/50">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onApproveRequest?.(request.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                        data-testid={`button-approve-${request.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRejectRequest?.(request.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {!isMember && isUpcoming && currentUser && allowsJoinRequests && (
            <Card className="rounded-2xl border-compass-gold/30 shadow-lg bg-gradient-to-br from-compass-gold/10 to-compass-maroon/10">
              <CardContent className="p-6 text-center">
                {userPendingRequest ? (
                  <>
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#F5C542]/20 mb-4">
                      <Clock className="h-7 w-7 text-[#F5C542]" />
                    </div>
                    <h3 className="font-semibold text-[#00357a] mb-2">Request Pending</h3>
                    <p className="text-sm text-[#00357a]/60">
                      Your request to join this trip is awaiting approval from the organizer.
                    </p>
                  </>
                ) : userApprovedRequest ? (
                  <>
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-green-100 mb-4">
                      <Check className="h-7 w-7 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-[#00357a] mb-2">You're In!</h3>
                    <p className="text-sm text-[#00357a]/60">
                      Your request has been approved. You're now part of this trip!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#F5C542]/20 mb-4">
                      <HandHeart className="h-7 w-7 text-[#F5C542]" />
                    </div>
                    <h3 className="font-semibold text-[#00357a] mb-2">Join This Adventure!</h3>
                    <p className="text-sm text-[#00357a]/60 mb-4">
                      Interested in this trip? Request to join and the organizer will be notified.
                    </p>
                    <Button
                      onClick={handleRequestToJoin}
                      className="w-full bg-[#F5C542] text-[#00357a] hover:bg-[#F5C542]/90 rounded-xl gap-2"
                      data-testid="button-request-join"
                    >
                      <HandHeart className="h-4 w-4" />
                      Request to Join
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-[#00357a]/10 shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#00357a]">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden border border-[#00357a]/10">
                <MapView destination={trip.destination} />
              </div>
            </CardContent>
          </Card>

          {trip.username && (
            <Card className="rounded-2xl border-[#00357a]/10 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#00357a]">Traveler</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profile/${trip.userId}`}>
                  <div className="flex items-center gap-3 hover-elevate p-3 rounded-xl cursor-pointer border border-[#00357a]/10" data-testid="link-user-profile">
                    <Avatar className="h-12 w-12 border-2 border-[#00357a]/20">
                      <AvatarFallback className="bg-gradient-to-br from-[#00357a] to-[#7B1E3C] text-white font-semibold">
                        {trip.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-[#00357a]">{trip.username}</p>
                      <p className="text-sm text-[#00357a]/50 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        View profile
                      </p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-[#F5C542]/30 shadow-lg bg-[#F5C542]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#F5C542]" />
                Travel Companions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.members && trip.members.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {trip.members.map((member) => (
                      <Badge 
                        key={member.userId}
                        className="bg-[#00357a] text-white rounded-full px-3 py-1"
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                  {isOwner && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full rounded-xl border-[#F5C542] text-[#00357a] hover:bg-[#F5C542]/10 gap-2"
                      onClick={onInviteFriend}
                      data-testid="button-invite-more"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite More Friends
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[#00357a]/50 mb-3">No companions yet</p>
                  {isOwner && (
                    <Button 
                      size="sm" 
                      className="bg-[#F5C542] text-[#00357a] hover:bg-[#F5C542]/90 rounded-xl gap-2"
                      onClick={onInviteFriend}
                      data-testid="button-invite-friends"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite Friends
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isMember && (
            <TripBalances tripId={trip.id} />
          )}

          {isOwner && (
            <Card className="rounded-2xl border-[#00357a]/10 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#00357a] flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-[#00357a]" />
                  Invite Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share this link with anyone to let them join your trip instantly.
                </p>
                {trip.inviteCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-[#00357a]/5 rounded-xl">
                      <code className="text-xs text-[#00357a] flex-1 truncate" data-testid="text-invite-link">
                        {window.location.origin}/invite/{trip.inviteCode}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCopyInviteLink}
                        className="flex-1 bg-[#00357a] text-white rounded-xl gap-1.5"
                        data-testid="button-copy-invite"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateInviteMutation.mutate()}
                        disabled={generateInviteMutation.isPending}
                        className="rounded-xl border-[#00357a]/20 text-[#00357a] gap-1.5"
                        data-testid="button-regenerate-invite"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${generateInviteMutation.isPending ? 'animate-spin' : ''}`} />
                        New Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => generateInviteMutation.mutate()}
                    disabled={generateInviteMutation.isPending}
                    className="w-full bg-[#00357a] text-white rounded-xl gap-2"
                    data-testid="button-generate-invite"
                  >
                    <Link2 className="h-4 w-4" />
                    {generateInviteMutation.isPending ? 'Generating...' : 'Generate Invite Link'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
