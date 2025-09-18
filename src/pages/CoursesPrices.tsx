import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: number;
  'course name': string | null;
  'course details': string | null;
  currency: string | null;
  'course price': number | null;
}

const CoursesPrices = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    'course name': '',
    'course details': '',
    currency: '$ ( dollar )',
    'course price': ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses prices')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const courseData = {
        'course name': formData['course name'] || null,
        'course details': formData['course details'] || null,
        currency: formData.currency || null,
        'course price': formData['course price'] ? parseFloat(formData['course price']) : null
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('courses prices')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('courses prices')
          .insert([courseData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course added successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingCourse(null);
      setFormData({
        'course name': '',
        'course details': '',
        currency: '$ ( dollar )',
        'course price': ''
      });
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      'course name': course['course name'] || '',
      'course details': course['course details'] || '',
      currency: course.currency || '$ ( dollar )',
      'course price': course['course price']?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('courses prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Course deleted successfully"
      });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleAddNew = () => {
    setEditingCourse(null);
    setFormData({
      'course name': '',
      'course details': '',
      currency: '$ ( dollar )',
      'course price': ''
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses & Prices</h1>
            <p className="text-muted-foreground">Manage your course catalog and pricing</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Course Name</label>
                  <Input
                    value={formData['course name']}
                    onChange={(e) => setFormData({ ...formData, 'course name': e.target.value })}
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course Details</label>
                  <Textarea
                    value={formData['course details']}
                    onChange={(e) => setFormData({ ...formData, 'course details': e.target.value })}
                    placeholder="Enter course details"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g., $ ( dollar )"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Course Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData['course price']}
                    onChange={(e) => setFormData({ ...formData, 'course price': e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCourse ? 'Update' : 'Add'} Course
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Courses
              <Badge variant="secondary">{courses.length} course{courses.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No courses found</p>
                <Button onClick={handleAddNew}>Add your first course</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          {course['course name'] || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={course['course details'] || ''}>
                            {course['course details'] || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{course.currency || '-'}</TableCell>
                        <TableCell>
                          {course['course price'] !== null ? course['course price'] : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(course)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(course.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CoursesPrices;