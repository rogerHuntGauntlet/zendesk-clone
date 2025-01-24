import React from 'react';

interface QuickActionsProps {
  onExport: () => void;
  onBulkArchive: () => void;
  onBulkUpdateStatus: (status: string) => void;
  selectedCount: number;
  isLoading: boolean;
}

export default function QuickActions({
  onExport,
  onBulkArchive,
  onBulkUpdateStatus,
  selectedCount,
  isLoading
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex-1">
        <h3 className="text-white font-medium">
          {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
        </h3>
      </div>
      
      <div className="flex gap-3">
        <select
          onChange={(e) => onBulkUpdateStatus(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedCount === 0 || isLoading}
        >
          <option value="">Update Status</option>
          <option value="active">Set Active</option>
          <option value="completed">Set Completed</option>
          <option value="on-hold">Set On Hold</option>
        </select>

        <button
          onClick={onBulkArchive}
          disabled={selectedCount === 0 || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          {isLoading ? 'Processing...' : 'Archive'}
        </button>

        <button
          onClick={onExport}
          disabled={selectedCount === 0 || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {isLoading ? 'Processing...' : 'Export'}
        </button>
      </div>
    </div>
  );
} 