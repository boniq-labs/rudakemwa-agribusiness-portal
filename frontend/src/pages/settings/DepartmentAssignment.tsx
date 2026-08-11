import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { departmentsAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Save, User, Building2 } from 'lucide-react';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  role_name: string;
}

interface Department {
  id: number;
  name: string;
}

export default function DepartmentAssignment() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'owner' || user?.role === 'farm_owner' || user?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | ''>('');
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      api.get('/users/employees').then(r => setEmployees(r.data.data || [])),
      departmentsAPI.getAll().then(r => setDepartments(r.data.data || [])),
    ]).catch(() => toast.error('Failed to load data'));
  }, [isAdmin]);

  const handleUserChange = async (userId: number) => {
    setSelectedUser(userId);
    try {
      const res = await api.get(`/users/${userId}/departments`);
      const depts: Department[] = res.data.data || [];
      setSelectedDepts(depts.map(d => d.id));
    } catch {
      setSelectedDepts([]);
    }
  };

  const toggleDept = (deptId: number) => {
    setSelectedDepts(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return toast.error('Select an employee');
    setSaving(true);
    try {
      await api.put(`/users/${selectedUser}/departments`, { department_ids: selectedDepts });
      toast.success('Departments assigned successfully');
    } catch {
      toast.error('Failed to assign departments');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page">
        <h2>Department Assignment</h2>
        <p className="text-secondary">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Department Assignment</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <User size={18} /> Select Employee
          </h3>
          <div className="form-group">
            <label>Employee</label>
            <select
              className="form-input"
              value={selectedUser}
              onChange={e => handleUserChange(Number(e.target.value))}
            >
              <option value="">Choose an employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.role_name})
                </option>
              ))}
            </select>
          </div>

          {selectedUser !== '' && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600 }}>
                {employees.find(e => e.id === selectedUser)?.first_name}{' '}
                {employees.find(e => e.id === selectedUser)?.last_name}
              </div>
              <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                Role: {employees.find(e => e.id === selectedUser)?.role_name}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Building2 size={18} /> Assign Departments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.map(dept => (
              <label
                key={dept.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedDepts.includes(dept.id) ? 'var(--primary-light)' : 'var(--bg)',
                  border: `1px solid ${selectedDepts.includes(dept.id) ? 'var(--primary)' : 'var(--border)'}`,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDepts.includes(dept.id)}
                  onChange={() => toggleDept(dept.id)}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: selectedDepts.includes(dept.id) ? 600 : 400 }}>{dept.name}</span>
              </label>
            ))}
          </div>

          {departments.length === 0 && (
            <p className="text-secondary">No departments available</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !selectedUser}
            style={{ marginTop: 20, width: '100%' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Assign Departments'}
          </button>
        </div>
      </div>
    </div>
  );
}
