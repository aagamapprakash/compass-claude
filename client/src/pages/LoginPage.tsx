import { useState } from 'react';
import { useLocation } from 'wouter';
import AuthForm from '@/components/AuthForm';
import { useToast } from '@/hooks/use-toast';

interface LoginPageProps {
  onLogin: (user: { id: string; username: string }) => void;
  users: { id: string; username: string; password?: string }[];
  onRegister: (user: { username: string; password: string }) => { id: string; username: string };
}

export default function LoginPage({ onLogin, users, onRegister }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (data: { username: string; password: string }) => {
    setIsLoading(true);
    setError(undefined);
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (mode === 'login') {
      const user = users.find(
        (u) => u.username === data.username && u.password === data.password
      );
      
      if (user) {
        onLogin({ id: user.id, username: user.username });
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${user.username}`,
        });
        setLocation('/');
      } else {
        setError('Invalid username or password');
      }
    } else {
      const existingUser = users.find((u) => u.username === data.username);
      
      if (existingUser) {
        setError('Username already taken');
      } else {
        const newUser = onRegister(data);
        onLogin(newUser);
        toast({
          title: 'Account created!',
          description: 'Welcome to Compass',
        });
        setLocation('/');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <AuthForm
      mode={mode}
      onSubmit={handleSubmit}
      onToggleMode={() => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setError(undefined);
      }}
      isLoading={isLoading}
      error={error}
    />
  );
}
