import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { withPageAccessibility } from '@/lib/withPageAccessibility';
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

  const [roleUpdateId, setRoleUpdateId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    setRoleUpdateId(id);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    setRoleUpdateId(null);
    if (error) {
      toast({ title: 'Role update failed', description: error.message, variant: 'destructive' });
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role } : r)));
      toast({ title: 'Role updated', description: 'User role has been updated.' });
    }
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', { body: { userId: id } });
      if (error) throw new Error(error.message);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: 'User removed', description: 'The user has been deleted.' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setDeletingId(null);
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
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="user@example.com"
                    className="h-12 text-base"
                    inputMode="email"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="Optional"
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    minLength={8} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Min 8 characters"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 items-end">
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as 'admin' | 'user')}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 h-12">
                  <Switch id="approved" checked={newApproved} onCheckedChange={setNewApproved} />
                  <Label htmlFor="approved" className="text-sm font-medium">Approved</Label>
                </div>
                <div>
                  <Button 
                    type="submit" 
                    disabled={creating || !newEmail || !newPassword}
                    className="w-full h-12 text-base font-medium"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add user
                  </Button>
                </div>
              </div>
            </form>
          </section>
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> 
              <span className="text-sm sm:text-base">Loading users...</span>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {rows.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{r.full_name || '—'}</h3>
                          <p className="text-xs text-muted-foreground break-all">{r.email}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          r.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {r.is_approved ? 'Approved' : 'Pending'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Role:</Label>
                        <Select value={r.role} onValueChange={(v) => updateRole(r.id, v as 'admin' | 'user')}>
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {r.is_approved ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => approve(r.id, false)} 
                            disabled={actionId === r.id}
                            className="flex-1 h-10 text-xs"
                          >
                            {actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldX className="h-3 w-3 mr-1" />}
                            Revoke
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => approve(r.id, true)} 
                            disabled={actionId === r.id}
                            className="flex-1 h-10 text-xs"
                          >
                            {actionId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                            Approve
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              disabled={deletingId === r.id}
                              className="flex-1 h-10 text-xs"
                            >
                              {deletingId === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-sm mx-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg">Remove user?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                This will permanently delete the user account and profile.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full h-12">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteUser(r.id)}
                                className="w-full h-12"
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
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
                        <TableCell className="font-medium">{r.full_name || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.email}</TableCell>
                        <TableCell>
                          <Select value={r.role} onValueChange={(v) => updateRole(r.id, v as 'admin' | 'user')}>
                            <SelectTrigger className="w-[120px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            r.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {r.is_approved ? 'Approved' : 'Pending'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {r.is_approved ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => approve(r.id, false)} 
                                disabled={actionId === r.id}
                                className="h-9"
                              >
                                {actionId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldX className="h-4 w-4 mr-2" />}
                                Revoke
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => approve(r.id, true)} 
                                disabled={actionId === r.id}
                                className="h-9"
                              >
                                {actionId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Approve
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  disabled={deletingId === r.id}
                                  className="h-9"
                                >
                                  {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove user?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the user account and profile.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(r.id)}>
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default withPageAccessibility(AdminSettings);
