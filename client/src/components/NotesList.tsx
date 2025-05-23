import { LocalNote } from '@shared/schema';
import { SyncStatus } from '@/lib/syncManager';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotesListProps {
  notes: LocalNote[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  syncStatuses: Record<string, SyncStatus>;
  onDeleteNote: (id: string) => void;
}

export function NotesList({ 
  notes, 
  selectedNoteId, 
  onSelectNote, 
  syncStatuses, 
  onDeleteNote 
}: NotesListProps) {
  const getSyncStatusDisplay = (status: SyncStatus) => {
    switch (status) {
      case 'synced':
        return { 
          dot: 'bg-green-500', 
          badge: 'bg-green-100 text-green-700', 
          text: 'Synced' 
        };
      case 'syncing':
        return { 
          dot: 'bg-yellow-500', 
          badge: 'bg-yellow-100 text-yellow-700', 
          text: 'Syncing' 
        };
      case 'unsynced':
        return { 
          dot: 'bg-gray-400', 
          badge: 'bg-gray-100 text-gray-700', 
          text: 'Unsynced' 
        };
      case 'error':
        return { 
          dot: 'bg-red-500', 
          badge: 'bg-red-100 text-red-700', 
          text: 'Error' 
        };
      default:
        return { 
          dot: 'bg-gray-400', 
          badge: 'bg-gray-100 text-gray-700', 
          text: 'Unknown' 
        };
    }
  };

  const getPreview = (content: string) => {
    // Remove markdown syntax for preview
    const cleaned = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();
    
    return cleaned.length > 100 ? cleaned.substring(0, 97) + '...' : cleaned;
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900">All Notes</h2>
          <span className="text-sm text-gray-500">{notes.length} notes</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No notes found.</p>
            <p className="text-sm mt-1">Create your first note to get started.</p>
          </div>
        ) : (
          notes.map((note) => {
            const syncStatus = getSyncStatusDisplay(syncStatuses[note.id] || 'synced');
            const isSelected = selectedNoteId === note.id;
            
            return (
              <div
                key={note.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectNote(note.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <div className={`w-2 h-2 rounded-full ${syncStatus.dot}`} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-1">
                          <MoreVertical className="w-3 h-3 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="text-red-600"
                        >
                          Delete Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {note.content && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {getPreview(note.content)}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${syncStatus.badge}`}>
                    {syncStatus.text}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
