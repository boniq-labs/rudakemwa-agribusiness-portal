import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useConfirm } from '../components/ConfirmDialog';

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export default function RolesPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [search, setSearch] = useState('');

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const r = await client.get('/roles'); return r.data.data as Role[]; },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description: string }) => client.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', slug: '', description: '' });
      toast.success('Role created');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name: string; slug: string; description: string }) => client.put(`/roles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', slug: '', description: '' });
      toast.success('Role updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete role'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, slug: role.slug, description: role.description || '' });
    setShowModal(true);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: autoSlug(name) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (editing) {
      updateMutation.mutate({ id: editing.id, name: form.name, slug: form.slug, description: form.description });
    } else {
      createMutation.mutate({ name: form.name, slug: form.slug, description: form.description });
    }
  };

  const filtered = roles?.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Role Management</h2>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add New Role
        </button>
      </div>

      <div className="search-bar page-search">
        <Search size={18} />
        <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Slug</th><th>Description</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.length === 0 && <tr><td colSpan={4} className="text-center">No roles found</td></tr>}
              {filtered?.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td><code>{r.slug}</code></td>
                  <td>{r.description || '-'}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(r)}><Edit2 size={16} /></button>
                      <button className="btn btn-sm btn-danger" onClick={async () => { if (await confirm('Delete this role?')) deleteMutation.mutate(r.id); }} disabled={deleteMutation.isPending}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Role' : 'New Role'}</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Farm Manager" />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated from name" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional role description" rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
