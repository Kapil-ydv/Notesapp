import { notes, type Note, type InsertNote, type UpdateNote } from "@shared/schema";

export interface IStorage {
  getAllNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<UpdateNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private notes: Map<string, Note>;

  constructor() {
    this.notes = new Map();
  }

  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const note: Note = {
      ...insertNote,
      content: insertNote.content || "",
      updatedAt: new Date(),
      synced: true,
    };
    this.notes.set(note.id, note);
    return note;
  }

  async updateNote(id: string, updateData: Partial<UpdateNote>): Promise<Note | undefined> {
    const existingNote = this.notes.get(id);
    if (!existingNote) {
      return undefined;
    }

    const updatedNote: Note = {
      ...existingNote,
      ...updateData,
      updatedAt: new Date(),
      synced: true,
    };

    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }
}

export const storage = new MemStorage();
