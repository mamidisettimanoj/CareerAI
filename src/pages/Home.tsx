import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Target, GraduationCap } from 'lucide-react';

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
          AI-POWERED STUDENT CAREER ANALYTICS
        </div>
        
        <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Build a Stronger Career Profile. <br />
          Become <span className="text-gradient">Placement Ready</span>.
        </h1>
        
        <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mb-8">
          Analyze your academic performance, skills, aptitude, experience and career readiness with one intelligent student analytics platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/predict">
            <Button size="lg" className="w-full sm:w-auto font-semibold bg-primary hover:bg-primary/90 glow-primary h-12 px-8">
              Analyze My Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold h-12 px-8 glass-panel-hover">
              Explore Career Tools
            </Button>
          </Link>
        </div>
        
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">Academic Tracking</h3>
            <p className="text-muted-foreground text-sm">Monitor your SGPA/CGPA trends and analyze your semester performances over time.</p>
          </div>
          
          <div className="glass-panel p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-4 text-accent">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">Skill Gap Analysis</h3>
            <p className="text-muted-foreground text-sm">Compare your skills against industry standards for specific roles and identify areas to improve.</p>
          </div>
          
          <div className="glass-panel p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4 text-success">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">Placement Readiness</h3>
            <p className="text-muted-foreground text-sm">Get an estimated probability of placement based on an analysis of your complete profile.</p>
          </div>
        </div>

        <div className="mt-16 text-xs text-muted-foreground/60 max-w-2xl">
          * This estimate is an educational analytics tool and does not guarantee employment or placement outcomes. 
          The data used in demo mode is fictional and meant for demonstration purposes only.
        </div>
      </div>
    </div>
  );
}
