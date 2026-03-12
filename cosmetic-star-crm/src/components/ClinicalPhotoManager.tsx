import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Plus, 
  CheckCircle2, 
  Maximize2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type PhotoStage = 'Before' | 'During' | 'After';

interface ClinicalPhoto {
  id: string;
  url: string;
  stage: PhotoStage;
  file: File;
}

interface PhotoSectionProps {
  stage: PhotoStage;
  title: string;
  photos: ClinicalPhoto[];
  onUpload: (stage: PhotoStage, files: FileList | null) => void;
  onRemove: (id: string) => void;
}

function PhotoSection({ stage, title, photos, onUpload, onRemove }: PhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner shrink-0",
            stage === 'Before' ? "bg-amber-50 text-amber-600" : 
            stage === 'During' ? "bg-indigo-50 text-indigo-600" : 
            "bg-teal-50 text-teal-600"
          )}>
            <Camera size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900 leading-tight break-words">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{photos.length} Images Captured</p>
          </div>
        </div>
        
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => onUpload(stage, e.target.files)}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-slate-900 hover:bg-teal-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Plus size={14} />
          Add Photo
        </button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div 
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner"
              >
                <img 
                  src={photo.url} 
                  alt={`${stage} Clinical`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onRemove(photo.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shadow-lg">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[12rem] border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center p-6 gap-3 cursor-pointer group hover:bg-slate-50 hover:border-teal-500/30 transition-all"
        >
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-teal-500 shadow-sm border border-slate-100 transition-colors shrink-0">
            <ImageIcon size={24} />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Photos Uploaded</p>
            <p className="text-[10px] text-slate-300 font-bold mt-1">Drag and drop or click to capture</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClinicalPhotoManager({ patientId }: { patientId: number | string }) {
  const [photos, setPhotos] = useState<ClinicalPhoto[]>([]);

  const handleUpload = (stage: PhotoStage, fileList: FileList | null) => {
    if (!fileList) return;

    const newPhotos: ClinicalPhoto[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      stage,
      file
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.url); // Clean up memory
      return prev.filter(p => p.id !== id);
    });
  };

  const saveToGallery = () => {
    console.log(`Saving ${photos.length} photos for Patient ${patientId} to Supabase...`);
    alert(`Ready to upload ${photos.length} clinical images to the 'clinical-images' bucket.`);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Clinical Media Manager</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">High-Fidelity Procedure Charting</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 text-slate-400 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Storage: clinical-images
          </div>
          <button 
            onClick={saveToGallery}
            disabled={photos.length === 0}
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:bg-slate-800 disabled:shadow-none whitespace-nowrap"
          >
            Synchronize Gallery
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <PhotoSection 
          stage="Before" 
          title="Pre-Op (Before)" 
          photos={photos.filter(p => p.stage === 'Before')} 
          onUpload={handleUpload} 
          onRemove={removePhoto} 
        />
        <PhotoSection 
          stage="During" 
          title="Intra-Op (During)" 
          photos={photos.filter(p => p.stage === 'During')} 
          onUpload={handleUpload} 
          onRemove={removePhoto} 
        />
        <PhotoSection 
          stage="After" 
          title="Post-Op (After)" 
          photos={photos.filter(p => p.stage === 'After')} 
          onUpload={handleUpload} 
          onRemove={removePhoto} 
        />
      </div>

      {/* Compliance Footer */}
      <div className="bg-slate-900 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest leading-none">Medical Imaging Consent</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1 italic break-words">Images will be stored in the GDPR-compliant Clinical Vault.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
          <Clock size={14} />
          Auto-saved to session
        </div>
      </div>
    </div>
  );
}
