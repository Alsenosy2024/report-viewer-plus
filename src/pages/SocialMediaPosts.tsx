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
import { Calendar, CheckCircle, Clock, XCircle, Plus, Trash2, Edit, Sparkles, UserPlus, Users, Send, AlertCircle, Loader2, Facebook, Twitter, Linkedin, Instagram, Share2, Filter, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  id: string;
  content: string;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  posting_status: 'not_posted' | 'posting' | 'posted' | 'failed';
  posted_at: string | null;
  posting_error: string | null;
  external_post_id: string | null;
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
  const [filterByPostingStatus, setFilterByPostingStatus] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchSocialUsers();
    }
  }, [user]);

  // Subscribe to real-time updates for posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post updated:', payload);
          const updatedPost = payload.new as Post;
          
          // Update only the specific post in state
          setPosts((prevPosts) => 
            prevPosts.map((post) => 
              post.id === updatedPost.id ? updatedPost : post
            )
          );

          // Show toast notification for posting status changes
          if (updatedPost.posting_status === 'posted') {
            toast({
              title: "Post Published! 🎉",
              description: `Your post has been successfully published to ${updatedPost.platform}.`,
            });
          } else if (updatedPost.posting_status === 'failed') {
            toast({
              title: "Post Failed",
              description: updatedPost.posting_error || "Failed to publish the post. Please try again.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

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

  // Platform icon and color helpers
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      default:
        return <Share2 className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800';
      case 'facebook':
        return 'bg-blue-600/10 text-blue-800 border-blue-300 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-700';
      case 'instagram':
        return 'bg-pink-500/10 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-400 dark:border-pink-800';
      case 'linkedin':
        return 'bg-blue-700/10 text-blue-900 border-blue-400 dark:bg-blue-700/20 dark:text-blue-200 dark:border-blue-600';
      default:
        return 'bg-secondary/50 text-secondary-foreground border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800 transition-colors">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800 transition-colors">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800 transition-colors">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getPostingStatusBadge = (postingStatus: string, postedAt?: string | null) => {
    switch (postingStatus) {
      case 'posted':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800 transition-colors">
            <Send className="w-3 h-3 mr-1" />
            Posted
            {postedAt && <span className="ml-1 text-xs opacity-75">• {new Date(postedAt).toLocaleDateString()}</span>}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800 transition-colors">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'posting':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800 transition-colors">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Posting...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted/50 transition-colors">
            <Clock className="w-3 h-3 mr-1" />
            Not Posted
          </Badge>
        );
    }
  };

  const handleUpdatePostingStatus = async (postId: string, newStatus: 'posted' | 'failed', errorMessage?: string) => {
    if (!user) return;

    try {
      const updateData: any = {
        posting_status: newStatus,
      };

      if (newStatus === 'posted') {
        updateData.posted_at = new Date().toISOString();
        updateData.posting_error = null;
      } else if (newStatus === 'failed' && errorMessage) {
        updateData.posting_error = errorMessage;
        updateData.posted_at = null;
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Post marked as ${newStatus}!`,
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

  const handlePostNow = async (post: Post) => {
    if (!user) return;

    try {
      // Update status to posting
      const { error: updateError } = await supabase
        .from('posts')
        .update({ posting_status: 'posting' })
        .eq('id', post.id);

      if (updateError) throw updateError;

      // Prepare callback URL for N8N to report back
      const callbackUrl = "https://flojlnzqivsziumuebgy.supabase.co/functions/v1/post-status-callback";

      // Trigger N8N webhook
      const response = await fetch("https://primary-production-245af.up.railway.app/webhook-test/webpost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: post.id,
          content: post.content,
          platform: post.platform,
          user_name: post.user_name,
          scheduled_for: post.scheduled_for,
          metadata: post.metadata,
          timestamp: new Date().toISOString(),
          callback_url: callbackUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger posting webhook');
      }

      toast({
        title: "Posting Started",
        description: "Post is being published to social media...",
      });

      fetchPosts();
    } catch (error: any) {
      // Mark as failed on error
      await supabase
        .from('posts')
        .update({ 
          posting_status: 'failed',
          posting_error: error.message 
        })
        .eq('id', post.id);

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      
      fetchPosts();
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

  // Filtered posts
  const filteredPosts = posts.filter(post => 
    (filterByAccount === "all" || post.metadata?.social_user_id === filterByAccount) &&
    (filterByPostingStatus === "all" || post.posting_status === filterByPostingStatus)
  );

  const hasActiveFilters = filterByAccount !== "all" || filterByPostingStatus !== "all";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section with Gradient */}
        <div className="mb-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Social Media Posts
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Manage your social media content across all platforms
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              size="lg"
              className="h-11 sm:h-12 px-6 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span>Create Post</span>
            </Button>
            
            <Button 
              onClick={handleGenerateWithAI} 
              disabled={isGeneratingAI}
              variant="secondary"
              size="lg"
              className="h-11 sm:h-12 px-6 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className={`w-5 h-5 mr-2 ${isGeneratingAI ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {isGeneratingAI ? `Generating... ${Math.floor(aiTimer / 60)}:${(aiTimer % 60).toString().padStart(2, '0')}` : "AI Generate"}
              </span>
              <span className="sm:hidden">
                {isGeneratingAI ? `${Math.floor(aiTimer / 60)}:${(aiTimer % 60).toString().padStart(2, '0')}` : "AI"}
              </span>
            </Button>

            <Button 
              onClick={() => setShowAddUserForm(!showAddUserForm)} 
              variant="outline"
              size="lg"
              className="h-11 sm:h-12 px-6 font-medium"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Account</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-11 sm:h-12 px-6 font-medium"
                >
                  <Users className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">Manage Accounts</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background/95 backdrop-blur-sm border shadow-xl">
                {socialUsers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No accounts yet
                  </div>
                ) : (
                  socialUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded-md transition-colors mx-1">
                      <span className="text-sm font-medium truncate flex-1">{user.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Modern Filter Section */}
        <Card className="mb-6 border-2 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-auto">
                  {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Account
                </Label>
                <div className="flex gap-2">
                  <Select value={filterByAccount} onValueChange={setFilterByAccount}>
                    <SelectTrigger className="h-10 bg-background">
                      <SelectValue placeholder="All accounts" />
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
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFilterByAccount("all")}
                      className="h-10 w-10 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Posting Status
                </Label>
                <div className="flex gap-2">
                  <Select value={filterByPostingStatus} onValueChange={setFilterByPostingStatus}>
                    <SelectTrigger className="h-10 bg-background">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="not_posted">Not Posted</SelectItem>
                      <SelectItem value="posting">Posting</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterByPostingStatus !== "all" && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFilterByPostingStatus("all")}
                      className="h-10 w-10 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFilterByAccount("all");
                    setFilterByPostingStatus("all");
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Account Form */}
        {showAddUserForm && (
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Add New Account
                  </CardTitle>
                  <CardDescription>Create a new social media account profile</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowAddUserForm(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Account Name</Label>
                  <Input
                    id="username"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g., Company Twitter, Personal Instagram..."
                    className="h-11 text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newUserName.trim()) {
                        handleAddUser();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2 sm:items-end">
                  <Button 
                    onClick={handleAddUser} 
                    disabled={!newUserName.trim()}
                    className="h-11 px-6 font-medium flex-1 sm:flex-none"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Post Form */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Create New Post
                  </CardTitle>
                  <CardDescription>Compose content for your social media channels</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium">Post Content *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your engaging social media content here..."
                    required
                    rows={5}
                    className="text-base resize-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} characters
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user" className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Account *
                    </Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Select account" />
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
                    <Label htmlFor="platform" className="text-sm font-medium flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Platform *
                    </Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            General
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </div>
                        </SelectItem>
                        <SelectItem value="facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule (Optional)
                    </Label>
                    <Input
                      id="scheduled"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="h-11 text-base bg-background"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !content.trim() || !selectedUser}
                    size="lg"
                    className="h-11 px-8 font-medium flex-1 sm:flex-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Post
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    size="lg"
                    className="h-11 px-8 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {hasActiveFilters ? "No posts match your filters" : "No posts yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your filters or create a new post" 
                  : "Create your first social media post to get started!"}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterByAccount("all");
                    setFilterByPostingStatus("all");
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Header with Platform & Account */}
                <CardHeader className="pb-3 bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getPlatformColor(post.platform)} border shrink-0`}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{post.user_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{post.platform}</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  {post.posting_error && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                      <p className="text-xs text-rose-800 dark:text-rose-400">
                        <span className="font-semibold">Error: </span>
                        {post.posting_error}
                      </p>
                    </div>
                  )}
                </CardContent>

                {/* Metadata Section */}
                <div className="px-6 py-3 border-t bg-muted/30">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          {getPostingStatusBadge(post.posting_status, post.posted_at)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border shadow-lg z-50">
                        <DropdownMenuItem 
                          onClick={() => handleUpdatePostingStatus(post.id, 'posted')}
                          className="gap-2 cursor-pointer"
                          disabled={post.status !== 'approved'}
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          Mark as Posted
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            const error = prompt('Enter error message (optional):');
                            handleUpdatePostingStatus(post.id, 'failed', error || undefined);
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Mark as Failed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {post.scheduled_for && (
                      <Badge variant="outline" className="gap-1 h-8 px-3">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(post.scheduled_for).toLocaleDateString()}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Created: {new Date(post.created_at).toLocaleString()}</div>
                    {post.approved_at && (
                      <div>
                        {post.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(post.approved_at).toLocaleString()}
                      </div>
                    )}
                    {post.posted_at && (
                      <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Posted: {new Date(post.posted_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Footer - Always Accessible */}
                <div className="p-4 border-t bg-background flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handlePostNow(post)}
                    disabled={post.status !== 'approved' || post.posting_status === 'posted' || post.posting_status === 'posting'}
                    className="w-full sm:flex-1 h-11 sm:h-10 gap-2 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Post Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleEditPost(post)}
                    className="w-full sm:w-auto h-11 sm:h-10 gap-2 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePost(post.id)}
                    className="w-full sm:w-auto h-11 sm:h-10 gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Post Modal - Full Screen on Mobile */}
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