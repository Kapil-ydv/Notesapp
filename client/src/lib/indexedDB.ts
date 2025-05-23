import Dexie, { Table } from 'dexie';
import { LocalNote } from '@shared/schema';

class NotesDatabase extends Dexie {
  notes!: Table<LocalNote>;

  constructor() {
    super('NotesApp');
    this.version(1).stores({
      notes: 'id, title, content, updatedAt'
    });
  }
}

const database = new NotesDatabase();

class NotesRepository {
  private db = database;

  async findAll(): Promise<LocalNote[]> {
    try {
      return await this.db.notes.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async findById(id: string): Promise<LocalNote | undefined> {
    try {
      return await this.db.notes.get(id);
    } catch (error) {
      console.error('Error fetching note:', error);
      return undefined;
    }
  }

  async create(note: LocalNote): Promise<void> {
    try {
      await this.db.notes.add(note);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async update(id: string, changes: Partial<LocalNote>): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await this.db.notes.update(id, {
        ...changes,
        updatedAt: timestamp
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.db.notes.delete(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  async findUnsynced(): Promise<LocalNote[]> {
    try {
      const allNotes = await this.db.notes.toArray();
      return allNotes.filter(note => !note.synced);
    } catch (error) {
      console.error('Error fetching unsynced notes:', error);
      return [];
    }
  }

  async markSynced(id: string): Promise<void> {
    try {
      await this.db.notes.update(id, { synced: true });
    } catch (error) {
      console.error('Error marking note as synced:', error);
    }
  }

  async markUnsynced(id: string): Promise<void> {
    try {
      await this.db.notes.update(id, { synced: false });
    } catch (error) {
      console.error('Error marking note as unsynced:', error);
    }
  }

  async search(query: string): Promise<LocalNote[]> {
    if (!query?.trim()) {
      return this.findAll();
    }

    try {
      const searchTerm = query.toLowerCase();
      const allNotes = await this.db.notes.toArray();
      
      const matchingNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
      );

      return matchingNotes.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }
}

export const notesRepository = new NotesRepository();
