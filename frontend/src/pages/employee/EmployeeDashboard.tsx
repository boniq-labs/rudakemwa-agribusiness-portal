import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import { activitiesAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  Clock, LogIn, LogOut, Bell, User, CalendarDays, Briefcase, Building2, Shield,
  CheckCircle2, Send, AlertCircle, Phone, Mail, Loader2
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [taskDesc, setTaskDesc] = useState('');
  const [issueDesc, setIssueDesc] = useState('');

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => client.get('/users/me').then(r => r.data.data || r.data),
  });

  const { data: todayAtt, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => client.get('/attendance/today').then(r => r.data.data || r.data),
  });

  const { data: activities, isLoading: actsLoading } = useQuery({
    queryKey: ['my-activities'],
    queryFn: () => activitiesAPI.getMy().then(r => r.data.data || r.data || []),
  });

  const { data: notifsData, isLoading: notifLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => client.get('/notifications').then(r => r.data.data || r.data || []),
  });

  const checkInMutation = useMutation({
    mutationFn: () => client.post('/attendance/checkin', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success('Checked in successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to check in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => client.post('/attendance/checkout', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success('Checked out successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to check out'),
  });

  const saveActivityMutation = useMutation({
    mutationFn: (data: any) => activitiesAPI.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-activities'] });
      setTaskDesc('');
      setIssueDesc('');
      toast.success('Daily activity saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to save activity'),
  });

  const p = profileData || {};
  const notifs = Array.isArray(notifsData) ? notifsData : [];
  const activityList = Array.isArray(activities) ? activities : [];

  const firstName = p.firstName || p.first_name || user?.firstName || '';
  const lastName = p.lastName || p.last_name || user?.lastName || '';
  const dept = p.departmentName || p.department_name || p.department || user?.departmentName || '';
  const position = p.position || '';
  const role = p.role || user?.role || '';
  const email = p.email || user?.email || '';
  const phone = p.phone || '';
  const photo = p.photo || user?.photo || '';

  const initial = firstName?.[0] || lastName?.[0] || user?.firstName?.[0] || 'E';

  const isLoading = profileLoading || attLoading || notifLoading;

  const checkInTime = todayAtt?.check_in ? new Date(todayAtt.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const checkOutTime = todayAtt?.check_out ? new Date(todayAtt.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const attDate = todayAtt?.date ? new Date(todayAtt.date + 'T00:00:00').toLocaleDateString() : new Date().toLocaleDateString();
  const isCheckedIn = !!checkInTime;
  const isCheckedOut = !!checkOutTime;
  const canCheckIn = !isCheckedIn && !isCheckedOut;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  const greenGradient = 'linear-gradient(135deg, #059669, #10b981)';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white flex items-center gap-5 flex-wrap"
        style={{ background: greenGradient }}
      >
        {photo ? (
          <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/30">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl sm:text-2xl font-bold">{firstName} {lastName}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-white/80">
            {dept && <span className="flex items-center gap-1.5"><Building2 size={14} /> {dept}</span>}
            {position && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {position}</span>}
            {role && <span className="flex items-center gap-1.5"><Shield size={14} /> {role}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div className="card p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Clock size={18} className="text-green-600" /> Today's Attendance
          </h3>

          <div className="text-center py-2">
            <div className="text-sm text-gray-500 mb-1">
              <CalendarDays size={14} className="inline mr-1" />{attDate}
            </div>

            {/* Status */}
            <div className="mb-4">
              {canCheckIn && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={12} /> Not Checked In
                </div>
              )}
              {isCheckedIn && !isCheckedOut && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <LogIn size={12} /> Checked In
                </div>
              )}
              {isCheckedOut && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 size={12} /> Completed
                </div>
              )}
            </div>

            {/* Times */}
            {isCheckedIn && (
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <div><span className="font-medium text-gray-700">In:</span> {checkInTime}</div>
                {isCheckedOut && <div><span className="font-medium text-gray-700">Out:</span> {checkOutTime}</div>}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              {canCheckIn && (
                <button
                  className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  {checkInMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                  Check In
                </button>
              )}
              {canCheckOut && (
                <button
                  className="btn inline-flex items-center gap-2 px-6 py-2.5"
                  style={{ background: '#dc2626', color: '#fff', borderRadius: 'var(--radius)' }}
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                  Check Out
                </button>
              )}
              {isCheckedOut && (
                <p className="text-sm text-gray-400">Today's work completed</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="card p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
            <User size={18} className="text-green-600" /> Profile
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{firstName} {lastName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Department</span>
              <span className="font-medium text-gray-800">{dept || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Position</span>
              <span className="font-medium text-gray-800">{position || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-800">{phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-800">{role || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Bell size={18} className="text-green-600" /> Notifications
          </h3>
          <div className="space-y-0">
            {notifs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
            ) : (
              notifs.slice(0, 6).map((n: any) => (
                <div key={n.id} className="py-2.5 border-b border-gray-50 last:border-0">
                  <div className="text-sm text-gray-700">{n.title || n.message || n.subject}</div>
                  {n.created_at && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Daily Work Activity Form (only when checked in) */}
      {isCheckedIn && !isCheckedOut && (
        <div className="card p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Send size={18} className="text-green-600" /> Daily Work Activity
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Completed</label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-0 transition-all duration-200 resize-none"
                rows={3}
                placeholder="Describe the work you did today..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue / Challenge</label>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-0 transition-all duration-200 resize-none"
                rows={2}
                placeholder="Report any issues encountered..."
              />
            </div>
            <div className="flex justify-end">
              <button
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                onClick={() => saveActivityMutation.mutate({ task_description: taskDesc, issue_description: issueDesc })}
                disabled={saveActivityMutation.isPending || !taskDesc.trim()}
              >
                {saveActivityMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Save Daily Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {activityList.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
            <Clock size={18} className="text-green-600" /> Recent Activities
          </h3>
          <div className="space-y-0">
            {activityList.slice(0, 8).map((a: any) => (
              <div key={a.id} className="py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.task_description || 'No description'}</p>
                    {a.issue_description && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <AlertCircle size={11} />
                        <span>{a.issue_description}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {a.date ? new Date(a.date + 'T00:00:00').toLocaleDateString() : ''}
                      {a.created_at ? ' ' + new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
