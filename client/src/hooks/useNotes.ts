import { useState, useEffect, useCallback } from 'react';
import { LocalNote } from '@shared/schema';
import { notesRepository } from '@/lib/indexedDB';
import { syncManager, SyncStatus } from '@/lib/syncManager';
import { v4 as uuidv4 } from 'uuid';

export function useNotes() {
  const [notes, setNotes] = useState<LocalNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [loading, setLoading] = useState(true);

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  const loadNotes = useCallback(async () => {
    try {
      const loadedNotes = await notesRepository.findAll();
      setNotes(loadedNotes);
      
      if (!selectedNoteId && loadedNotes.length > 0) {
        setSelectedNoteId(loadedNotes[0].id);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedNoteId]);

  const searchNotes = useCallback(async (query: string) => {
    try {
      const searchResults = await notesRepository.search(query);
      setNotes(searchResults);
    } catch (error) {
      console.error('Failed to search notes:', error);
    }
  }, []);

  // Create new note
  const createNote = useCallback(async () => {
    const newNote: LocalNote = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      updatedAt: new Date().toISOString(),
      synced: false
    };

    try {
      await notesRepository.create(newNote);
      await loadNotes();
      setSelectedNoteId(newNote.id);
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }, [loadNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<LocalNote>) => {
    try {
      await notesRepository.update(id, {
        ...updates,
        synced: false
      });
      await loadNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }, [loadNotes]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesRepository.remove(id);
      await loadNotes();
      
      // Select another note if the deleted one was selected
      if (selectedNoteId === id) {
        const remainingNotes = notes.filter(note => note.id !== id);
        setSelectedNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }, [loadNotes, selectedNoteId, notes]);

  // Initialize and set up sync status monitoring
  useEffect(() => {
    loadNotes();
    
    const unsubscribe = syncManager.onSyncStatusChange(setSyncStatuses);
    return unsubscribe;
  }, [loadNotes]);

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      searchNotes(searchQuery);
    } else {
      loadNotes();
    }
  }, [searchQuery, searchNotes, loadNotes]);

  return {
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
    deleteNote,
    loadNotes
  };
}
