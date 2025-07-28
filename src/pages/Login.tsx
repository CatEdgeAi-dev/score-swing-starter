import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate('/scorecard');
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your account.",
        });
        navigate('/scorecard');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        variant: "destructive",
        title: "Google login failed",
        description: error.message,
      });
    }
  };

  const handleAppleLogin = () => {
    toast({
      title: "Apple Login",
      description: "Apple login would be implemented here.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">Golf Scorecard</CardTitle>
          <CardDescription>Sign in to track your rounds</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px]" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
              
              <div className="text-center">
                <Button variant="link" className="text-sm text-muted-foreground">
                  Forgot your password?
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full min-h-[44px]" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <Separator className="my-4" />
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full min-h-[44px] border-2"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full min-h-[44px] border-2 bg-black text-white hover:bg-gray-800"
              onClick={handleAppleLogin}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C8.396 0 8.039.015 6.624.072 5.21.13 4.297.333 3.454.63c-.92.319-1.683.74-2.427 1.484C.283 2.858-.138 3.621-.457 4.541c-.297.843-.5 1.756-.558 3.17C-.072 8.925-.057 9.282-.057 12.903s.015 3.978.072 5.393c.058 1.414.261 2.327.558 3.17.319.92.74 1.683 1.484 2.427 1.244.744 2.007 1.165 2.927 1.484.843.297 1.756.5 3.17.558 1.415.057 1.772.072 5.393.072s3.978-.015 5.393-.072c1.414-.058 2.327-.261 3.17-.558.92-.319 1.683-.74 2.427-1.484.744-1.244 1.165-2.007 1.484-2.927.297-.843.5-1.756.558-3.17.057-1.415.072-1.772.072-5.393s-.015-3.978-.072-5.393c-.058-1.414-.261-2.327-.558-3.17-.319-.92-.74-1.683-1.484-2.427C20.522.283 19.759-.138 18.839-.457c-.843-.297-1.756-.5-3.17-.558C14.254-.072 13.897-.057 10.276-.057zm0 2.17c3.537 0 3.96.015 5.36.072 1.292.058 1.993.271 2.46.45.617.24 1.057.526 1.52.989.463.463.749.903.989 1.52.179.467.392 1.168.45 2.46.057 1.4.072 1.823.072 5.36s-.015 3.96-.072 5.36c-.058 1.292-.271 1.993-.45 2.46-.24.617-.526 1.057-.989 1.52-.463.463-.903.749-1.52.989-.467.179-1.168.392-2.46.45-1.4.057-1.823.072-5.36.072s-3.96-.015-5.36-.072c-1.292-.058-1.993-.271-2.46-.45-.617-.24-1.057-.526-1.52-.989-.463-.463-.749-.903-.989-1.52-.179-.467-.392-1.168-.45-2.46-.057-1.4-.072-1.823-.072-5.36s.015-3.96.072-5.36c.058-1.292.271-1.993.45-2.46.24-.617.526-1.057.989-1.52.463-.463.903-.749 1.52-.989.467-.179 1.168-.392 2.46-.45 1.4-.057 1.823-.072 5.36-.072z"/>
              </svg>
              Continue with Apple
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;