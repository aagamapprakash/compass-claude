import Navbar from '../Navbar';

export default function NavbarExample() {
  const user = { id: '1', username: 'traveler' };
  
  return (
    <div className="w-full">
      <Navbar user={user} onLogout={() => console.log('Logout clicked')} />
    </div>
  );
}
