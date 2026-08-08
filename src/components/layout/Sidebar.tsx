import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LineChart, 
  Calculator, 
  Briefcase, 
  CheckCircle,
  FileText,
  ListTodo,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  const routes = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Predict', path: '/predict', icon: LineChart },
    { name: 'Academic Tracker', path: '/academic', icon: LineChart },
    { name: 'Calculators', path: '/calculators', icon: Calculator },
    { name: 'Eligibility', path: '/eligibility', icon: CheckCircle },
    { name: 'Skills Gap', path: '/skills', icon: Briefcase },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Preparation', path: '/preparation', icon: ListTodo },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className={cn("pb-12 w-64 hidden md:block border-r border-border/40", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-heading font-semibold tracking-tight">
            Career Tools
          </h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link key={route.path} to={route.path}>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:bg-accent/10 hover:text-accent transition-colors",
                    location.pathname.startsWith(route.path) 
                      ? "bg-accent/10 text-accent" 
                      : "text-foreground/70"
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.name}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
