import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CheckCircle, Clock, XCircle, Plus, Trash2, Edit, Sparkles, UserPlus, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  content: string;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  scheduled_for: string | null;
  metadata: any;
  user_name: string | null;
}

interface SocialUser {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

const SocialMediaPosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // AI Generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTimer, setAiTimer] = useState(0);
  
  // Form state
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("general");
  const [scheduledFor, setScheduledFor] = useState("");
  
  // User selection state
  const [socialUsers, setSocialUsers] = useState<SocialUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  
  // Filter state
  const [filterByAccount, setFilterByAccount] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchSocialUsers();
    }
  }, [user]);

  // AI Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (aiTimer > 0) {
      interval = setInterval(() => {
        setAiTimer((prev) => {
          if (prev <= 1) {
            setIsGeneratingAI(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aiTimer]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as Post[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchSocialUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('social_users')
        .select('*')
        .order('name');

      if (error) throw error;
      const users = (data || []) as SocialUser[];
      setSocialUsers(users);
      if (users.length > 0 && !selectedUser) {
        setSelectedUser(users[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('social_users')
        .insert([{ name: newUserName.trim() }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "User added successfully!",
      });

      setNewUserName("");
      setShowAddUserForm(false);
      fetchSocialUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('social_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully!",
      });

      fetchSocialUsers();
      // Reset selected user if deleted user was selected
      if (selectedUser === userId) {
        setSelectedUser("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || !selectedUser) return;

    setIsLoading(true);
    try {
      const selectedUserData = socialUsers.find(u => u.id === selectedUser);
      const postData: any = {
        content: content.trim(),
        platform,
        created_by: user.id,
        status: 'approved', // Default to approved
        user_name: selectedUserData?.name,
        metadata: {
          social_user_id: selectedUser,
          social_user_name: selectedUserData?.name
        }
      };

      if (scheduledFor) {
        postData.scheduled_for = scheduledFor;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      setContent("");
      setPlatform("general");
      setScheduledFor("");
      setSelectedUser(socialUsers[0]?.id || "");
      setShowAddForm(false);
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePostStatus = async (postId: string, newStatus: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const updateData: any = {
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Post ${newStatus} successfully!`,
      });

      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });

      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setContent(post.content);
    setPlatform(post.platform);
    setScheduledFor(post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : "");
    setSelectedUser(post.metadata?.social_user_id || socialUsers[0]?.id || "");
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || !editingPost || !selectedUser) return;

    setIsLoading(true);
    try {
      const selectedUserData = socialUsers.find(u => u.id === selectedUser);
      const updateData: any = {
        content: content.trim(),
        platform,
        updated_at: new Date().toISOString(),
        user_name: selectedUserData?.name,
        metadata: {
          social_user_id: selectedUser,
          social_user_name: selectedUserData?.name
        }
      };

      if (scheduledFor) {
        updateData.scheduled_for = scheduledFor;
      } else {
        updateData.scheduled_for = null;
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', editingPost.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully!",
      });

      setEditingPost(null);
      setContent("");
      setPlatform("general");
      setScheduledFor("");
      setSelectedUser(socialUsers[0]?.id || "");
      fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setContent("");
    setPlatform("general");
    setScheduledFor("");
    setSelectedUser(socialUsers[0]?.id || "");
  };

  const handleGenerateWithAI = async () => {
    if (!user || isGeneratingAI) return;

    setIsGeneratingAI(true);
    setAiTimer(300); // 5 minutes in seconds

    try {
      const response = await fetch("https://primary-production-245af.up.railway.app/webhook/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          user_id: user.id,
          triggered_from: window.location.origin,
        }),
      });

      toast({
        title: "AI Generation Started",
        description: "N8N workflow triggered! AI is generating posts. This will take about 5 minutes.",
      });
    } catch (error) {
      console.error("Error triggering N8N workflow:", error);
      toast({
        title: "Error",
        description: "Failed to trigger N8N workflow. Please try again.",
        variant: "destructive",
      });
      setIsGeneratingAI(false);
      setAiTimer(0);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access social media posts management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Media Posts</h1>
          <p className="text-muted-foreground">Manage your social media content and approvals</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddUserForm(!showAddUserForm)} 
            variant="outline"
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Manage Users
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {socialUsers.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No users found
                </div>
              ) : (
                socialUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm truncate flex-1">{user.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={handleGenerateWithAI} 
            disabled={isGeneratingAI}
            className="gap-2"
            variant="secondary"
          >
            <Sparkles className="w-4 h-4" />
            {isGeneratingAI ? `Generating... ${Math.floor(aiTimer / 60)}:${(aiTimer % 60).toString().padStart(2, '0')}` : "Generate Posts with AI"}
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Post
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="account-filter">Filter by Account:</Label>
            <Select value={filterByAccount} onValueChange={setFilterByAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {socialUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterByAccount !== "all" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilterByAccount("all")}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showAddUserForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Add a new social media account to post from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="username">User Name</Label>
                <Input
                  id="username"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name..."
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleAddUser} disabled={!newUserName.trim()}>
                  Add User
                </Button>
                <Button variant="outline" onClick={() => setShowAddUserForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>Add content for your social media post</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your social media post content..."
                  required
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="user">User Account</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {socialUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduled">Scheduled For (Optional)</Label>
                  <Input
                    id="scheduled"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !content.trim() || !selectedUser}>
                  {isLoading ? "Creating..." : "Create Post"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.filter(post => filterByAccount === "all" || post.metadata?.social_user_id === filterByAccount).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {filterByAccount === "all" 
                  ? "No posts found. Create your first post to get started!"
                  : "No posts found for this account. Try selecting a different account or clear the filter."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          posts
            .filter(post => filterByAccount === "all" || post.metadata?.social_user_id === filterByAccount)
            .map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          {getStatusBadge(post.status)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border shadow-lg z-50">
                        <DropdownMenuItem 
                          onClick={() => handleUpdatePostStatus(post.id, 'approved')}
                          className="gap-2 cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdatePostStatus(post.id, 'rejected')}
                          className="gap-2 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3 text-red-600" />
                          Rejected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {post.user_name && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {post.user_name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">{post.platform}</Badge>
                    {post.scheduled_for && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.scheduled_for).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPost(post)}
                      className="gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePost(post.id)}
                      className="gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(post.created_at).toLocaleString()}
                  {post.approved_at && (
                    <span className="ml-4">
                      {post.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(post.approved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => handleCancelEdit()}>
        <DialogContent className="max-w-2xl bg-background border shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Update your social media post content and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePost} className="space-y-4">
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your social media post content..."
                required
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-user">User Account</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {socialUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-scheduled">Scheduled For (Optional)</Label>
                <Input
                  id="edit-scheduled"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !content.trim() || !selectedUser}>
                {isLoading ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialMediaPosts;