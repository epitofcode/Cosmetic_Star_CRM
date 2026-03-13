import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  Maximize2,
  Plus
} from 'lucide-react';
import { staffUploadPhoto, staffGetPhotos } from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Photo {
  id: string;
  image_url: string;
  stage: string;
  uploaded_at: string;
}

export default function ClinicalPhotos({ patientId }: { patientId: number | string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStage, setSelectedStage] = useState('Before');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patientId) fetchPhotos();
  }, [patientId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await staffGetPhotos(patientId);
      setPhotos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('stage', selectedStage);
      // Optional: link to a specific record if needed
      
      await staffUploadPhoto(patientId, formData);
      fetchPhotos();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Clinical Gallery</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Procedural Documentation Engine</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedStage} 
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
          >
            <option value="Before">Before (Pre-Op)</option>
            <option value="During">During (Intra-Op)</option>
            <option value="After">After (Post-Op)</option>
          </select>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
            Upload Photo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <ImageIcon className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No clinical images on file</p>
            </div>
          ) : photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
              <img src={photo.image_url} alt="Clinical" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <span className={cn(
                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                    photo.stage === 'Before' ? "bg-amber-500 text-white" : photo.stage === 'During' ? "bg-indigo-500 text-white" : "bg-teal-500 text-white"
                  )}>
                    {photo.stage}
                  </span>
                  <button className="p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
                <div className="flex justify-center">
                  <button className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-teal-500 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                    <Maximize2 size={20} />
                  </button>
                </div>
                <p className="text-[8px] text-white/60 font-medium text-center">{new Date(photo.uploaded_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
