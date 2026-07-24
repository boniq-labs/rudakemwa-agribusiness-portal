import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activitiesAPI, departmentsAPI } from '../../api/endpoints';
import { Search, CalendarDays, CheckCircle2, AlertCircle, User, Building2 } from 'lucide-react';

export default function EmployeeActivitiesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['hr-activities', deptFilter, dateFrom, dateTo],
    queryFn: () => activitiesAPI.getAll({
      department_id: deptFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }).then(r => r.data.data || r.data || []),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data || r.data || []),
  });

  const activities = Array.isArray(activitiesData) ? activitiesData : [];
  const departments = Array.isArray(deptsData) ? deptsData : [];

  const filtered = activities.filter((a: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.employee_name || '').toLowerCase().includes(q) ||
           (a.task_description || '').toLowerCase().includes(q) ||
           (a.department_name || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Activities</h1>
          <p className="text-sm text-gray-500 mt-1">View daily work reports and activities</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name..."
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-green-500 focus:ring-0 transition-colors"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 text-sm bg-white px-3 focus:outline-none focus:border-green-500"
          >
            <option value="">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 text-sm bg-white px-3 focus:outline-none focus:border-green-500"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 text-sm bg-white px-3 focus:outline-none focus:border-green-500"
            placeholder="To"
          />
        </div>
      </div>

      {/* Activities List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No activities found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((a: any) => (
              <div key={a.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1.5">
                      <span className="font-semibold text-gray-900 text-sm">{a.employee_name}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2 size={12} /> {a.department_name || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarDays size={12} /> {a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700">{a.task_description || 'No task description'}</span>
                    </div>
                    {a.issue_description && (
                      <div className="flex items-start gap-2 mt-1.5">
                        <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-amber-700">{a.issue_description}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1.5">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
