import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Profile {
    user_id: string;
    full_name: string;
    phone: string | null;
}

export default function WhatsappSandbox() {
  const { user } = useAuth();
  const [mainSwitch, setMainSwitch] = useState(false);
  const [workUploaded, setWorkUploaded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Manual Trigger State
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt to pre-fill phone from profile
    if (user) {
      supabase.from('profiles').select('phone').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data?.phone) setPhoneNumber(data.phone);
        });
    }
  }, [user]);

  useEffect(() => {
      fetchUsers();
  }, []);

  const fetchUsers = async () => {
      setFetchingUsers(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-users');
        if (error) throw error;
        if (data) {
            setAllUsers(data);
        }
      } catch (error: any) {
          console.error("Error fetching users:", error);
          toast.error("Failed to load users: " + error.message);
      } finally {
          setFetchingUsers(false);
      }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  useEffect(() => {
    if (scrollRef.current) {
        // scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (mainSwitch) {
      addLog("Timer started (60s interval)");
      
      interval = setInterval(async () => {
        addLog("Timer tick...");

        if (workUploaded) {
          addLog("Skipping: Work already uploaded ✅");
          return;
        }

        if (!mainSwitch) {
             addLog("Skipping: Main Switch OFF ❌");
             return;
        }

        addLog("Condition met: Work NOT uploaded. Sending reminder... 🚀");
        await sendSandboxReminder();

      }, 60000); // 1 minute
    } else {
      if (logs.length > 0 && logs[0] !== "Timer stopped") {
        addLog("Timer stopped");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mainSwitch, workUploaded]);

  const sendSandboxReminder = async () => {
    if (!phoneNumber) {
      addLog("Error: No phone number set.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-test-whatsapp', {
        body: {
          phone: phoneNumber,
          message: "Sandbox Reminder: Work not uploaded yet! ⏰"
        }
      });

      if (error) throw error;
      addLog("Message Sent Successfully! ✅");
      toast.success("Message sent");
    } catch (err: any) {
      addLog(`Error sending message: ${err.message} ❌`);
      toast.error("Failed to send");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
      setSelectedUsers(prev => 
        prev.includes(userId) 
            ? prev.filter(id => id !== userId)
            : [...prev, userId]
      );
  };

  const toggleAll = () => {
      if (selectedUsers.length === allUsers.length) {
          setSelectedUsers([]);
      } else {
          setSelectedUsers(allUsers.map(u => u.user_id));
      }
  };

  const triggerFunction = async (functionName: string, label: string) => {
      if (selectedUsers.length === 0) {
          toast.error("Please select at least one user");
          return;
      }
      
      setLoading(true);
      addLog(`Triggering ${label} for ${selectedUsers.length} users...`);

      try {
          const { data, error } = await supabase.functions.invoke(functionName, {
              body: { target_user_ids: selectedUsers }
          });

          if (error) throw error;
          
          addLog(`${label} Completed. Sent: ${data?.sent_count || data?.reminders_sent || 'N/A'}`);
          toast.success(`${label} Triggered`);
      } catch (error: any) {
          addLog(`Error triggering ${label}: ${error.message}`);
          toast.error(`Failed: ${error.message}`);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">WhatsApp LogicSandbox</h1>
         <Button variant="outline" onClick={() => setLogs([])}><Trash2 className="w-4 h-4 mr-2"/> Clear Logs</Button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Column 1: Sandbox Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
             <CardTitle>Sandbox Controls</CardTitle>
             <CardDescription>Simulate local business logic state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/10">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Main Switch</Label>
                <p className="text-sm text-muted-foreground">Master toggle. If OFF, nothing runs.</p>
              </div>
              <Switch checked={mainSwitch} onCheckedChange={setMainSwitch} />
            </div>

            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-secondary/10">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Work Uploaded</Label>
                <p className="text-sm text-muted-foreground">If ON, reminder is suppressed.</p>
              </div>
              <Switch checked={workUploaded} onCheckedChange={setWorkUploaded} />
            </div>

            <div className="space-y-2">
                <Label>Target Phone Number</Label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="e.g. 919876543210"
                    />
                </div>
            </div>

            <Button onClick={sendSandboxReminder} disabled={loading || !phoneNumber} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                Trigger Sandbox Test
            </Button>

          </CardContent>
        </Card>

        {/* Column 2: User Selection & Manual Trigger */}
        <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
                <CardTitle>Manual Trigger Console</CardTitle>
                <CardDescription>Select users to force-run reports</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b">
                     <h3 className="font-semibold text-sm">Users ({allUsers.length})</h3>
                     <Button variant="ghost" size="sm" onClick={toggleAll}>
                         {selectedUsers.length === allUsers.length ? "Deselect All" : "Select All"}
                     </Button>
                </div>
                
                <ScrollArea className="flex-1 h-[250px] border rounded-md p-2">
                    {fetchingUsers ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div>
                    ) : (
                        <div className="space-y-2">
                            {allUsers.length === 0 && (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    No users found via Edge Function.
                                </div>
                            )}
                            {allUsers.map(u => (
                                <div key={u.user_id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer" onClick={() => toggleUser(u.user_id)}>
                                    <Checkbox checked={selectedUsers.includes(u.user_id)} onCheckedChange={() => toggleUser(u.user_id)} />
                                    <div className="text-sm">
                                        <p className="font-medium leading-none">{u.full_name || 'Unknown Name'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.phone ? u.phone : <span className="text-red-400">No Phone</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="space-y-2 pt-2">
                    <Button variant="secondary" className="w-full justify-start" onClick={() => triggerFunction('send-weekly-report', 'Weekly Report')} disabled={loading}>
                        <Send className="w-4 h-4 mr-2 text-blue-500" /> Send Weekly Report
                    </Button>
                     <Button variant="secondary" className="w-full justify-start" onClick={() => triggerFunction('send-monthly-report', 'Monthly Report')} disabled={loading}>
                        <Send className="w-4 h-4 mr-2 text-purple-500" /> Send Monthly Report
                    </Button>
                     <Button variant="secondary" className="w-full justify-start" onClick={() => triggerFunction('daily-reminder', 'Daily Reminder')} disabled={loading}>
                        <Send className="w-4 h-4 mr-2 text-orange-500" /> Send Daily Reminder
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Column 3: Logs */}
        <Card className="lg:col-span-1 flex flex-col h-[600px] lg:h-auto">
           <CardHeader>
             <CardTitle>Activity Log</CardTitle>
             <CardDescription>Real-time execution logs</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full rounded-md border p-4 bg-black/90 text-green-400 font-mono text-sm max-h-[500px]">
                    {logs.length === 0 && <div className="text-muted-foreground italic">No logs yet...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-green-900/30 pb-1 last:border-0 break-words whitespace-pre-wrap">
                            {log}
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </ScrollArea>
           </CardContent>
        </Card>

      </div>
    </div>
  );
}
