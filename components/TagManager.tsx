
import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import { XIcon, TrashIcon } from './Icons';
import { getText } from '../i18n';

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onClose: () => void;
}

const TAG_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-slate-100 text-slate-800 border-slate-200',
];

export const TagManager: React.FC<TagManagerProps> = ({ tags, onAddTag, onDeleteTag, onClose }) => {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0] ?? 'bg-gray-100 text-gray-800 border-gray-200');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    onAddTag({
      id: crypto.randomUUID(),
      name: newTagName.trim(),
      color: selectedColor
    });
    setNewTagName('');
  };

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 transition-opacity"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">{getText('manageTags')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Create New */}
          <form onSubmit={handleCreate} className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">{getText('createTag')}</label>
            <input 
              type="text" 
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder={getText('tagName')}
              className="w-full p-3 rounded-xl border border-stone-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
            <div className="flex flex-wrap gap-2.5">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color.split(' ')[0]} ${selectedColor === color ? 'ring-2 ring-offset-2 ring-stone-300 scale-110 border-white' : 'border-transparent'}`}
                />
              ))}
            </div>
            <button 
              type="submit" 
              disabled={!newTagName.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-none"
            >
              {getText('createTag')}
            </button>
          </form>

          {/* List */}
          <div className="space-y-2">
             {tags.length === 0 && <p className="text-center text-stone-400 text-sm italic py-4">{getText('noTags')}</p>}
             {tags.map(tag => (
               <div key={tag.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl group transition-colors border border-transparent hover:border-stone-100">
                 <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${tag.color}`}>
                   {tag.name}
                 </span>
                 <button onClick={() => onDeleteTag(tag.id)} className="text-stone-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                   <TrashIcon className="w-4 h-4" />
                 </button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
