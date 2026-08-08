import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="hidden font-heading font-bold sm:inline-block">
              CareerAI
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/dashboard"
              className={`transition-colors hover:text-foreground/80 ${location.pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/predict"
              className={`transition-colors hover:text-foreground/80 ${location.pathname === '/predict' ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Predict
            </Link>
            <Link
              to="/calculators"
              className={`transition-colors hover:text-foreground/80 ${location.pathname.includes('/calculators') ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Calculators
            </Link>
            <Link
              to="/skills"
              className={`transition-colors hover:text-foreground/80 ${location.pathname.includes('/skills') ? 'text-foreground' : 'text-foreground/60'}`}
            >
              Skills
            </Link>
            <Link
              to="/about"
              className={`transition-colors hover:text-foreground/80 ${location.pathname === '/about' ? 'text-foreground' : 'text-foreground/60'}`}
            >
              About
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other tools could go here */}
          </div>
          <nav className="flex items-center">
            <Link to="/predict">
              <Button size="sm" className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Analyze My Profile
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </nav>
  );
}
