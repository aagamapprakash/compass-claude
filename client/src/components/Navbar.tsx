import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Plus, User, LogIn, LogOut, Menu, X, Compass } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  user?: { id: string; username: string } | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Explore', icon: Home },
    { href: '/new', label: 'New Trip', icon: Plus, requiresAuth: true },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#00357a]/10 shadow-sm" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00357a] to-[#7B1E3C] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#00357a] hidden sm:inline">
              Compass
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.requiresAuth && !user) return null;
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}>
                  <div className="relative px-1">
                    <Button
                      variant="ghost"
                      className={`gap-2 text-[#00357a] hover:bg-[#00357a]/5 ${active ? 'font-semibold' : ''}`}
                      data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                    {active && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#7B1E3C] rounded-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-[#00357a] hover:bg-[#00357a]/5" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8 border-2 border-[#00357a]/20">
                      <AvatarFallback className="bg-gradient-to-br from-[#00357a] to-[#7B1E3C] text-white text-sm font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-[#00357a]/10">
                  <Link href={`/profile/${user.id}`}>
                    <DropdownMenuItem className="cursor-pointer rounded-lg" data-testid="menu-profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer rounded-lg text-[#7B1E3C]" 
                    onClick={onLogout}
                    data-testid="menu-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href="/api/login">
                <Button className="gap-2 bg-[#00357a] hover:bg-[#00357a]/90 rounded-xl shadow-md" data-testid="button-login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </a>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[#00357a]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#00357a]/10 space-y-2">
            {navLinks.map((link) => {
              if (link.requiresAuth && !user) return null;
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2 text-[#00357a] ${active ? 'bg-[#00357a]/5 font-semibold' : ''}`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    {active && <div className="ml-auto w-1 h-4 bg-[#7B1E3C] rounded-full" />}
                  </Button>
                </Link>
              );
            })}
            {user ? (
              <>
                <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-[#00357a]">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-[#7B1E3C]"
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <a href="/api/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-start gap-2 bg-[#00357a]">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
