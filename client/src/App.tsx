import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/animated-sidebar';
import { Compass, Search, PlusCircle, User, LogOut, Bell } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/AuthModal';
import Home from '@/pages/Home';
import NewTrip from '@/pages/NewTrip';
import TripPage from '@/pages/TripPage';
import ProfilePage from '@/pages/ProfilePage';
import LandingPage from '@/pages/LandingPage';
import SearchPage from '@/pages/SearchPage';
import DestinationPage from '@/pages/DestinationPage';
import NotificationsPage from '@/pages/NotificationsPage';
import InvitePage from '@/pages/InvitePage';
import NotFound from '@/pages/NotFound';

function AppContent() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email || 'User';

  const mainLinks = [
    {
      label: "Discover",
      href: "/",
      icon: <Compass className="text-white/80 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: "Search",
      href: "/search",
      icon: <Search className="text-white/80 h-5 w-5 flex-shrink-0" />,
    },
    ...(isAuthenticated ? [
      {
        label: "Create Trip",
        href: "/new",
        icon: <PlusCircle className="text-white/80 h-5 w-5 flex-shrink-0" />,
      },
      ...(user ? [{
        label: "Profile",
        href: `/profile/${user.id}`,
        icon: <User className="text-white/80 h-5 w-5 flex-shrink-0" />,
      }] : []),
      {
        label: "Notifications",
        href: "/notifications",
        icon: (
          <div className="relative">
            <Bell className="text-white/80 h-5 w-5 flex-shrink-0" />
          </div>
        ),
      },
    ] : []),
  ];

  const Logo = () => (
    <div className="font-normal flex space-x-3 items-center text-sm py-2 relative z-20">
      <div className="h-10 w-10 bg-primary border-2 border-white/20 flex items-center justify-center flex-shrink-0">
        <Compass className="h-5 w-5 text-white" />
      </div>
      <span className="font-serif italic font-semibold text-xl text-white/90 whitespace-pre tracking-tight">
        Compass
      </span>
    </div>
  );

  const LogoIcon = () => (
    <div className="font-normal flex space-x-3 items-center text-sm py-2 relative z-20">
      <div className="h-10 w-10 bg-primary border-2 border-white/20 flex items-center justify-center flex-shrink-0">
        <Compass className="h-5 w-5 text-white" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-primary border-2 border-foreground flex items-center justify-center animate-pulse">
            <Compass className="h-8 w-8 text-white" />
          </div>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-white/10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {sidebarOpen ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {mainLinks.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  isActive={
                    link.href === '/'
                      ? location === '/'
                      : location.startsWith(link.href)
                  }
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-4">
            {isAuthenticated && user ? (
              <>
                <SidebarLink
                  link={{
                    label: displayName,
                    href: `/profile/${user.id}`,
                    icon: (
                      <Avatar className="h-8 w-8 flex-shrink-0 border border-white/30">
                        {user.profileImageUrl && (
                          <AvatarImage src={user.profileImageUrl} alt={displayName} />
                        )}
                        <AvatarFallback className="bg-primary text-white font-mono text-xs font-semibold">
                          {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ),
                  }}
                  onClick={() => setSidebarOpen(false)}
                />
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-start gap-3 group/sidebar py-3 px-3 transition-colors text-white/60 hover:bg-white/8 hover:text-white/90 w-full mt-2 border border-transparent hover:border-white/10"
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={`font-mono text-xs uppercase tracking-widest whitespace-pre !p-0 !m-0 transition-opacity ${sidebarOpen ? "inline-block opacity-100" : "hidden opacity-0"}`}
                  >
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center justify-start gap-3 group/sidebar py-3 px-3 transition-colors text-white/60 hover:bg-white/8 hover:text-white/90 w-full border border-white/10"
                data-testid="button-login"
              >
                <User className="text-white/70 h-5 w-5 flex-shrink-0" />
                <span
                  className={`font-mono text-xs uppercase tracking-widest whitespace-pre !p-0 !m-0 transition-opacity ${sidebarOpen ? "inline-block opacity-100" : "hidden opacity-0"}`}
                >
                  Sign In
                </span>
              </button>
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      <main className="flex-1 overflow-y-auto bg-background">
        <Switch>
          <Route path="/">
            <Home />
          </Route>
          <Route path="/search">
            <SearchPage />
          </Route>
          <Route path="/new">
            {isAuthenticated ? (
              <NewTrip />
            ) : (
              <LandingPage />
            )}
          </Route>
          <Route path="/trip/:id">
            {(params) => <TripPage tripId={params.id} />}
          </Route>
          <Route path="/profile/:id">
            {(params) => <ProfilePage userId={params.id} />}
          </Route>
          <Route path="/destination/:name">
            <DestinationPage />
          </Route>
          <Route path="/notifications">
            <NotificationsPage />
          </Route>
          <Route path="/invite/:code">
            {(params) => <InvitePage code={params.code} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
