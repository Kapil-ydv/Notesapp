import { useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { syncManager } from '@/lib/syncManager';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Wifi, WifiOff, Check, Clock, AlertCircle } from 'lucide-react';

export function NotesApp() {
  const {
    notes,
    selectedNote,
    selectedNoteId,
    setSelectedNoteId,
    searchQuery,
    setSearchQuery,
    syncStatuses,
    loading,
    createNote,
    updateNote,
    deleteNote
  } = useNotes();
  
  const isOnline = useOnlineStatus();

  // Periodic sync when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      syncManager.syncAll();
    }, 30000); // Sync every 30 seconds when online

    return () => clearInterval(interval);
  }, [isOnline]);

  // Calculate sync summary
  const unsyncedCount = Object.values(syncStatuses).filter(status => status === 'unsynced').length;
  const syncingCount = Object.values(syncStatuses).filter(status => status === 'syncing').length;
  const errorCount = Object.values(syncStatuses).filter(status => status === 'error').length;

  const getSyncSummary = () => {
    if (syncingCount > 0) return { icon: Clock, text: 'Syncing...', color: 'text-yellow-600' };
    if (errorCount > 0) return { icon: AlertCircle, text: `${errorCount} sync errors`, color: 'text-red-600' };
    if (unsyncedCount > 0) return { icon: Clock, text: `${unsyncedCount} unsynced`, color: 'text-yellow-600' };
    return { icon: Check, text: 'All synced', color: 'text-green-600' };
  };

  const syncSummary = getSyncSummary();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Notes</h1>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className={`flex items-center space-x-1 text-xs ${syncSummary.color}`}>
              <syncSummary.icon className="w-3 h-3" />
              <span>{syncSummary.text}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          <Button onClick={createNote} className="bg-[#1976D2] hover:bg-[#1565C0]">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <NotesList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          syncStatuses={syncStatuses}
          onDeleteNote={deleteNote}
        />
        
        <NoteEditor
          note={selectedNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          syncStatus={selectedNote ? syncStatuses[selectedNote.id] || 'synced' : 'synced'}
        />
      </div>
    </div>
  );
}
