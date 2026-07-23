import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '../../api';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function ShiftManagement() {
  const qc = useQueryClient();

  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['shift-employees'],
    queryFn: () => shiftsApi.getEmployees().then((r) => r.data.data || []),
  });

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftsApi.list().then((r) => r.data.data || []),
  });

  const [form, setForm] = useState({
    employee_id: '', shift_name: 'Morning Shift', start_time: '06:00', end_time: '14:00', working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as string[],
  });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => shiftsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); setShowForm(false); setForm({ employee_id: '', shift_name: 'Morning Shift', start_time: '06:00', end_time: '14:00', working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }); toast.success('Shift assigned'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to assign shift'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts'] }); toast.success('Shift removed'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete shift'),
  });

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) { toast.error('Select an employee'); return; }
    if (form.working_days.length === 0) { toast.error('Select at least one working day'); return; }
    createMutation.mutate(form);
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2><Clock size={20} /> Shift Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Assign Shift'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card mb-4" onSubmit={handleSubmit}>
          <h3>Assign Shift</h3>
          <div className="form-group">
            <label>Employee</label>
            {empLoading ? <p>Loading employees...</p> : (
              <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Select employee</option>
                {employees?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.role_name})</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Shift Name</label>
              <select value={form.shift_name} onChange={(e) => setForm({ ...form, shift_name: e.target.value })}>
                <option value="Morning Shift">Morning Shift</option>
                <option value="Afternoon Shift">Afternoon Shift</option>
                <option value="Night Shift">Night Shift</option>
                <option value="General Shift">General Shift</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <select value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>End Time</label>
              <select value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Working Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map((day) => (
                <label key={day} className={`option-btn ${form.working_days.includes(day) ? 'active' : ''}`} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={form.working_days.includes(day)} onChange={() => toggleDay(day)} style={{ display: 'none' }} />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
            <Save size={16} /> {createMutation.isPending ? 'Saving...' : 'Save Shift'}
          </button>
        </form>
      )}

      <div className="card">
        <h3>Assigned Shifts</h3>
        {shiftsLoading ? <p>Loading...</p> : shifts?.length === 0 ? (
          <p className="text-muted">No shifts assigned yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Shift</th>
                <th>Time</th>
                <th>Working Days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts?.map((s: any) => {
                let days: string[] = [];
                try { days = typeof s.working_days === 'string' ? JSON.parse(s.working_days) : s.working_days || []; } catch { days = []; }
                return (
                  <tr key={s.id}>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.shift_name}</td>
                    <td>{formatTime(s.start_time)} - {formatTime(s.end_time)}</td>
                    <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {DAYS.map((d) => (
                        <span key={d} className={`badge ${days.some((wd: string) => wd.toLowerCase() === d.toLowerCase()) ? 'badge-info' : 'badge-outline'}`}>
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Remove this shift?')) deleteMutation.mutate(s.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
