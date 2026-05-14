import UserProfile from '../UserProfile';

export default function UserProfileExample() {
  const user = { id: '1', username: 'traveler', friends: ['2', '3'] };
  const allUsers = [
    { id: '1', username: 'traveler', friends: ['2', '3'] },
    { id: '2', username: 'explorer', friends: ['1'] },
    { id: '3', username: 'wanderer', friends: ['1'] },
    { id: '4', username: 'adventurer', friends: [] },
  ];
  const trips = [
    {
      id: 1,
      destination: 'Tokyo, Japan',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      transportMode: 'airplane' as const,
      description: 'Exploring temples and trying authentic ramen.',
      userId: '1',
      invitedFriends: ['explorer'],
    },
    {
      id: 2,
      destination: 'Paris, France',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      transportMode: 'train' as const,
      description: 'Romantic getaway to the city of lights.',
      userId: '1',
      invitedFriends: [],
    },
  ];

  return (
    <UserProfile 
      user={user} 
      trips={trips}
      allUsers={allUsers}
      currentUser={{ id: '1', username: 'traveler' }}
      onAddFriend={(userId, friendId) => console.log('Add friend:', userId, friendId)}
      onRemoveFriend={(userId, friendId) => console.log('Remove friend:', userId, friendId)}
    />
  );
}
