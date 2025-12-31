import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-xl border bg-card shadow-sm">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Account Pending Approval</h1>
          <p className="text-muted-foreground">
            Hi {user?.user_metadata?.full_name || 'there'}, your account has been created but requires administrator approval before you can access the application.
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm text-left space-y-2">
          <p className="font-medium text-foreground">What happens next?</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Our admin team has been notified of your signup.</li>
            <li>You will be able to log in once your account is approved.</li>
            <li>Please check back later.</li>
          </ul>
        </div>

        <div className="pt-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
