import TripDetail from '../TripDetail';

export default function TripDetailExample() {
  const trip = {
    id: 1,
    destination: 'Tokyo, Japan',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    transportMode: 'airplane' as const,
    description: 'Exploring the vibrant culture of Japan, from ancient temples in Kyoto to the bustling streets of Shibuya. Planning to visit Mount Fuji, try authentic ramen, and experience a traditional tea ceremony.',
    userId: '1',
    username: 'traveler',
    invitedFriends: ['explorer', 'wanderer'],
  };

  return <TripDetail trip={trip} onInviteFriend={() => console.log('Invite friend clicked')} />;
}
