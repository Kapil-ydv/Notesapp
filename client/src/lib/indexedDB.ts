import Dexie, { Table } from 'dexie';
import { LocalNote } from '@shared/schema';

export class NotesDB extends Dexie {
  notes!: Table<LocalNote>;

  constructor() {
    super('NotesDatabase');
    this.version(1).stores({
      notes: 'id, title, content, updatedAt, synced'
    });
  }
}

export const db = new NotesDB();

export class IndexedDBManager {
  async getAllNotes(): Promise<LocalNote[]> {
    return await db.notes.orderBy('updatedAt').reverse().toArray();
  }

  async getNote(id: string): Promise<LocalNote | undefined> {
    return await db.notes.get(id);
  }

  async createNote(note: LocalNote): Promise<void> {
    await db.notes.add(note);
  }

  async updateNote(id: string, updates: Partial<LocalNote>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  async getUnsyncedNotes(): Promise<LocalNote[]> {
    return await db.notes.where('synced').equals(false).toArray();
  }

  async markAsSynced(id: string): Promise<void> {
    await db.notes.update(id, { synced: true });
  }

  async markAsUnsynced(id: string): Promise<void> {
    await db.notes.update(id, { synced: false });
  }

  async searchNotes(query: string): Promise<LocalNote[]> {
    if (!query.trim()) {
      return this.getAllNotes();
    }

    const lowerQuery = query.toLowerCase();
    return await db.notes
      .filter(note => 
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
      )
      .reverse()
      .sortBy('updatedAt');
  }
}

export const indexedDBManager = new IndexedDBManager();
