import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Compass } from 'lucide-react';
import { Link } from 'wouter';
import heroImage from '@assets/generated_images/tropical_beach_aerial_sunset.png';

interface HeroProps {
  isLoggedIn?: boolean;
}

export default function Hero({ isLoggedIn = false }: HeroProps) {
  return (
    <div className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#00357a]/80 via-[#00357a]/60 to-[#7B1E3C]/70" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      
      <div className="relative z-10 text-center px-4 py-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
          <Compass className="h-4 w-4 text-[#F5C542]" />
          <span className="text-sm font-medium text-white/90 tracking-wide">Navigate Your Adventures</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-tight leading-tight">
          Plan Trips.
          <span className="block text-[#F5C542]">Invite Friends.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/85 mb-10 max-w-xl mx-auto leading-relaxed font-light">
          Discover destinations, share adventures, and create unforgettable memories with the people who matter most.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          {isLoggedIn ? (
            <Link href="/new">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-[#F5C542] to-[#F5C542]/90 text-[#00357a] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0" 
                data-testid="button-create-trip"
              >
                <Plus className="h-5 w-5" />
                Create Trip
              </Button>
            </Link>
          ) : (
            <a href="/api/login">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-[#F5C542] to-[#F5C542]/90 text-[#00357a] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0" 
                data-testid="button-get-started"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </a>
          )}
          <Button 
            variant="outline" 
            size="lg" 
            className="backdrop-blur-md bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl font-medium"
            onClick={() => document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="button-explore"
          >
            Explore Journeys
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
