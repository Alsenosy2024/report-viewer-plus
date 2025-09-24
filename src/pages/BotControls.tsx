import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BotRow {
  id: string;
  bot_name: string;
  is_active: boolean;
  webhook_url: string | null;
  last_updated: string;
}

const BotControls = () => {
  const { profile } = useAuth();
  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);
  const { toast } = useToast();
  const [bots, setBots] = useState<BotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingOpen, setAddingOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWebhook, setNewWebhook] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Bot Controls | Manage Bots & Webhooks';
  }, []);

  const loadBots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bot_status')
      .select('id, bot_name, is_active, webhook_url, last_updated')
      .order('bot_name', { ascending: true });
    if (error) {
      console.error(error);
      toast({ title: 'Failed to load bots', description: error.message, variant: 'destructive' });
    } else {
      setBots((data || []) as BotRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBots();
  }, []);

  const addBot = async () => {
    if (!newName.trim()) {
      toast({ title: 'Bot name required', variant: 'destructive' });
      return;
    }
    setSavingId('new');
    const { error } = await supabase.from('bot_status').insert({
      bot_name: newName.trim(),
      webhook_url: newWebhook.trim() || null,
      is_active: false,
    });
    setSavingId(null);
    if (error) {
      toast({ title: 'Could not add bot', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Bot added' });
    setAddingOpen(false);
    setNewName('');
    setNewWebhook('');
    loadBots();
  };

  const removeBot = async (id: string) => {
    const { error } = await supabase.from('bot_status').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Bot removed' });
    setBots((prev) => prev.filter((b) => b.id !== id));
  };

  const saveWebhook = async (id: string, webhook_url: string) => {
    setSavingId(id);
    const { error } = await supabase.from('bot_status').update({ webhook_url }).eq('id', id);
    setSavingId(null);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    // Ensure local state reflects the saved webhook so toggling works immediately
    setBots((prev) => prev.map((b) => (b.id === id ? { ...b, webhook_url } : b)));
    toast({ title: 'Webhook saved' });
  };

  const sendWebhook = async (url: string, status: 'on' | 'off') => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        mode: 'cors',
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return true;
    } catch (e: any) {
      console.error('Webhook error', e);
      toast({ title: 'Webhook error', description: e.message || 'Failed to call webhook', variant: 'destructive' });
      return false;
    }
  };

  const toggleBot = async (bot: BotRow, next: boolean) => {
    if (!bot.webhook_url) {
      toast({ title: 'Add webhook URL first', variant: 'destructive' });
      return;
    }

    // optimistic update
    setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, is_active: next } : b)));

    const status: 'on' | 'off' = next ? 'on' : 'off';
    const ok = await sendWebhook(bot.webhook_url, status);
    if (!ok) {
      // rollback
      setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, is_active: !next } : b)));
      return;
    }

    const { error } = await supabase
      .from('bot_status')
      .update({ is_active: next })
      .eq('id', bot.id);

    if (error) {
      // rollback on DB failure
      setBots((prev) => prev.map((b) => (b.id === bot.id ? { ...b, is_active: !next } : b)));
      toast({ title: 'Failed to save state', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: `Bot turned ${status}` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bot Controls</h1>
            <p className="text-muted-foreground mt-1">Manage bots, webhooks, and power state</p>
          </div>

          {isAdmin && (
            <Dialog open={addingOpen} onOpenChange={setAddingOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="glass-primary glass-hover glass-glow-pulse"
                  variant="glass-primary"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-dashboard-primary" />
                    Add New Bot
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Bot Name</Label>
                    <Input id="name" placeholder="e.g. WhatsApp Bot" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input id="webhook" placeholder="https://..." value={newWebhook} onChange={(e) => setNewWebhook(e.target.value)} />
                  </div>
                  <Button 
                    onClick={addBot} 
                    disabled={savingId === 'new'}
                    variant="glass-primary"
                    className="glass-hover"
                  >
                    {savingId === 'new' ? 'Adding...' : 'Add Bot'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </header>

        <main>
          <LiquidGlassCard intensity="strong" interactive floating shimmer glow className="glass-morph">
            <LiquidGlassCardHeader>
              <LiquidGlassCardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-dashboard-primary animate-pulse" />
                Registered Bots
              </LiquidGlassCardTitle>
            </LiquidGlassCardHeader>
            <LiquidGlassCardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : bots.length === 0 ? (
                <div className="text-muted-foreground">No bots yet</div>
              ) : (
                <div className="space-y-3">
                  {bots.map((b) => (
                    <BotRowItem
                      key={b.id}
                      bot={b}
                      isAdmin={isAdmin}
                      onSaveWebhook={saveWebhook}
                      onToggle={toggleBot}
                      onRemove={removeBot}
                      savingId={savingId}
                    />
                  ))}
                </div>
              )}
            </LiquidGlassCardContent>
          </LiquidGlassCard>
        </main>
      </div>
    </DashboardLayout>
  );
};

function BotRowItem({ bot, isAdmin, onSaveWebhook, onToggle, onRemove, savingId }: {
  bot: BotRow;
  isAdmin: boolean;
  onSaveWebhook: (id: string, url: string) => Promise<void>;
  onToggle: (bot: BotRow, next: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void> | void;
  savingId: string | null;
}) {
  const [url, setUrl] = useState<string>(bot.webhook_url || '');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setUrl(bot.webhook_url || '');
  }, [bot.webhook_url]);

  return (
    <div className="border rounded-md p-3 mb-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-3 font-medium text-foreground">{bot.bot_name}</div>
        <div className="md:col-span-6">
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={!isAdmin}
            />
            {isAdmin && (
              <Button
                variant="glass"
                size="sm"
                onClick={() => onSaveWebhook(bot.id, url)}
                disabled={savingId === bot.id}
                className="glass-hover"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Switch
              id={`switch-${bot.id}`}
              checked={bot.is_active}
              disabled={!isAdmin || !url || processing}
              onCheckedChange={async (next) => {
                setProcessing(true);
                await onToggle(bot, next);
                setProcessing(false);
              }}
            />
            <span className="text-sm text-muted-foreground">{bot.is_active ? 'On' : 'Off'}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="md:col-span-1 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="icon"
                  className="glass-hover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove bot "{bot.bot_name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(bot.id)}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

export default BotControls;
