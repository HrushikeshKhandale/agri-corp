import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { categoryService } from '@/services/categoryService';
import { sectionService } from '@/services/sectionService';
import { Category } from '@/services/types/category';
import { Section } from '@/services/types/section';
import { Trash2, Edit, Plus } from 'lucide-react';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', sectionId: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data || []);
    } catch (error: any) {
      if (error?.status === 204 || error?.response?.status === 204) {
        setCategories([]);
        toast({ title: 'Info', description: 'No categories found' });
      } else {
        setCategories([]);
        toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const data = await sectionService.getAll();
      setSections(data || []);
    } catch (error: any) {
      if (error?.status === 204 || error?.response?.status === 204) {
        setSections([]);
      } else {
        setSections([]);
        toast({ title: 'Error', description: 'Failed to fetch sections', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        section: { id: parseInt(formData.sectionId) }
      };

      if (editingCategory) {
        const result = await categoryService.update(editingCategory.id, { name: formData.name });
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Category updated successfully' });
        }
      } else {
        const result = await categoryService.create(payload);
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Category created successfully' });
        }
      }
      setDialogOpen(false);
      setFormData({ name: '', sectionId: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      if (error?.status === 204 || error?.response?.status === 204) {
        toast({ title: 'Success', description: editingCategory ? 'Category updated successfully' : 'Category created successfully' });
        setDialogOpen(false);
        setFormData({ name: '', sectionId: '' });
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      sectionId: category.section.id.toString() 
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const result = await categoryService.delete(id);
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Category deleted successfully' });
        }
        fetchCategories();
      } catch (error: any) {
        if (error?.status === 204 || error?.response?.status === 204) {
          toast({ title: 'Success', description: 'Category deleted successfully' });
          fetchCategories();
        } else {
          toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sectionId: '' });
    setEditingCategory(null);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {!editingCategory && (
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select value={formData.sectionId} onValueChange={(value) => setFormData({ ...formData, sectionId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections && sections.length > 0 ? (
                          sections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No sections available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.id}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.section?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;