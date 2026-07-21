import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import { accountingAPI, departmentsAPI } from '../../api/endpoints';
import { formatAmount } from '../../services/currency';
import { Plus, X, PieChart, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', department_id: '', fiscal_year: new Date().getFullYear().toString(), total_amount: '',
    items: [{ expense_category_id: '', planned_amount: '' }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['accounting-budgets'],
    queryFn: () => accountingAPI.getBudgets().then(r => r.data.data),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => accountingAPI.getExpenseCategories().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingAPI.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-budgets'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to create budget' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => accountingAPI.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-budgets'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to update budget' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountingAPI.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-budgets'] });
      toast.success('Budget deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete budget');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: '', department_id: '', fiscal_year: new Date().getFullYear().toString(), total_amount: '', items: [{ expense_category_id: '', planned_amount: '' }] });
    setErrors({});
  };

  const openEdit = (budget: any) => {
    setEditingId(budget.id);
    setForm({
      name: budget.name || '',
      department_id: String(typeof budget.department === 'object' ? budget.department?.id : budget.department_id || ''),
      fiscal_year: String(budget.fiscal_year || new Date().getFullYear()),
      total_amount: String(budget.total_amount || ''),
      items: (budget.items || []).length > 0 ? budget.items.map((i: any) => ({ expense_category_id: String(i.expense_category_id), planned_amount: String(i.planned_amount) })) : [{ expense_category_id: '', planned_amount: '' }],
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (i: number, field: string, value: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { expense_category_id: '', planned_amount: '' }] }));
  };

  const removeItem = (i: number) => {
    if (form.items.length === 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    if (!form.department_id) { setErrors({ department_id: 'Department is required' }); return; }
    if (!form.total_amount || Number(form.total_amount) <= 0) { setErrors({ total_amount: 'Valid total amount is required' }); return; }
    const payload = {
      name: form.name,
      department_id: Number(form.department_id),
      fiscal_year: form.fiscal_year,
      total_amount: Number(form.total_amount),
      items: form.items.filter(i => i.expense_category_id && i.planned_amount).map(i => ({ expense_category_id: Number(i.expense_category_id), planned_amount: Number(i.planned_amount) })),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = useMemo(() => {
    if (!budgets) return [];
    if (!departmentFilter) return budgets;
    return budgets.filter((b: any) => {
      const deptId = typeof b.department === 'object' ? b.department?.id : b.department_id;
      return String(deptId) === departmentFilter;
    });
  }, [budgets, departmentFilter]);

  const columns: Column<any>[] = [
    { key: 'name', label: 'Budget' },
    { key: 'department', label: 'Department', render: (b: any) => typeof b.department === 'object' ? b.department?.name : b.department_name || '-' },
    { key: 'total_amount', label: 'Planned', render: (b: any) => formatAmount(Number(b.total_amount) || 0) },
    { key: 'spent', label: 'Spent', render: (b: any) => formatAmount(Number(b.spent || b.actual || 0) || 0) },
    { key: 'remaining', label: 'Remaining', render: (b: any) => {
      const remaining = (Number(b.total_amount) || 0) - (Number(b.spent || b.actual || 0) || 0);
      return <span style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{formatAmount(remaining)}</span>;
    }},
    { key: 'status', label: 'Status', render: (b: any) => {
      if (b.status) return <span style={{ textTransform: 'capitalize' }}>{b.status}</span>;
      const spent = Number(b.spent || b.actual || 0) || 0;
      const total = Number(b.total_amount) || 1;
      const pct = (spent / total) * 100;
      return pct > 100 ? <span style={{ color: 'var(--danger)' }}>Over budget</span> : pct > 80 ? <span style={{ color: 'var(--warning)' }}>Nearly Exhausted</span> : <span style={{ color: 'var(--success)' }}>On Track</span>;
    }},
    {
      key: 'actions', label: '',
      render: (b: any) => (
        <div className="actions">
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this budget?')) deleteMutation.mutate(b.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Budgets"
      subtitle="Manage departmental budgets"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Budget
        </button>
      }
    >
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Department</label>
            <select className="form-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
              <option value="">All Departments</option>
              {(departmentsData || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {filtered.map((budget: any) => {
          const spent = Number(budget.spent || budget.actual || 0) || 0;
          const total = Number(budget.total_amount) || 1;
          const pct = Math.min((spent / total) * 100, 100);
          return (
            <div key={budget.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <PieChart size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{budget.name}</div>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {typeof budget.department === 'object' ? budget.department?.name : budget.department_name || '-'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span className="text-secondary">Planned: {formatAmount(total)}</span>
                <span style={{ fontWeight: 600 }}>Spent: {formatAmount(spent)}</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)', borderRadius: 8, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.8rem' }}>
                <span className="text-secondary">{pct.toFixed(0)}% used</span>
                <span style={{ fontWeight: 500, color: spent > total ? 'var(--danger)' : 'var(--success)' }}>
                  {formatAmount(total - spent)} remaining
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No budgets found" />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Budget' : 'New Budget'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Budget Name *</label>
                <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="e.g. Annual Feed Budget" />
                {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select name="department_id" className="form-select" value={form.department_id} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {(departmentsData || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department_id && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.department_id}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Fiscal Year</label>
                  <input name="fiscal_year" className="form-input" value={form.fiscal_year} onChange={handleChange} placeholder="e.g. 2025" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Amount *</label>
                  <input name="total_amount" className="form-input" value={form.total_amount} onChange={handleChange} type="number" step="0.01" placeholder="0.00" />
                  {errors.total_amount && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.total_amount}</p>}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Budget Items</label>
                  <button type="button" className="btn btn-sm" onClick={addItem}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <select className="form-select" value={item.expense_category_id} onChange={e => handleItemChange(i, 'expense_category_id', e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select Category</option>
                      {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="form-input" type="number" step="0.01" placeholder="Planned Amount" value={item.planned_amount} onChange={e => handleItemChange(i, 'planned_amount', e.target.value)} style={{ flex: 1 }} />
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? updateMutation.isPending ? 'Updating...' : 'Update Budget' : createMutation.isPending ? 'Creating...' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
