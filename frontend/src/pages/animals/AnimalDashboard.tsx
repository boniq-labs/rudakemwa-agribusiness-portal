import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { animalAPI, breedingAPI, healthAPI, movementAPI } from '../../api/endpoints';
import { dashboardAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import {
  PawPrint, Cat, HeartPulse, Syringe, Baby, Activity,
  Plus, Skull, Users,
} from 'lucide-react';
import DepartmentHeader from '../../components/DepartmentHeader';

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899'];

export default function AnimalDashboard() {
  const navigate = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ['animal-dashboard-stats'],
    queryFn: async () => (await dashboardAPI.getAnimals()).data?.data || {},
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals-all'],
    queryFn: async () => (await animalAPI.getAll({ limit: 10000 })).data.data || [],
  });

  const { data: birthsData } = useQuery({
    queryKey: ['births'],
    queryFn: async () => (await breedingAPI.getBirths()).data.data || [],
  });

  const { data: vaccinationsData } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: async () => (await healthAPI.getVaccinations()).data.data || [],
  });

  const { data: weightsData } = useQuery({
    queryKey: ['weights'],
    queryFn: async () => (await movementAPI.getWeights()).data.data || [],
  });

  const { data: deathsData } = useQuery({
    queryKey: ['deaths'],
    queryFn: async () => (await movementAPI.getDeaths()).data.data || [],
  });

  const stats: any = statsData || {};
  const animals = Array.isArray(animalsData) ? animalsData : [];
  const births = Array.isArray(birthsData) ? birthsData : [];
  const vaccinations = Array.isArray(vaccinationsData) ? vaccinationsData : [];
  const weights = Array.isArray(weightsData) ? weightsData : [];
  const deaths = Array.isArray(deathsData) ? deathsData : [];

  const totalAnimals = stats.totalAnimals ?? 0;
  const totalCattle = stats.totalCattle ?? 0;
  const totalPigs = stats.totalPigs ?? 0;
  const pregnant = stats.pregnantAnimals ?? 0;
  const sick = stats.sickAnimals ?? 0;
  const vaccDue = stats.vaccinationsDue ?? vaccinations.filter((v: any) => v.next_due_date && new Date(v.next_due_date) <= new Date()).length;
  const totalBirths = stats.totalBirths ?? births.length;
  const totalDeaths = stats.totalDeaths ?? deaths.length;

  const categoryMap: Record<string, number> = {};
  animals.forEach((a: any) => {
    const cat = a.category_name || a.animal_category_name || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const monthlyBirths: Record<string, number> = {};
  births.forEach((b: any) => {
    const d = new Date(b.birth_date || b.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBirths[key] = (monthlyBirths[key] || 0) + 1;
  });
  const barData = Object.entries(monthlyBirths).sort().slice(-6).map(([name, value]) => ({ name, value }));

  const weightData = weights.slice(-20).map((w: any) => ({
    date: w.date ? new Date(w.date).toLocaleDateString() : '',
    weight: w.weight,
  }));

  const recentEvents = [
    ...births.slice(-5).map((b: any) => ({ type: 'birth', date: b.birth_date, text: `Birth: ${b.animal_name || 'Calf'}`, id: b.id })),
    ...deaths.slice(-5).map((d: any) => ({ type: 'death', date: d.date, text: `Death: ${d.animal_name || 'Animal'}`, id: d.id })),
    ...animals.filter((a: any) => a.source === 'purchased').slice(-5).map((a: any) => ({ type: 'purchase', date: a.created_at, text: `Purchased: ${a.tag_number}`, id: a.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const quickActions = (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-primary" onClick={() => navigate('/animals/registration')}>
        <Plus size={16} /> Register Animal
      </button>
      <button className="btn btn-secondary" onClick={() => navigate('/animals/births')}>
        <Baby size={16} /> Record Birth
      </button>
      <button className="btn btn-danger" onClick={() => navigate('/animals/deaths')}>
        <Skull size={16} /> Record Death
      </button>
      <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={() => navigate('/animals/pigs')}>
        <Users size={16} /> Pigs
      </button>
      <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={() => navigate('/animals/cattle')}>
        <Cat size={16} /> Cattle
      </button>
    </div>
  );

  return (
    <ModulePage title="Animal Production Dashboard" subtitle="Overview of your livestock operations" actions={quickActions}>
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Animals" value={totalAnimals} icon={PawPrint} color="#2563eb" />
        <StatsCard title="Cattle" value={totalCattle} icon={Cat} color="#16a34a" />
        <StatsCard title="Pigs" value={totalPigs} icon={Users} color="#d97706" />
        <StatsCard title="Pregnant" value={pregnant} icon={HeartPulse} color="#ec4899" />
        <StatsCard title="Sick" value={sick} icon={Activity} color="#dc2626" />
        <StatsCard title="Vaccinations Due" value={vaccDue} icon={Syringe} color="#8b5cf6" />
        <StatsCard title="Total Births" value={totalBirths} icon={Baby} color="#f59e0b" />
        <StatsCard title="Total Deaths" value={totalDeaths} icon={Skull} color="#6b7280" />
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card chart-card">
          <h3>Animals by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Monthly Births</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card chart-card">
          <h3>Weight Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Recent Activity</h3>
          {recentEvents.length === 0 ? (
            <p className="text-secondary">No recent activity</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentEvents.map((evt, i) => (
                <div key={i} className="notif-item" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  {evt.type === 'birth' && <Baby size={16} color="#16a34a" />}
                  {evt.type === 'death' && <Skull size={16} color="#dc2626" />}
                  {evt.type === 'purchase' && <Users size={16} color="#2563eb" />}
                  <div>
                    <div style={{ fontSize: '0.85rem' }}>{evt.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {evt.date ? new Date(evt.date).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}