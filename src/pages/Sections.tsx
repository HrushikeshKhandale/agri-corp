import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sectionService } from '@/services/sectionService';
import { Section } from '@/services/types/section';
import { Trash2, Edit, Plus } from 'lucide-react';

const Sections: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await sectionService.getAll();
      setSections(data || []);
    } catch (error: any) {
      if (error?.status === 204 || error?.response?.status === 204) {
        setSections([]);
        toast({ title: 'Info', description: 'No sections found' });
      } else {
        setSections([]);
        toast({ title: 'Error', description: 'Failed to fetch sections', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSection) {
        const result = await sectionService.update(editingSection.id, formData);
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Section updated successfully' });
        }
      } else {
        const result = await sectionService.create(formData);
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Section created successfully' });
        }
      }
      setDialogOpen(false);
      setFormData({ name: '' });
      setEditingSection(null);
      fetchSections();
    } catch (error: any) {
      if (error?.status === 204 || error?.response?.status === 204) {
        toast({ title: 'Success', description: editingSection ? 'Section updated successfully' : 'Section created successfully' });
        setDialogOpen(false);
        setFormData({ name: '' });
        setEditingSection(null);
        fetchSections();
      } else {
        toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
      }
    }
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({ name: section.name });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this section?')) {
      try {
        const result = await sectionService.delete(id);
        if (result?.status === 204 || result === null || result === undefined) {
          toast({ title: 'Success', description: 'Section deleted successfully' });
        }
        fetchSections();
      } catch (error: any) {
        if (error?.status === 204 || error?.response?.status === 204) {
          toast({ title: 'Success', description: 'Section deleted successfully' });
          fetchSections();
        } else {
          toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingSection(null);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sections Management</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Section Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSection ? 'Update' : 'Create'}
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections && sections.length > 0 ? (
                  sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.id}</TableCell>
                      <TableCell>{section.name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(section.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No sections found
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

export default Sections;