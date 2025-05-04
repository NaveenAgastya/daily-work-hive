
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Briefcase, CheckCircle, Users } from 'lucide-react';

const HomePage = () => {
  const { currentUser, isLabor, isClient } = useAuth();
  
  const goToDashboard = () => {
    if (isLabor) return '/labor/dashboard';
    if (isClient) return '/client/dashboard';
    return '/register';
  };
  
  const features = [
    {
      title: 'Easy Labor Booking',
      description: 'Simple process to book skilled laborers for your daily tasks',
      icon: Briefcase
    },
    {
      title: 'Verified Workers',
      description: 'All laborers are verified with ID proofs for your safety',
      icon: CheckCircle
    },
    {
      title: 'Direct Connections',
      description: 'Connect directly with workers without intermediaries',
      icon: Users
    }
  ];
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-labor-light to-white py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Connect with Skilled Laborers for Your Daily Tasks
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    Daily Work Hive connects you with verified laborers for all your daily work needs. Fast, reliable, and secure.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Link to={goToDashboard()}>
                    <Button className="bg-labor-primary hover:bg-labor-dark text-white">
                      {currentUser ? 'Go to Dashboard' : 'Get Started'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    {!currentUser && (
                      <Button variant="outline">
                        Register as a Worker
                      </Button>
                    )}
                  </Link>
                </div>
              </div>
              <div className="lg:block">
                <img 
                  src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952" 
                  alt="Worker on computer"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                  width="550"
                  height="310"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Platform Features
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to get your work done efficiently and safely
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover-scale card-shadow">
                  <div className="rounded-full bg-labor-light p-4 mb-4">
                    <feature.icon className="h-8 w-8 text-labor-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-labor-primary py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="max-w-[600px] text-white/80 md:text-xl/relaxed">
                Join thousands of users already finding the perfect match for their daily tasks
              </p>
              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <Link to="/register">
                  <Button className="bg-white text-labor-primary hover:bg-gray-100">
                    Register Now
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="text-white border-white hover:bg-labor-dark">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16 md:py-0">
          <p className="text-sm text-gray-500">
            © 2023 Daily Work Hive. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link to="#" className="text-sm font-medium hover:underline underline-offset-4">Terms</Link>
            <Link to="#" className="text-sm font-medium hover:underline underline-offset-4">Privacy</Link>
            <Link to="#" className="text-sm font-medium hover:underline underline-offset-4">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
