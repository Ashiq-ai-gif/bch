import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { PlusCircle, Shield, Download, LogOut, Info, Menu } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      toast("To add to home screen:", {
        description: "Click the browser menu (⋮ or share icon) and select 'Add to Home Screen' or 'Install App'.",
        duration: 5000,
      });
    }
  };

  const NavItems = ({ className = "" }: { className?: string }) => (
    <div className={`flex ${className}`}>
      {!isInstalled && (
        <Button 
          variant="outline" 
          onClick={() => { handleInstallClick(); setIsOpen(false); }} 
          className="glass-card-hover border-white/10 shrink-0 text-amber-400 border-amber-400/20 hover:bg-amber-400/10 w-full md:w-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          Add to Home Screen
        </Button>
      )}
      
      {user ? (
        <>
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => { navigate("/admin"); setIsOpen(false); }} 
              className="glass-card-hover border-white/10 shrink-0 w-full md:w-auto"
            >
              <Shield className="w-4 h-4 mr-2" />Admin
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={() => { navigate("/daily-input"); setIsOpen(false); }} 
            className="btn-gradient shrink-0 w-full md:w-auto"
          >
            <PlusCircle className="w-4 h-4 mr-2" />Daily Input
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => { signOut(); setIsOpen(false); }} 
            className="hover:bg-white/10 shrink-0 w-full md:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />Sign Out
          </Button>
        </>
      ) : (
        <Button 
          variant="default" 
          onClick={() => { navigate("/auth"); setIsOpen(false); }} 
          className="btn-gradient shrink-0 w-full md:w-auto"
        >
          Sign In
        </Button>
      )}
    </div>
  );

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => navigate(user ? "/dashboard" : "/")}>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Growth Accelerator
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavItems className="gap-2" />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 border-white/10 text-white">
                <SheetHeader className="text-left mb-8">
                  <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                    Menu
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Navigate through Growth Accelerator
                  </SheetDescription>
                </SheetHeader>
                <NavItems className="flex-col gap-4" />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
