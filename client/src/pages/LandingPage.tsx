import { useState } from 'react';
import { Compass, MapPin, Users, ArrowRight, Globe } from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { AuthModal } from '@/components/AuthModal';
import heroImage from '@assets/stock_images/paris_rooftops_at_go_b23dacab.jpg';

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Travel destination"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <Compass className="h-4 w-4 text-compass-gold" />
            <span className="text-sm font-medium text-white/90">Your travel companion</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight tracking-tight">
            Plan Adventures,
            <br />
            <span className="text-gradient-gold">Together</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create trips, invite friends, and discover destinations shared by travelers around the world.
          </p>

          <NeonButton
            variant="maroon"
            size="xl"
            neonColor="gold"
            className="flex items-center gap-2 shadow-editorial mx-auto"
            data-testid="button-sign-in"
            onClick={() => setAuthOpen(true)}
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </NeonButton>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-compass-navy text-center mb-16">
            Everything you need to plan your next adventure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-3xl bg-compass-navy/5">
              <div className="h-14 w-14 rounded-2xl bg-compass-navy/10 flex items-center justify-center mx-auto mb-5">
                <MapPin className="h-7 w-7 text-compass-navy" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-compass-navy mb-3">Create Trips</h3>
              <p className="text-muted-foreground">Plan your adventures with destinations, dates, and travel details all in one place.</p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-compass-gold/5">
              <div className="h-14 w-14 rounded-2xl bg-compass-gold/10 flex items-center justify-center mx-auto mb-5">
                <Users className="h-7 w-7 text-compass-gold" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-compass-navy mb-3">Travel Together</h3>
              <p className="text-muted-foreground">Invite friends or request to join trips from other travelers in the community.</p>
            </div>

            <div className="text-center p-8 rounded-3xl bg-compass-maroon/5">
              <div className="h-14 w-14 rounded-2xl bg-compass-maroon/10 flex items-center justify-center mx-auto mb-5">
                <Globe className="h-7 w-7 text-compass-maroon" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-compass-navy mb-3">Discover Places</h3>
              <p className="text-muted-foreground">Explore destinations worldwide with photos, ratings, and real place data.</p>
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
