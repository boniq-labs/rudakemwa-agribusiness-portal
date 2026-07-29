import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { animalAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Plus, Search, Camera } from 'lucide-react';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

export default function Cattle() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');

  const { data: animalsData, isLoading } = useQuery({
    queryKey: ['animals', 'cattle'],
    queryFn: async () => {
      const categories = await animalAPI.getCategories().then(r => r.data.data || []);
      const cattleCat = categories.find((c: any) => c.name.toLowerCase() === 'cattle');
      if (!cattleCat) return [];
      const response = await animalAPI.getAll({ animal_category_id: cattleCat.id, limit: 1000 });
      return response.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => animalAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
    },
  });

  const cattle = Array.isArray(animalsData) ? animalsData : [];
  const filtered = search
    ? cattle.filter((c: any) =>
        `${c.name || ''} ${c.tag_number || ''} ${c.breed_name || ''}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : cattle;

  const columns: Column<any>[] = [
    {
      key: 'photo', label: '',
      render: (c: any) => c.photo
        ? <img src={c.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={16} color="var(--primary)" /></div>,
    },
    { key: 'name', label: 'Name', render: (c: any) => c.name || 'Unnamed' },
    { key: 'tag_number', label: 'Ear Tag' },
    { key: 'breed_name', label: 'Breed', render: (c: any) => c.breed_name || '-' },
    { key: 'gender', label: 'Gender', render: (c: any) => c.gender ? <span style={{ textTransform: 'capitalize' }}>{c.gender}</span> : '-' },
    { key: 'animal_status', label: 'Status', render: (c: any) => <StatusBadge status={c.animal_status || c.status || 'active'} /> },
    { key: 'weight', label: 'Weight', render: (c: any) => c.weight ? `${c.weight} kg` : '-' },
    { key: 'date_of_birth', label: 'Date of Birth', render: (c: any) => c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : '-' },
    {
      key: 'actions', label: 'Actions',
      render: (c: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={(e) => { e.stopPropagation(); navigate(`/animals/profile/${c.id}`); }}>View</button>
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={(e) => { e.stopPropagation(); navigate(`/animals/registration?edit=${c.id}`); }}>Edit</button>
          <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this animal?')) deleteMutation.mutate(c.id); }} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage title="Cattle Management" subtitle="View and manage all registered cattle"
      actions={<button className="btn btn-primary" onClick={() => navigate('/animals/registration?type=cattle')}><Plus size={16} /> Register Cattle</button>}
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search cattle..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No cattle registered" onRowClick={(c: any) => navigate(`/animals/profile/${c.id}`)} />
    </ModulePage>
  );
}
