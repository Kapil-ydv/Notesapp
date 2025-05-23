import { apiRequest } from './queryClient';
import { notesRepository } from './indexedDB';
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
        const localNote = await notesRepository.findById(serverNote.id);
        
        if (!localNote) {
          await notesRepository.create({
            ...serverNote,
            synced: true
          });
          this.setSyncStatus(serverNote.id, 'synced');
        } else if (localNote.synced) {
          const serverDate = new Date(serverNote.updatedAt);
          const localDate = new Date(localNote.updatedAt);
          
          if (serverDate > localDate) {
            await notesRepository.update(serverNote.id, {
              ...serverNote,
              synced: true
            });
            this.setSyncStatus(serverNote.id, 'synced');
          }
        }
      }
    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }

  private async pushToServer(): Promise<void> {
    const unsyncedNotes = await notesRepository.findUnsynced();

    for (const note of unsyncedNotes) {
      this.setSyncStatus(note.id, 'syncing');
      
      try {
        const existsOnServer = await this.noteExistsOnServer(note.id);
        
        if (existsOnServer) {
          await apiRequest('PUT', `/api/notes/${note.id}`, {
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

        await notesRepository.markSynced(note.id);
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
    const note = await notesRepository.findById(noteId);
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

      await notesRepository.markSynced(noteId);
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
