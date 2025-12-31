import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function WhatsappSandbox() {
  const { user } = useAuth();
  const [mainSwitch, setMainSwitch] = useState(false);
  const [workUploaded, setWorkUploaded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  useEffect(() => {
    if (scrollRef.current) {
        // scrollRef.current.scrollIntoView({ behavior: 'smooth' }); // Doesn't work well with flex-col-reverse logic usually
    }
  }, [logs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (mainSwitch) {
      addLog("Timer started (60s interval)");
      
      // Immediate check on start? Maybe not, usually interval waits first.
      // Let's stick to standard interval.
      
      interval = setInterval(async () => {
        addLog("Timer tick...");

        if (workUploaded) {
          addLog("Skipping: Work already uploaded ✅");
          return;
        }

        if (!mainSwitch) {
            // Should be covered by cleanup but safety check
             addLog("Skipping: Main Switch OFF ❌");
             return;
        }

        // Logic to send message
        addLog("Condition met: Work NOT uploaded. Sending reminder... 🚀");
        await sendReminder();

      }, 60000); // 1 minute
    } else {
      if (logs.length > 0 && logs[0] !== "Timer stopped") {
        addLog("Timer stopped");
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mainSwitch, workUploaded]); // Re-create interval if states change? 
  // Actually, if we put verify logic inside interval, closure might capture old state if not careful.
  // With React hooks, easier to use a ref for latest state or simple dependency re-run.
  // Re-running interval on state change resets the timer, which might be annoying if toggling 'work uploaded' reset the 60s.
  // Better approach: Use refs for state inside interval, or use function update pattern if possible (but tricky with async logic).
  // Easiest correct way for this sandbox: Let it reset. It's a sandbox.

  const sendReminder = async () => {
    if (!phoneNumber) {
      addLog("Error: No phone number set.");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-whatsapp', {
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

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold">WhatsApp Logic Sandbox</h1>
         <Button variant="outline" onClick={() => setLogs([])}><Trash2 className="w-4 h-4 mr-2"/> Clear Logs</Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
             <CardTitle>Controls</CardTitle>
             <CardDescription>Simulate the business logic state</CardDescription>
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
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="e.g. 919876543210"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Enter number with country code (e.g., 91 for India)</p>
            </div>

            <Button onClick={sendReminder} disabled={loading || !phoneNumber} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                Trigger Manual Test
            </Button>

          </CardContent>
        </Card>

        <Card className="h-[500px] flex flex-col">
           <CardHeader>
             <CardTitle>Activity Log</CardTitle>
             <CardDescription>Refreshes every action</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full w-full rounded-md border p-4 bg-black/90 text-green-400 font-mono text-sm">
                    {logs.length === 0 && <div className="text-muted-foreground italic">No logs yet...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-green-900/30 pb-1 last:border-0">
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
