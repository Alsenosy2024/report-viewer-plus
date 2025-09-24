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
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

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
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access social media posts management.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Mobile-optimized Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Social Media Posts</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your social media content and approvals</p>
          </div>
          
          {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button 
              onClick={() => setShowAddUserForm(!showAddUserForm)} 
              variant="outline"
              className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Users
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-background border shadow-lg">
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
              className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium justify-center gap-2"
              variant="secondary"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isGeneratingAI ? `Generating... ${Math.floor(aiTimer / 60)}:${(aiTimer % 60).toString().padStart(2, '0')}` : "Generate Posts with AI"}
              </span>
              <span className="sm:hidden">
                {isGeneratingAI ? `${Math.floor(aiTimer / 60)}:${(aiTimer % 60).toString().padStart(2, '0')}` : "AI Generate"}
              </span>
            </Button>
            
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Post
            </Button>
          </div>
        </div>

        {/* Mobile-optimized Filter Section */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Label htmlFor="account-filter" className="text-sm font-medium">Filter by Account:</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
                <Select value={filterByAccount} onValueChange={setFilterByAccount}>
                  <SelectTrigger className="h-12 sm:h-auto sm:w-[200px]">
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
                    className="h-10 sm:h-8 text-sm font-medium"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-optimized Add User Form */}
        {showAddUserForm && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Add New User</CardTitle>
              <CardDescription className="text-sm">Add a new social media account to post from</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">User Name</Label>
                  <Input
                    id="username"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter user name..."
                    className="h-12 text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <Button 
                    onClick={handleAddUser} 
                    disabled={!newUserName.trim()}
                    className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                  >
                    Add User
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddUserForm(false)}
                    className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-optimized Add Post Form */}
        {showAddForm && (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Create New Post</CardTitle>
              <CardDescription className="text-sm">Add content for your social media post</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your social media post content..."
                    required
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user" className="text-sm font-medium">User Account</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="h-12 sm:h-auto">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-sm font-medium">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-12 sm:h-auto">
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

                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="scheduled" className="text-sm font-medium">Scheduled For (Optional)</Label>
                    <Input
                      id="scheduled"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !content.trim() || !selectedUser}
                    className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                  >
                    {isLoading ? "Creating..." : "Create Post"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Mobile-optimized Posts List */}
        <div className="space-y-3 sm:space-y-4">
          {posts.filter(post => filterByAccount === "all" || post.metadata?.social_user_id === filterByAccount).length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-muted-foreground text-sm sm:text-base">
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
              <Card key={post.id} className="hover-lift">
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile: Stack everything vertically, Desktop: Keep original layout */}
                  <div className="space-y-4">
                    {/* Status and badges - mobile stacked */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
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
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Users className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{post.user_name}</span>
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className="capitalize text-xs">{post.platform}</Badge>
                        
                        {post.scheduled_for && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span className="hidden sm:inline">{new Date(post.scheduled_for).toLocaleDateString()}</span>
                            <span className="sm:hidden">{new Date(post.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action buttons - mobile full width */}
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPost(post)}
                          className="flex-1 sm:flex-none gap-1 h-9 text-xs font-medium"
                        >
                          <Edit className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePost(post.id)}
                          className="flex-1 sm:flex-none gap-1 h-9 text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed">{post.content}</p>
                      
                      <div className="text-xs text-muted-foreground space-y-1 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
                        <span>Created: {new Date(post.created_at).toLocaleString()}</span>
                        {post.approved_at && (
                          <span>
                            {post.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(post.approved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mobile-optimized Edit Dialog */}
        <Dialog open={!!editingPost} onOpenChange={() => handleCancelEdit()}>
          <DialogContent className="max-w-sm sm:max-w-2xl mx-4 sm:mx-auto bg-background border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Post</DialogTitle>
              <DialogDescription className="text-sm">
                Update your social media post content and settings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-content" className="text-sm font-medium">Content</Label>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your social media post content..."
                  required
                  rows={4}
                  className="text-base resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-user" className="text-sm font-medium">User Account</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-12 sm:h-auto">
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
                
                <div className="space-y-2">
                  <Label htmlFor="edit-platform" className="text-sm font-medium">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="h-12 sm:h-auto">
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

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="edit-scheduled" className="text-sm font-medium">Scheduled For (Optional)</Label>
                  <Input
                    id="edit-scheduled"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !content.trim() || !selectedUser}
                  className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium"
                >
                  {isLoading ? "Updating..." : "Update Post"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SocialMediaPosts;