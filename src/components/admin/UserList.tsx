import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  organization_name: string | null;
  enrolled_program: string | null;
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
        .select('id, user_id, full_name, organization_name, enrolled_program')
        .order('full_name');

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
                  <p className="font-medium truncate">{user.full_name || 'Unnamed User'}</p>
                  <p className={`text-sm truncate ${selectedUserId === user.user_id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {user.organization_name || formatProgram(user.enrolled_program) || 'No organization'}
                  </p>
                </div>
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
