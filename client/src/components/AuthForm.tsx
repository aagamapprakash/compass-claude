import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NeonButton } from '@/components/ui/neon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass, User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const authSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: AuthFormData) => void;
  onToggleMode: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function AuthForm({ 
  mode, 
  onSubmit, 
  onToggleMode, 
  isLoading = false,
  error 
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <SpotlightCard 
          glowColor="gold"
          className="p-8"
        >
          <div className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-compass-navy to-compass-maroon flex items-center justify-center shadow-soft-lg">
                <Compass className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-serif font-bold text-compass-navy mb-2">
              {isLogin ? 'Welcome Back' : 'Join Compass'}
            </h2>
            <p className="text-muted-foreground text-base flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-compass-gold" />
              {isLogin
                ? 'Sign in to continue your adventures'
                : 'Start planning unforgettable journeys'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-compass-maroon/10 text-compass-maroon text-sm font-medium border border-compass-maroon/20" data-testid="text-error">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="username" className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
                <User className="h-4 w-4 text-compass-gold" />
                Username
              </Label>
              <Input
                id="username"
                placeholder="Enter your username"
                className="rounded-2xl border-2 border-border focus:border-compass-navy focus:ring-4 focus:ring-compass-navy/10 h-14 px-5"
                {...register('username')}
                data-testid="input-username"
              />
              {errors.username && (
                <p className="text-sm text-compass-maroon">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="flex items-center gap-2 text-compass-navy font-medium text-sm uppercase tracking-wider">
                <Lock className="h-4 w-4 text-compass-gold" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="rounded-2xl border-2 border-border focus:border-compass-navy h-14 px-5 pr-14"
                  {...register('password')}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-compass-navy rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-compass-maroon">{errors.password.message}</p>
              )}
            </div>

            <NeonButton
              type="submit"
              variant="solid"
              size="lg"
              neonColor="gold"
              className="w-full h-14 shadow-editorial text-lg"
              disabled={isLoading}
              data-testid="button-submit-auth"
            >
              {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </NeonButton>

            <div className="text-center text-base pt-2">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                type="button"
                className="text-compass-maroon hover:text-compass-maroon/80 font-semibold hover:underline underline-offset-4 transition-colors"
                onClick={onToggleMode}
                data-testid="button-toggle-mode"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </form>
        </SpotlightCard>
      </div>
    </div>
  );
}
