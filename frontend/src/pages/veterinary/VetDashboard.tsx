import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { HeartPulse, Syringe, Stethoscope, Activity } from 'lucide-react';

export default function VetDashboard() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['vet-dashboard'],
    queryFn: () => client.get('/veterinary/dashboard').then(r => r.data.data),
  });

  const d = (dashboard as any) || { openHealthRecords: 0, vaccinationsDue: 0, treatmentsPending: 0 };

  return (
    <ModulePage
      title="Veterinary Dashboard"
      subtitle="Overview of animal health and veterinary operations"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/veterinary/health-records')}>
            <Activity size={16} /> New Health Record
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/veterinary/vaccinations')}>
            <Syringe size={16} /> Record Vaccination
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/veterinary/treatments')}>
            <Stethoscope size={16} /> New Treatment
          </button>
        </div>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Open Health Records" value={d.openHealthRecords} icon={HeartPulse} color="#2563eb" />
        <StatsCard title="Vaccinations Due" value={d.vaccinationsDue} icon={Syringe} color="#d97706" />
        <StatsCard title="Treatments Pending" value={d.treatmentsPending} icon={Stethoscope} color="#8b5cf6" />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/veterinary/health-records')}>
            <HeartPulse size={16} /> Manage Health Records
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/veterinary/vaccinations')}>
            <Syringe size={16} /> Manage Vaccinations
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/veterinary/treatments')}>
            <Stethoscope size={16} /> Manage Treatments
          </button>
        </div>
      </div>
    </ModulePage>
  );
}
