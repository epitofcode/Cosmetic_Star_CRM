import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Type,
  AlignLeft,
  CheckSquare,
  PenTool,
  GripVertical,
  Trash2,
  Save,
  Plus,
  Settings2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type FieldType = 'Short Text' | 'Long Text' | 'Checkbox' | 'Signature Pad';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
}

// --- Draggable Sidebar Item ---
interface SidebarItemProps {
  type: FieldType;
  icon: React.ReactNode;
}

function SidebarItem({ type, icon }: SidebarItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `sidebar-${type}`,
    data: {
      type,
      isSidebarItem: true,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-teal-500 hover:shadow-md transition-all group",
        isDragging && "opacity-50 ring-2 ring-teal-500"
      )}
    >
      <div className="text-slate-400 group-hover:text-teal-600 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-700">{type}</span>
    </div>
  );
}

// --- Sortable Canvas Item ---
interface SortableFieldProps {
  field: FormField;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
}

function SortableField({ field, onRemove, onUpdate }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border border-slate-200 rounded-2xl p-6 relative group mb-4",
        isDragging && "opacity-50 z-50 shadow-2xl"
      )}
    >
      <div className="flex items-start gap-4">
        <div {...listeners} {...attributes} className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              {field.type}
            </span>
            <button
              onClick={() => onRemove(field.id)}
              className="text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              className="w-full text-lg font-bold text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-300 break-words"
              placeholder="Enter Field Question/Label..."
            />
            
            {field.type === 'Short Text' && (
              <div className="min-h-[3rem] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex items-center px-4 py-2 text-slate-300 text-sm">
                Short response text placeholder
              </div>
            )}
            
            {field.type === 'Long Text' && (
              <div className="min-h-[6rem] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex items-center px-4 py-3 text-slate-300 text-sm">
                Long response text placeholder
              </div>
            )}

            {field.type === 'Checkbox' && (
              <div className="flex items-center gap-2 text-slate-400 p-1">
                <div className="w-5 h-5 border-2 border-slate-200 rounded shrink-0" />
                <span className="text-sm italic break-words">User will check this box</span>
              </div>
            )}

            {field.type === 'Signature Pad' && (
              <div className="min-h-[8rem] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-slate-300 gap-2 text-center">
                <PenTool size={24} />
                <span className="text-xs font-bold uppercase tracking-widest text-balance">Digital Signature Area</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
              />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Field</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Builder ---
export default function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Handle dropping a sidebar item into the list
    const activeData = active.data.current as { isSidebarItem?: boolean; type?: string } | undefined;
    if (activeData?.isSidebarItem) {
      const type = activeData.type as FieldType;
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type,
        label: `New ${type}`,
        required: false,
      };

      // If dropped over a specific field, insert it there
      const overIndex = fields.findIndex(f => f.id === over.id);
      if (overIndex !== -1) {
        const newFields = [...fields];
        newFields.splice(overIndex, 0, newField);
        setFields(newFields);
      } else {
        setFields([...fields, newField]);
      }
      return;
    }

    // Handle reordering within the canvas
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const saveForm = () => {
    const schema = {
      version: '1.0',
      fields: fields.map(({ id, ...rest }) => rest), // Remove internal IDs for storage
      createdAt: new Date().toISOString(),
    };
    alert('Form Schema generated! Ready to save to Supabase.');
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Dynamic Form Builder</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Design clinical intakes & consent forms</p>
        </div>
        <button
          onClick={saveForm}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
        >
          <Save size={18} />
          Save Form Template
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar: Elements */}
          <div className="lg:col-span-3 space-y-6 sticky top-24">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <Plus size={14} className="text-teal-500" />
                Add Elements
              </h3>
              
              <SortableContext items={[]} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  <SidebarItem type="Short Text" icon={<Type size={20} />} />
                  <SidebarItem type="Long Text" icon={<AlignLeft size={20} />} />
                  <SidebarItem type="Checkbox" icon={<CheckSquare size={20} />} />
                  <SidebarItem type="Signature Pad" icon={<PenTool size={20} />} />
                </div>
              </SortableContext>

              <div className="mt-8 pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-400">
                  <Settings2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Builder Settings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-9">
            <div className="bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 p-8 min-h-[600px]">
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {fields.length > 0 ? (
                  fields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      onRemove={removeField}
                      onUpdate={updateField}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                    <div className="bg-white p-6 rounded-full text-slate-200 shadow-sm border border-slate-100">
                      <Plus size={48} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-400">Canvas is Empty</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Drag and drop elements here to start building your form</p>
                    </div>
                  </div>
                )}
              </SortableContext>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
