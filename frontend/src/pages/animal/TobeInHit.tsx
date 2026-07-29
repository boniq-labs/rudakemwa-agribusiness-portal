import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface TobeInHitRecord {
  id: number;
  animal_category_id: number | null;
  animal_id: number | null;
  tobe_date: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  tag_number?: string;
  animal_name?: string;
}

export default function TobeInHit() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ animal_category_id: '', animal_id: '', tobe_date: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['tobe-in-hit', page, search],
    queryFn: async () => (await client.get('/animal/tobe-in-hit', { params: { page, limit: 25, search: search || undefined } })).data,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['animal-categories'],
    queryFn: async () => {
      const res = await client.get('/animals/categories');
      return Array.isArray(res.data) ? res.data : res.data.data || [];
    },
  });

  const fetchAnimals = async (categoryId?: string) => {
    try {
      const params: any = {};
      if (categoryId) params.animal_category_id = categoryId;
      const res = await client.get('/animals/select', { params });
      setAnimals(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {}
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editId) return client.put(`/animal/tobe-in-hit/${editId}`, payload);
      return client.post('/animal/tobe-in-hit', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tobe-in-hit'] }); toast.success(editId ? 'Updated' : 'Created'); setOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animal/tobe-in-hit/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tobe-in-hit'] }); toast.success('Deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const handleOpen = async (record?: TobeInHitRecord) => {
    const cats = Array.isArray(categoriesData) ? categoriesData : [];
    setCategories(cats);
    if (record) {
      setEditId(record.id);
      setForm({
        animal_category_id: String(record.animal_category_id || ''),
        animal_id: String(record.animal_id || ''),
        tobe_date: record.tobe_date ? record.tobe_date.substring(0, 10) : '',
      });
      if (record.animal_category_id) await fetchAnimals(String(record.animal_category_id));
    } else {
      setEditId(null);
      setForm({ animal_category_id: '', animal_id: '', tobe_date: '' });
      setAnimals([]);
    }
    setOpen(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      animal_category_id: form.animal_category_id ? Number(form.animal_category_id) : undefined,
      animal_id: form.animal_id ? Number(form.animal_id) : undefined,
      tobe_date: form.tobe_date || undefined,
    });
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'category_name', label: 'Category', render: (row: any) => row.category_name || '-' },
    { key: 'animal_name', label: 'Animal', render: (row: any) => row.animal_name || '-' },
    { key: 'tag_number', label: 'Tag', render: (row: any) => row.tag_number || '-' },
    {
      key: 'tobe_date', label: 'Tobe Date',
      render: (row: any) => row.tobe_date ? new Date(row.tobe_date).toLocaleDateString() : '-',
    },
    {
      key: 'created_at', label: 'Created',
      render: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
    },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (row: any) => (
        <div className="actions">
          <button className="btn btn-icon" title="Edit" onClick={() => handleOpen(row)}><Edit2 size={16} /></button>
          <button className="btn btn-icon btn-danger" title="Delete" onClick={async () => { if (await confirm('Delete?')) deleteMutation.mutate(row.id); }} disabled={deleteMutation.isPending}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage title="Tobe in Hit" actions={
      <button className="btn btn-primary" onClick={() => handleOpen()}><Plus size={16} /> Add Record</button>
    }>
      <input className="input" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ marginBottom: 16, maxWidth: 300 }} />

      <DataTable columns={columns} data={data?.data || []} loading={isLoading}
        pagination={{ page, pages: data?.pagination?.pages || 1, total: data?.pagination?.total || 0, onPageChange: setPage }}
      />

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Tobe in Hit' : 'Add Tobe in Hit'}</h3>
              <button className="btn btn-icon" onClick={() => setOpen(false)}>x</button>
            </div>
            <div className="modal-body">
              <FormField label="Animal Category">
                <select className="input" value={form.animal_category_id} onChange={async e => { const v = e.target.value; setForm(f => ({ ...f, animal_category_id: v, animal_id: '' })); await fetchAnimals(v); }}>
                  <option value="">-- Select --</option>
                  {categories.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Animal">
                <select className="input" value={form.animal_id} onChange={e => setForm(f => ({ ...f, animal_id: e.target.value }))}>
                  <option value="">-- Select --</option>
                  {animals.map((a: any) => <option key={a.id} value={String(a.id)}>{a.name || a.tag_number || a.id}</option>)}
                </select>
              </FormField>
              <FormField label="Tobe Date">
                <input className="input" type="date" value={form.tobe_date} onChange={e => setForm(f => ({ ...f, tobe_date: e.target.value }))} />
              </FormField>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editId ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
