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
import { withPageAccessibility } from '@/lib/withPageAccessibility';

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
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile-optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Courses & Prices</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your course catalog and pricing</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleAddNew} 
                className="w-full sm:w-auto h-12 sm:h-auto min-h-[44px] flex items-center justify-center gap-2 text-base sm:text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Name</label>
                  <Input
                    value={formData['course name']}
                    onChange={(e) => setFormData({ ...formData, 'course name': e.target.value })}
                    placeholder="Enter course name"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Details</label>
                  <Textarea
                    value={formData['course details']}
                    onChange={(e) => setFormData({ ...formData, 'course details': e.target.value })}
                    placeholder="Enter course details"
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="e.g., $ ( dollar )"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Price</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData['course price']}
                    onChange={(e) => setFormData({ ...formData, 'course price': e.target.value })}
                    placeholder="Enter price"
                    className="h-12 text-base"
                    inputMode="decimal"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button type="submit" className="flex-1 h-12 text-base font-medium">
                    {editingCourse ? 'Update' : 'Add'} Course
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 h-12 text-base font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-base sm:text-lg">All Courses</span>
              <Badge variant="secondary" className="w-fit">
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {courses.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">No courses found</p>
                <Button onClick={handleAddNew} className="h-12 sm:h-auto min-h-[44px] text-base sm:text-sm font-medium">
                  Add your first course
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block md:hidden space-y-3 p-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="p-4 hover-lift">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base leading-tight">
                              {course['course name'] || 'Untitled Course'}
                            </h3>
                            {course['course details'] && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {course['course details']}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Currency:</span>
                              <span className="font-medium">{course.currency || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Price:</span>
                              <span className="font-medium text-primary">
                                {course['course price'] !== null ? course['course price'] : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(course)}
                            className="flex-1 h-10 text-xs font-medium"
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                            className="flex-1 h-10 text-xs font-medium text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </Button>
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
                          <TableCell className="font-medium text-primary">
                            {course['course price'] !== null ? course['course price'] : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(course)}
                                className="h-9 min-h-[36px]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(course.id)}
                                className="text-destructive hover:text-destructive h-9 min-h-[36px]"
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default withPageAccessibility(CoursesPrices);