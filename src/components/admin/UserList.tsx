import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  organization_name: string | null;
  enrolled_program: string | null;
  is_approved: boolean | null;
}

interface UserListProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

export function UserList({ onSelectUser, selectedUserId }: UserListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, organization_name, enrolled_program, is_approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
        setFilteredUsers(data || []);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.full_name?.toLowerCase().includes(query) ||
            user.organization_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatProgram = (program: string | null) => {
    if (!program) return '';
    return program.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleApprove = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.user_id === userId ? { ...u, is_approved: true } : u));
    } catch (error: any) {
      console.error('Error approving user:', error);
      alert(`Failed to approve user: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="p-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.user_id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedUserId === user.user_id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={selectedUserId === user.user_id ? 'bg-primary-foreground text-primary' : ''}>
                    {user.full_name ? getInitials(user.full_name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.full_name || 'Unnamed User'}</p>
                    {user.is_approved === false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${selectedUserId === user.user_id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {user.organization_name || formatProgram(user.enrolled_program) || 'No organization'}
                  </p>
                </div>
                {user.is_approved === false && (
                   <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={(e) => handleApprove(e, user.user_id)}
                    title="Approve User"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t text-sm text-muted-foreground">
        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
