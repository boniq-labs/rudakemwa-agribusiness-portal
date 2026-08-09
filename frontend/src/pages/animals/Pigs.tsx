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
import { resolveAssetUrl } from '../../utils/assetUrl';

export default function Pigs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');

  const { data: animalsData, isLoading } = useQuery({
    queryKey: ['animals', 'pigs'],
    queryFn: async () => {
      const categories = await animalAPI.getCategories().then(r => r.data.data || []);
      const pigCat = categories.find((c: any) => ['pigs', 'pig'].includes((c.name || '').trim().toLowerCase()));
      if (pigCat) {
        const response = await animalAPI.getAll({ animal_category_id: pigCat.id, limit: 10000 });
        return response.data.data || [];
      }
      const response = await animalAPI.getAll({ limit: 10000 });
      const all = response.data.data || [];
      return all.filter((a: any) => ['pigs', 'pig'].includes((a.category_name || '').toLowerCase()));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => animalAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
    },
  });

  const pigs = Array.isArray(animalsData) ? animalsData : [];
  const filtered = search
    ? pigs.filter((p: any) =>
        `${p.name || ''} ${p.tag_number || ''} ${p.breed_name || ''}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : pigs;

  const columns: Column<any>[] = [
    {
      key: 'photo', label: '',
      render: (p: any) => p.photo
        ? <img src={resolveAssetUrl(p.photo)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={16} color="var(--primary)" /></div>,
    },
    { key: 'name', label: 'Name', render: (p: any) => p.name || 'Unnamed' },
    { key: 'tag_number', label: 'Ear Tag' },
    { key: 'breed_name', label: 'Breed', render: (p: any) => p.breed_name || '-' },
    { key: 'gender', label: 'Gender', render: (p: any) => p.gender ? <span style={{ textTransform: 'capitalize' }}>{p.gender}</span> : '-' },
    { key: 'animal_status', label: 'Status', render: (p: any) => <StatusBadge status={p.animal_status || p.status || 'active'} /> },
    { key: 'weight', label: 'Weight', render: (p: any) => p.weight ? `${p.weight} kg` : '-' },
    { key: 'date_of_birth', label: 'Date of Birth', render: (p: any) => p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '-' },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={(e) => { e.stopPropagation(); navigate(`/animals/profile/${p.id}`); }}>View</button>
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={(e) => { e.stopPropagation(); navigate(`/animals/registration?edit=${p.id}`); }}>Edit</button>
          <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this pig?')) deleteMutation.mutate(p.id); }} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage title="Pigs Management" subtitle="View and manage all registered pigs"
      actions={<button className="btn btn-primary" onClick={() => navigate('/animals/registration?type=pig')}><Plus size={16} /> Register Pig</button>}
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search pigs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No pigs registered" onRowClick={(p: any) => navigate(`/animals/profile/${p.id}`)} />
    </ModulePage>
  );
}
