import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
interface AdminProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  is_approved: boolean;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

const AdminSettings = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [newApproved, setNewApproved] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,role,is_approved,created_at,approved_at,approved_by')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading users', description: error.message, variant: 'destructive' });
    } else {
      setRows(data as AdminProfileRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string, approve: boolean) => {
    setActionId(id);
    const updates: any = approve
      ? { is_approved: true, approved_at: new Date().toISOString(), approved_by: user?.id ?? null }
      : { is_approved: false, approved_at: null, approved_by: null };

    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    setActionId(null);
    if (error) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      toast({
        title: approve ? 'User approved' : 'Access revoked',
        description: approve ? 'The user can now access the dashboard.' : 'The user access has been revoked.'
      });
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newEmail,
          full_name: newName,
          password: newPassword,
          role: newRole,
          approved: newApproved,
        },
      });
      if (error) {
        throw new Error(error.message);
      }
      toast({
        title: 'User created',
        description: 'Profile created successfully.',
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('user');
      setNewApproved(true);
      await load();
    } catch (err: any) {
      toast({ title: 'Create user failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Not authorized</CardTitle>
          </CardHeader>
          <CardContent>
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings — User Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="mb-6">
            <form onSubmit={createUser} className="grid gap-4 md:grid-cols-6 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Optional" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'user')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="approved" checked={newApproved} onCheckedChange={setNewApproved} />
                <Label htmlFor="approved">Approved</Label>
              </div>
              <div>
                <Button type="submit" disabled={creating || !newEmail || !newPassword}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add user
                </Button>
              </div>
            </form>
          </section>
          {loading ? (
            <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.full_name || '—'}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell className="capitalize">{r.role}</TableCell>
                    <TableCell>{r.is_approved ? 'Approved' : 'Pending'}</TableCell>
                    <TableCell className="text-right">
                      {r.is_approved ? (
                        <Button variant="outline" size="sm" onClick={() => approve(r.id, false)} disabled={actionId === r.id}>
                          {actionId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldX className="h-4 w-4 mr-2" />}
                          Revoke
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => approve(r.id, true)} disabled={actionId === r.id}>
                          {actionId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminSettings;
