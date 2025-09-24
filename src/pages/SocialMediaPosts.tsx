import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardHeader, LiquidGlassCardTitle } from "@/components/ui/liquid-glass-card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, CheckCircle, Clock, XCircle, Plus, Trash2, Edit, Sparkles, UserPlus, Users, MessageCircle, User, Check, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { format } from 'date-fns';

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
  author?: string | null;
  user_name?: string | null;
}

interface SocialUser {
  id: string;
  name: string;
  platform?: string;
  username?: string;
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
  const [aiGenerationTimer, setAiGenerationTimer] = useState(0);
  
  // Form state
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostPlatform, setNewPostPlatform] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  
  // User management state  
  const [socialUsers, setSocialUsers] = useState<SocialUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserPlatform, setNewUserPlatform] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

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
    if (aiGenerationTimer > 0) {
      interval = setInterval(() => {
        setAiGenerationTimer((prev) => {
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
  }, [aiGenerationTimer]);

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
    if (!newUserPlatform.trim() || !newUserUsername.trim()) return;

    try {
      const { data, error } = await supabase
        .from('social_users')
        .insert([{ 
          platform: newUserPlatform.trim(),
          username: newUserUsername.trim(),
          name: `${newUserPlatform}: ${newUserUsername}`
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Social media user added successfully!",
      });

      setNewUserPlatform("");
      setNewUserUsername("");
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

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim() || !newPostPlatform) return;

    setIsLoading(true);
    try {
      const postData: any = {
        content: newPostContent.trim(),
        platform: newPostPlatform,
        created_by: user.id,
        status: 'pending',
        author: user.email || 'Unknown'
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

      setNewPostContent("");
      setNewPostPlatform("");
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
  };

  const handleUpdatePost = async () => {
    if (!user || !editingPost?.content.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editingPost.content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully!",
      });

      setEditingPost(null);
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
  };

  const handleGenerateWithAI = async () => {
    if (!user || isGeneratingAI) return;

    setIsGeneratingAI(true);
    setAiGenerationTimer(300); // 5 minutes in seconds

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
      setAiGenerationTimer(0);
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

  // Filter posts based on status and platform
  const filteredPosts = posts.filter(post => {
    const statusMatch = statusFilter === "all" || post.status === statusFilter;
    const platformMatch = platformFilter === "all" || post.platform === platformFilter;
    return statusMatch && platformMatch;
  });

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
      <div className="space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Social Media Posts</h1>
              <p className="text-muted-foreground mt-2">
                Manage and schedule your social media content
              </p>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section aria-labelledby="stats-heading" className="space-y-4">
          <h2 id="stats-heading" className="sr-only">Post Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <LiquidGlassCard className="p-4" intensity="light">
              <div className="text-2xl font-bold text-primary">{posts.length}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </LiquidGlassCard>
            <LiquidGlassCard className="p-4" intensity="light">
              <div className="text-2xl font-bold text-green-500">{posts.filter(p => p.status === 'approved').length}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </LiquidGlassCard>
            <LiquidGlassCard className="p-4" intensity="light">
              <div className="text-2xl font-bold text-yellow-500">{posts.filter(p => p.status === 'pending').length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </LiquidGlassCard>
            <LiquidGlassCard className="p-4" intensity="light">
              <div className="text-2xl font-bold text-red-500">{posts.filter(p => p.status === 'rejected').length}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </LiquidGlassCard>
          </div>
        </section>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        {/* Filter Controls Section */}
        <section aria-labelledby="filters-heading" className="space-y-4">
          <h2 id="filters-heading" className="text-lg font-semibold">Filter & Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Social User
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </section>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        {/* Social Users Management Section */}
        {showAddUserForm && (
          <section aria-labelledby="add-user-heading">
            <LiquidGlassCard intensity="medium">
              <LiquidGlassCardHeader>
                <LiquidGlassCardTitle id="add-user-heading">Add Social Media User</LiquidGlassCardTitle>
              </LiquidGlassCardHeader>
              <LiquidGlassCardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Platform (e.g., twitter)"
                    value={newUserPlatform}
                    onChange={(e) => setNewUserPlatform(e.target.value)}
                    aria-label="Platform name"
                  />
                  <Input
                    placeholder="Username"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    aria-label="Username"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddUser} disabled={!newUserPlatform || !newUserUsername}>
                      Add User
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddUserForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </LiquidGlassCardContent>
            </LiquidGlassCard>
          </section>
        )}

        {/* Add New Post Form Section */}
        {showAddForm && (
          <section aria-labelledby="create-post-heading">
            <LiquidGlassCard intensity="medium">
              <LiquidGlassCardHeader>
                <LiquidGlassCardTitle id="create-post-heading">Create New Post</LiquidGlassCardTitle>
              </LiquidGlassCardHeader>
              <LiquidGlassCardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your post content..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                    aria-label="Post content"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={newPostPlatform} onValueChange={setNewPostPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreatePost} 
                        disabled={!newPostContent || !newPostPlatform}
                        className="flex-1"
                      >
                        Create Post
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setShowAddForm(false);
                        setNewPostContent('');
                        setNewPostPlatform('');
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </LiquidGlassCardContent>
            </LiquidGlassCard>
          </section>
        )}

        {/* AI Generation Status Section */}
        {isGeneratingAI && (
          <section aria-labelledby="ai-generation-heading" className="my-6">
            <LiquidGlassCard className="border-primary/50" intensity="light" glow>
              <LiquidGlassCardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground" id="ai-generation-heading">
                    AI is generating content... ({aiGenerationTimer}s)
                  </span>
                </div>
              </LiquidGlassCardContent>
            </LiquidGlassCard>
          </section>
        )}

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

        {/* Posts List Section */}
        <section aria-labelledby="posts-list-heading" className="space-y-6">
          <h2 id="posts-list-heading" className="text-lg font-semibold">Posts ({filteredPosts.length})</h2>
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <LiquidGlassCard intensity="light">
                <LiquidGlassCardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No posts found matching your criteria</p>
                    <p className="text-sm mt-1">Create your first post to get started</p>
                  </div>
                </LiquidGlassCardContent>
              </LiquidGlassCard>
            ) : (
              filteredPosts.map((post) => (
                <article key={post.id}>
                  <LiquidGlassCard intensity="medium" interactive>
                    <LiquidGlassCardContent className="pt-6">
                      <div className="flex flex-col space-y-4">
                        {/* Post Header */}
                        <header className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {post.platform}
                            </Badge>
                            {getStatusBadge(post.status)}
                          </div>
                          <time className="text-sm text-muted-foreground" dateTime={post.created_at}>
                            {format(new Date(post.created_at), 'MMM dd, yyyy HH:mm')}
                          </time>
                        </header>

                        {/* Post Content */}
                        {editingPost?.id === post.id ? (
                          <div className="space-y-4">
                            <Textarea
                              value={editingPost.content}
                              onChange={(e) => setEditingPost({
                                ...editingPost,
                                content: e.target.value
                              })}
                              rows={4}
                              aria-label="Edit post content"
                            />
                            <div className="flex gap-2">
                              <Button onClick={handleUpdatePost} size="sm">
                                Save Changes
                              </Button>
                              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {post.content}
                            </p>
                          </div>
                        )}

                        {/* Post Footer */}
                        <footer className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>By {post.author || 'System'}</span>
                          </div>
                          <div className="flex gap-2" role="group" aria-label="Post actions">
                            {post.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleUpdatePostStatus(post.id, 'approved')}
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  aria-label="Approve post"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleUpdatePostStatus(post.id, 'rejected')}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  aria-label="Reject post"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              onClick={() => handleEditPost(post)}
                              size="sm"
                              variant="ghost"
                              aria-label="Edit post"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-600 hover:text-red-700"
                                  aria-label="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeletePost(post.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </footer>
                      </div>
                    </LiquidGlassCardContent>
                  </LiquidGlassCard>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default SocialMediaPosts;