import Dashboard from '@/pages/Dashboard';

interface UserDetailViewProps {
  userId: string;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  // We simply render the Dashboard component with the selected userId.
  // The Dashboard component now handles fetching that user's specific data
  // and hides non-admin actions (like daily input/sign out) when in view mode.
  return <Dashboard userId={userId} />;
}
