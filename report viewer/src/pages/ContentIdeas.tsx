import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HoverEffect } from "@/components/ui/hover-effect";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { withPageAccessibility } from "@/lib/withPageAccessibility";

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  is_posted: boolean;
  created_at: string;
  created_by: string;
}

function ContentIdeas() {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    is_posted: false,
  });

  useEffect(() => {
    if (user) {
      fetchContent();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('content-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'content'
          },
          () => {
            fetchContent();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المحتوى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('content')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "تم تحديث الفكرة بنجاح" });
      } else {
        const { error } = await supabase
          .from('content')
          .insert([{ ...formData, created_by: user.id }]);

        if (error) throw error;
        toast({ title: "تمت إضافة الفكرة بنجاح" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "خطأ",
        description: "فشل حفظ الفكرة",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = async (id: string) => {
    const item = content.find(c => c.id === id);
    if (item) {
      setEditingId(id);
      setFormData({
        title: item.title,
        summary: item.summary,
        is_posted: item.is_posted,
      });
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', editingId);

      if (error) throw error;
      
      toast({ title: "تم حذف الفكرة بنجاح" });
      setIsDialogOpen(false);
      resetForm();
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف الفكرة",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", summary: "", is_posted: false });
    setEditingId(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">يرجى تسجيل الدخول</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">أفكار المحتوى</h1>
            <p className="text-muted-foreground mt-2">
              إدارة أفكار البوستات والمحتوى
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة فكرة جديدة
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا توجد أفكار حتى الآن</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="mt-4"
              variant="outline"
            >
              إضافة أول فكرة
            </Button>
          </div>
        ) : (
          <HoverEffect
            items={content.map(item => ({
              id: item.id,
              title: item.title,
              description: item.summary,
              isPosted: item.is_posted,
            }))}
            onCardClick={handleCardClick}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[600px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "تعديل الفكرة" : "إضافة فكرة جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "قم بتعديل تفاصيل الفكرة"
                  : "أضف فكرة محتوى جديدة"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان البوست</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="أدخل عنوان البوست"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">ملخص الفكرة</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  placeholder="أدخل ملخص الفكرة"
                  required
                  className="min-h-[150px] text-right"
                  autoExpand
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_posted">حالة النشر</Label>
                <Select
                  value={formData.is_posted ? "posted" : "not_posted"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_posted: value === "posted" })
                  }
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر حالة النشر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_posted">غير منشور</SelectItem>
                    <SelectItem value="posted">منشور</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2">
                {editingId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    حذف
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingId ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default withPageAccessibility(ContentIdeas);
