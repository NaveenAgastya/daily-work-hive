import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'labor' | 'client'>('client');
  const [loading, setLoading] = useState(false);
  
  const { signup, currentUser, isLabor, isClient } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (isLabor) {
        navigate('/labor/dashboard');
      } else if (isClient) {
        navigate('/client/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [currentUser, isLabor, isClient, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !name) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      await signup(email, password, role, name);
      
      // Redirect based on role - this will happen after email confirmation
      // but we'll keep this logic for when we disable email confirmation in development
      if (role === 'labor') {
        navigate('/labor/profile'); // Send to profile completion
      } else {
        navigate('/client/dashboard'); // Client has simpler onboarding
      }
    } catch (error) {
      // Error is handled in the auth context
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
              <CardDescription className="text-center">Sign up to start using Daily Work Hive</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>I am registering as a:</Label>
                  <RadioGroup 
                    defaultValue={role} 
                    className="grid grid-cols-2 gap-4"
                    onValueChange={(value) => setRole(value as 'labor' | 'client')}
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:border-labor-primary hover:bg-labor-light transition-colors">
                      <RadioGroupItem value="labor" id="labor" />
                      <Label htmlFor="labor" className="cursor-pointer">Labor/Worker</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:border-labor-primary hover:bg-labor-light transition-colors">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="cursor-pointer">Client/Employer</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  type="submit" 
                  className="w-full mb-4 bg-labor-primary hover:bg-labor-dark" 
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </Button>
                <p className="text-sm text-center text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-labor-primary hover:underline">
                    Login
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
