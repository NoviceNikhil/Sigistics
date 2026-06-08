import React from 'react';
import { AlertCircle, X, RefreshCw, ChevronRight } from 'lucide-react';

export default function BulkConflictModal({ isOpen, onClose, conflicts, onConfirm, type = 'agents' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 sm:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                <AlertCircle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">Conflicts Detected</h2>
                <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">Data Match Found in System</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 mb-8 max-h-[350px] overflow-y-auto custom-scrollbar">
            <p className="text-sm font-medium text-gray-600 mb-4 px-2">
              The following {type} already exist in the database. Would you like to overwrite their existing information with the data from your file?
            </p>
            
            <div className="space-y-3">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">
                        {type === 'agents' ? conflict.email : conflict.code}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {type === 'agents' ? `${conflict.existingName} → ${conflict.newName}` : `${conflict.pickup} to ${conflict.delivery}`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancel Upload
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Overwrite & Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
