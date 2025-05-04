
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = () => {
  const { currentUser, userData, logout, isLabor, isClient } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };
  
  const dashboardLink = isLabor 
    ? '/labor/dashboard'
    : isClient 
      ? '/client/dashboard'
      : '/';
      
  const profileLink = isLabor 
    ? '/labor/profile'
    : isClient 
      ? '/client/profile'
      : '/';
      
  const renderMobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col gap-4 py-4">
          <div className="px-2">
            <h2 className="text-lg font-medium">Daily Work Hive</h2>
            <p className="text-sm text-muted-foreground">Connect with workers for your daily tasks</p>
          </div>
          <div className="flex flex-col gap-1">
            <Link to="/" className="px-2 py-1 hover:bg-accent rounded-md">Home</Link>
            
            {currentUser ? (
              <>
                <Link to={dashboardLink} className="px-2 py-1 hover:bg-accent rounded-md">Dashboard</Link>
                <Link to={profileLink} className="px-2 py-1 hover:bg-accent rounded-md">Profile</Link>
                
                {isLabor && (
                  <Link to="/labor/earnings" className="px-2 py-1 hover:bg-accent rounded-md">Earnings</Link>
                )}
                
                {isClient && (
                  <Link to="/client/book" className="px-2 py-1 hover:bg-accent rounded-md">Book Labor</Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="px-2 py-1 text-left text-red-500 hover:bg-red-50 rounded-md mt-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 py-1 hover:bg-accent rounded-md">Login</Link>
                <Link to="/register" className="px-2 py-1 hover:bg-accent rounded-md">Register</Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {renderMobileNav()}
          <Link to="/" className="text-xl font-bold text-labor-primary">Daily Work Hive</Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-labor-primary transition-colors">Home</Link>
          
          {currentUser ? (
            <>
              <Link to={dashboardLink} className="text-sm font-medium hover:text-labor-primary transition-colors">Dashboard</Link>
              
              {isClient && (
                <Link to="/client/book" className="text-sm font-medium hover:text-labor-primary transition-colors">Book Labor</Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={16} />
                    {userData?.display_name || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={profileLink}>Profile</Link>
                  </DropdownMenuItem>
                  
                  {isLabor && (
                    <DropdownMenuItem asChild>
                      <Link to="/labor/earnings">Earnings</Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
