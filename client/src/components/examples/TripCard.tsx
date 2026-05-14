import TripCard from '../TripCard';

export default function TripCardExample() {
  const trip = {
    id: 1,
    destination: 'Tokyo, Japan',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    transportMode: 'airplane' as const,
    description: 'Exploring temples, savoring authentic ramen, and experiencing the vibrant city life.',
    userId: '1',
    username: 'traveler',
    invitedFriends: ['explorer', 'wanderer'],
  };

  return <TripCard trip={trip} />;
}
