import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalAPI, breedingAPI, healthAPI, movementAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Calendar, Activity, Info, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolveAssetUrl } from '../../utils/assetUrl';

type Tab = 'health' | 'breeding' | 'weight' | 'history';

export default function AnimalProfile() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('health');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotoMutation = useMutation({
    mutationFn: (photo: string) => animalAPI.update(Number(id), { photo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animal', id] });
      toast.success('Photo updated');
      setPreviewPhoto(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update photo');
      setPreviewPhoto(null);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!previewPhoto) return;
    setUploading(true);
    updatePhotoMutation.mutate(previewPhoto, {
      onSettled: () => setUploading(false),
    });
  };

  const handleCancelPreview = () => {
    setPreviewPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { data: animalData, isLoading } = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => (await animalAPI.getById(Number(id))).data.data,
    enabled: !!id,
  });

  const { data: vaccinationsData } = useQuery({
    queryKey: ['vaccinations', id],
    queryFn: async () => (await healthAPI.getVaccinations({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: diseasesData } = useQuery({
    queryKey: ['diseases', id],
    queryFn: async () => (await healthAPI.getDiseases({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', id],
    queryFn: async () => (await healthAPI.getTreatments({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: breedingData } = useQuery({
    queryKey: ['breeding', id],
    queryFn: async () => (await breedingAPI.getAll({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: weightsData } = useQuery({
    queryKey: ['weights', id],
    queryFn: async () => (await movementAPI.getWeights({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: birthsData } = useQuery({
    queryKey: ['births-animal', id],
    queryFn: async () => (await breedingAPI.getBirths({ animal_id: id })).data.data || [],
    enabled: !!id,
  });

  const animal = animalData;
  const vaccinations = Array.isArray(vaccinationsData) ? vaccinationsData : [];
  const diseases = Array.isArray(diseasesData) ? diseasesData : [];
  const treatments = Array.isArray(treatmentsData) ? treatmentsData : [];
  const breedingRecords = Array.isArray(breedingData) ? breedingData : [];
  const weights = Array.isArray(weightsData) ? weightsData : [];
  const births = Array.isArray(birthsData) ? birthsData : [];

  const calcAge = (dob: string) => {
    if (!dob) return '-';
    const diff = Date.now() - new Date(dob).getTime();
    const years = Math.floor(diff / 31557600000);
    const months = Math.floor((diff % 31557600000) / 2592000000);
    return years > 0 ? `${years}y ${months}m` : `${months}m`;
  };

  const breedingColumns: Column<any>[] = [
    { key: 'mate', label: 'Mate', render: (item: any) => item.male_animal_name || item.father_name || '-' },
    { key: 'date', label: 'Date', render: (item: any) => item.breeding_date || item.date ? new Date(item.breeding_date || item.date).toLocaleDateString() : '-' },
    { key: 'method', label: 'Method', render: (item: any) => item.method || item.breeding_method || '-' },
    { key: 'result', label: 'Result', render: (item: any) => <StatusBadge status={item.result || item.status || 'pending'} /> },
  ];

  const weightHistory = weights.map((w: any) => ({
    date: w.date ? new Date(w.date).toLocaleDateString() : '',
    weight: w.weight,
  }));

  const timelineEvents = [
    ...vaccinations.map((v: any) => ({ type: 'Vaccination', date: v.vaccination_date || v.date, desc: v.vaccine_name })),
    ...diseases.map((d: any) => ({ type: 'Disease', date: d.date, desc: d.disease_name })),
    ...treatments.map((t: any) => ({ type: 'Treatment', date: t.date || t.created_at, desc: t.medicine })),
    ...breedingRecords.map((b: any) => ({ type: 'Breeding', date: b.breeding_date, desc: `${b.method || ''}` })),
    ...births.map((b: any) => ({ type: 'Birth', date: b.birth_date, desc: `Offspring born` })),
    ...weights.map((w: any) => ({ type: 'Weight', date: w.date, desc: `${w.weight}kg` })),
  ].filter(e => e.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) return <ModulePage title="Animal Profile"><div className="loading-screen"><div className="loading-spinner" /></div></ModulePage>;
  if (!animal) return <ModulePage title="Animal Profile"><p className="text-secondary">Animal not found</p></ModulePage>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'health', label: 'Health' },
    { key: 'breeding', label: 'Breeding' },
    { key: 'weight', label: 'Weight' },
    { key: 'history', label: 'History' },
  ];

  return (
    <ModulePage title={`${animal.tag_number} - ${animal.name || 'Unnamed'}`} subtitle="Animal profile and records">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120, borderRadius: '50%', background: 'var(--primary-light)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              {previewPhoto ? (
                <img src={previewPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : animal.photo ? (
                <img src={resolveAssetUrl(animal.photo)} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={40} color="var(--primary)" />
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', padding: '4px 0', textAlign: 'center' }}>Change</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
            {previewPhoto && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <button className="btn btn-sm btn-primary" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Save Photo'}</button>
                <button className="btn btn-sm btn-secondary" onClick={handleCancelPreview}><X size={14} /> Cancel</button>
              </div>
            )}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{animal.name || 'Unnamed'}</h2>
            <p className="text-secondary" style={{ marginBottom: 8 }}>{animal.tag_number}</p>
            <StatusBadge status={animal.status || 'active'} />
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><Info size={16} /> Basic Info</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><span className="text-secondary">Breed:</span> {animal.breed_name || '-'}</div>
                <div><span className="text-secondary">Category:</span> {animal.category_name || '-'}</div>
                <div><span className="text-secondary">Gender:</span> {animal.gender || '-'}</div>
                <div><span className="text-secondary">Color:</span> {animal.color || '-'}</div>
                <div><span className="text-secondary">Age:</span> {calcAge(animal.date_of_birth)}</div>
                <div><span className="text-secondary">Weight:</span> {animal.weight ? `${animal.weight} kg` : '-'}</div>
                <div><span className="text-secondary">Height:</span> {animal.height ? `${animal.height} cm` : '-'}</div>
                <div><span className="text-secondary">Feed Type:</span> {animal.feed_type || '-'}</div>
                <div><span className="text-secondary">Status:</span> {animal.animal_status || animal.status || '-'}</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><Calendar size={16} /> Ownership</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><span className="text-secondary">Source:</span> {animal.source || '-'}</div>
                <div><span className="text-secondary">Purchase Price:</span> {animal.purchase_price ? `$${animal.purchase_price}` : '-'}</div>
                <div><span className="text-secondary">Location:</span> {animal.location || '-'}</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><Activity size={16} /> Dairy</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><span className="text-secondary">Dairy:</span> {animal.is_dairy ? 'Yes' : 'No'}</div>
                {animal.is_dairy && (
                  <>
                    <div><span className="text-secondary">Lactation #:</span> {animal.lactation_number || '-'}</div>
                    <div><span className="text-secondary">Milk Status:</span> {animal.milk_status || '-'}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: activeTab === t.key ? 600 : 400,
                    color: activeTab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
                    borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'health' && (
              <div>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>Vaccinations</h4>
                <DataTable columns={[
                  { key: 'vaccine_name', label: 'Vaccine' },
                  { key: 'date', label: 'Date', render: (item: any) => item.vaccination_date ? new Date(item.vaccination_date).toLocaleDateString() : '-' },
                  { key: 'next_due', label: 'Next Due', render: (item: any) => item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : '-' },
                  { key: 'batch_no', label: 'Batch' },
                ]} data={vaccinations} emptyMessage="No vaccinations" />

                <h4 style={{ margin: '16px 0 12px', fontSize: '0.9rem', fontWeight: 600 }}>Diseases</h4>
                <DataTable columns={[
                  { key: 'disease_name', label: 'Disease' },
                  { key: 'symptoms', label: 'Symptoms' },
                  { key: 'severity', label: 'Severity' },
                  { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
                ]} data={diseases} emptyMessage="No diseases" />

                <h4 style={{ margin: '16px 0 12px', fontSize: '0.9rem', fontWeight: 600 }}>Treatments</h4>
                <DataTable columns={[
                  { key: 'medicine', label: 'Medicine' },
                  { key: 'dosage', label: 'Dosage' },
                  { key: 'veterinarian', label: 'Vet' },
                  { key: 'cost', label: 'Cost', render: (item: any) => item.cost ? `$${item.cost}` : '-' },
                ]} data={treatments} emptyMessage="No treatments" />
              </div>
            )}

            {activeTab === 'breeding' && (
              <div>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>Breeding Records</h4>
                <DataTable columns={breedingColumns} data={breedingRecords} emptyMessage="No breeding records" />
                <h4 style={{ margin: '16px 0 12px', fontSize: '0.9rem', fontWeight: 600 }}>Births</h4>
                <DataTable columns={[
                  { key: 'offspring', label: 'Offspring', render: (item: any) => item.animal_name || item.tag_number || '-' },
                  { key: 'birth_date', label: 'Date', render: (item: any) => item.birth_date ? new Date(item.birth_date).toLocaleDateString() : '-' },
                  { key: 'gender', label: 'Gender' },
                  { key: 'weight', label: 'Weight', render: (item: any) => item.weight ? `${item.weight}kg` : '-' },
                ]} data={births} emptyMessage="No births" />
              </div>
            )}

            {activeTab === 'weight' && (
              <div>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>Weight Over Time</h4>
                {weightHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weightHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-secondary">No weight records</p>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h4 style={{ marginBottom: 12, fontSize: '0.9rem', fontWeight: 600 }}>Activity Timeline</h4>
                {timelineEvents.length === 0 ? (
                  <p className="text-secondary">No events recorded</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {timelineEvents.map((evt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, minWidth: 100 }}>{evt.type}</div>
                        <div style={{ color: 'var(--text-secondary)', minWidth: 100 }}>{evt.date ? new Date(evt.date).toLocaleDateString() : '-'}</div>
                        <div>{evt.desc || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
