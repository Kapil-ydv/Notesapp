import { apiRequest } from './queryClient';
import { indexedDBManager } from './indexedDB';
import { LocalNote } from '@shared/schema';

export type SyncStatus = 'synced' | 'unsynced' | 'syncing' | 'error';

export class SyncManager {
  private syncInProgress = false;
  private syncStatusCallbacks: ((status: Record<string, SyncStatus>) => void)[] = [];
  private syncStatuses: Record<string, SyncStatus> = {};

  onSyncStatusChange(callback: (status: Record<string, SyncStatus>) => void) {
    this.syncStatusCallbacks.push(callback);
    return () => {
      this.syncStatusCallbacks = this.syncStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySyncStatusChange() {
    this.syncStatusCallbacks.forEach(callback => callback(this.syncStatuses));
  }

  private setSyncStatus(noteId: string, status: SyncStatus) {
    this.syncStatuses[noteId] = status;
    this.notifySyncStatusChange();
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      // First, pull all notes from server to check for updates
      await this.pullFromServer();
      
      // Then, push local unsynced changes
      await this.pushToServer();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pullFromServer(): Promise<void> {
    try {
      const response = await apiRequest('GET', '/api/notes');
      const serverNotes: LocalNote[] = await response.json();

      for (const serverNote of serverNotes) {
        const localNote = await indexedDBManager.getNote(serverNote.id);
        
        if (!localNote) {
          // Note doesn't exist locally, add it
          await indexedDBManager.createNote({
            ...serverNote,
            synced: true
          });
          this.setSyncStatus(serverNote.id, 'synced');
        } else if (localNote.synced) {
          // Local note is synced, check if server version is newer
          const serverDate = new Date(serverNote.updatedAt);
          const localDate = new Date(localNote.updatedAt);
          
          if (serverDate > localDate) {
            // Server version is newer, update local
            await indexedDBManager.updateNote(serverNote.id, {
              ...serverNote,
              synced: true
            });
            this.setSyncStatus(serverNote.id, 'synced');
          }
        }
        // If local note is unsynced, we'll handle it in pushToServer
      }
    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }

  private async pushToServer(): Promise<void> {
    const unsyncedNotes = await indexedDBManager.getUnsyncedNotes();

    for (const note of unsyncedNotes) {
      this.setSyncStatus(note.id, 'syncing');
      
      try {
        // Check if note exists on server
        const existsOnServer = await this.noteExistsOnServer(note.id);
        
        if (existsOnServer) {
          // Update existing note
          await apiRequest('PUT', `/api/notes/${note.id}`, {
            id: note.id,
            title: note.title,
            content: note.content,
            updatedAt: note.updatedAt
          });
        } else {
          // Create new note
          await apiRequest('POST', '/api/notes', {
            id: note.id,
            title: note.title,
            content: note.content,
            updatedAt: note.updatedAt
          });
        }

        await indexedDBManager.markAsSynced(note.id);
        this.setSyncStatus(note.id, 'synced');
      } catch (error) {
        console.error(`Failed to sync note ${note.id}:`, error);
        this.setSyncStatus(note.id, 'error');
      }
    }
  }

  private async noteExistsOnServer(id: string): Promise<boolean> {
    try {
      await apiRequest('GET', `/api/notes/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async syncNote(noteId: string): Promise<void> {
    const note = await indexedDBManager.getNote(noteId);
    if (!note || note.synced) return;

    this.setSyncStatus(noteId, 'syncing');
    
    try {
      const existsOnServer = await this.noteExistsOnServer(noteId);
      
      if (existsOnServer) {
        await apiRequest('PUT', `/api/notes/${noteId}`, {
          id: note.id,
          title: note.title,
          content: note.content,
          updatedAt: note.updatedAt
        });
      } else {
        await apiRequest('POST', '/api/notes', {
          id: note.id,
          title: note.title,
          content: note.content,
          updatedAt: note.updatedAt
        });
      }

      await indexedDBManager.markAsSynced(noteId);
      this.setSyncStatus(noteId, 'synced');
    } catch (error) {
      console.error(`Failed to sync note ${noteId}:`, error);
      this.setSyncStatus(noteId, 'error');
    }
  }

  getSyncStatus(noteId: string): SyncStatus {
    return this.syncStatuses[noteId] || 'synced';
  }
}

export const syncManager = new SyncManager();
