import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Play,
  FileText,
  ScrollText,
  User,
  LogOut,
  DownloadCloud,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProgressStepper from "./ProgressStepper";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRun } from "@/context/RunContext"; // Import useRun

interface MainLayoutProps {
  children: React.ReactNode;
  // currentStep prop is now managed by RunContext
}

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Runs",
    href: "/runs",
    icon: Play,
  },
  {
    title: "Templates",
    href: "/templates",
    icon: FileText,
  },
  {
    title: "Audit",
    href: "/audit",
    icon: ScrollText,
  },
];

const MDO_STEPS = ["Upload", "Map", "Validate", "Export"];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { logout, currentUser } = useAuth(); // Get currentUser from AuthContext
  const navigate = useNavigate();
  const { currentStep } = useRun(); // Get currentStep from RunContext

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
          <div className="text-2xl font-bold text-primary mb-8">MDO</div>
          <nav className="flex-1">
            <ul className="space-y-2">
              {sidebarNavItems.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.href}
                    className="flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="text-sm text-muted-foreground mt-auto">
            Version 1.0.0
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
          <div className={cn("text-2xl font-bold text-primary", isMobile && "ml-4")}>MDO</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.username || 'Guest'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || 'guest@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          ></div>
        )}
        {isMobile && (
          <aside
            className={cn(
              "fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col z-50 transform transition-transform ease-in-out duration-300",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="text-2xl font-bold text-primary">MDO</div>
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1">
              <ul className="space-y-2">
                {sidebarNavItems.map((item) => (
                  <li key={item.title}>
                    <Link
                      to={item.href}
                      className="flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      onClick={toggleSidebar}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="text-sm text-muted-foreground mt-auto">
              Version 1.0.0
            </div>
          </aside>
        )}

        {/* Progress Stepper */}
        <ProgressStepper steps={MDO_STEPS} currentStep={currentStep} />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="p-4 bg-card border-t border-border text-center text-sm text-muted-foreground">
          MDO Application © 2023. Version 1.0.0
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;