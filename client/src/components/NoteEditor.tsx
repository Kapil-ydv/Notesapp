import { useCallback, useEffect, useState } from 'react';
import { LocalNote } from '@shared/schema';
import { SyncStatus } from '@/lib/syncManager';
import { MarkdownEditor } from './MarkdownEditor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Trash2, Clock, Save, Check, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface NoteEditorProps {
  note: LocalNote | undefined;
  onUpdateNote: (id: string, updates: Partial<LocalNote>) => void;
  onDeleteNote: (id: string) => void;
  syncStatus: SyncStatus;
}



export function NoteEditor({ note, onUpdateNote, onDeleteNote, syncStatus }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounce the values to avoid excessive updates
  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note?.id]); // Only update when note ID changes

  // Handle debounced updates
  useEffect(() => {
    if (note && (debouncedTitle !== note.title || debouncedContent !== note.content)) {
      onUpdateNote(note.id, {
        title: debouncedTitle,
        content: debouncedContent
      });
      setLastSaved(new Date());
    }
  }, [debouncedTitle, debouncedContent, note, onUpdateNote]);

  const handleDelete = useCallback(() => {
    if (note && window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(note.id);
    }
  }, [note, onDeleteNote]);

  const getSyncStatusDisplay = (status: SyncStatus) => {
    switch (status) {
      case 'synced':
        return { icon: Check, text: 'Synced', color: 'text-green-600' };
      case 'syncing':
        return { icon: Clock, text: 'Syncing...', color: 'text-yellow-600' };
      case 'unsynced':
        return { icon: Clock, text: 'Unsynced', color: 'text-gray-600' };
      case 'error':
        return { icon: AlertCircle, text: 'Sync Error', color: 'text-red-600' };
      default:
        return { icon: Clock, text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const syncStatusDisplay = getSyncStatusDisplay(syncStatus);

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (!note) {
    return (
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a note to start editing</p>
          <p className="text-sm mt-1">or create a new one</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-white">
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 flex-1 shadow-none"
            placeholder="Untitled Note"
          />
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Last edited {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-1 ${syncStatusDisplay.color}`}>
            <syncStatusDisplay.icon className="w-4 h-4" />
            <span className="font-medium">{syncStatusDisplay.text}</span>
          </div>
          
          {lastSaved && (
            <div className="flex items-center space-x-1 text-gray-500">
              <Save className="w-4 h-4" />
              <span>Auto-saved</span>
            </div>
          )}
          
          <div className="text-gray-500">
            <span>{getWordCount(content)} words</span>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        <MarkdownEditor
          content={content}
          onChange={setContent}
          isPreviewMode={isPreviewMode}
        />
      </div>
    </main>
  );
}
