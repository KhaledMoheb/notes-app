import fs from 'fs';
import path from 'path';

const notesFilePath = path.join(process.cwd(), 'notes.json');

export default function handler(req, res) {
  const { id } = req.query;
  const data = fs.readFileSync(notesFilePath, 'utf-8');
  const notes = JSON.parse(data);

  if (req.method === 'GET') {
    // Get a single note
    const note = notes.find((note) => note.id === parseInt(id));
    if (note) {
      res.status(200).json(note);
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } else if (req.method === 'PUT') {
    // Update a note
    const updatedNote = req.body;
    const noteIndex = notes.findIndex((note) => note.id === parseInt(id));
    if (noteIndex !== -1) {
      notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
      res.status(200).json({ message: 'Note updated successfully!' });
    } else {
      res.status(404).json({ message: 'Note not found' });
    }
  } else if (req.method === 'DELETE') {
    // Delete a note
    const filteredNotes = notes.filter((note) => note.id !== parseInt(id));
    fs.writeFileSync(notesFilePath, JSON.stringify(filteredNotes, null, 2));
    res.status(200).json({ message: 'Note deleted successfully!' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
