import fs from 'fs';
import path from 'path';

const notesFilePath = path.join(process.cwd(), 'notes.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Read and return notes
    const data = fs.readFileSync(notesFilePath, 'utf-8');
    const notes = JSON.parse(data);
    res.status(200).json(notes);
  } else if (req.method === 'POST') {
    // Add a new note
    const newNote = req.body;
    const data = fs.readFileSync(notesFilePath, 'utf-8');
    const notes = JSON.parse(data);
    notes.push({ ...newNote, id: notes.length + 1 });
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
    res.status(201).json({ message: 'Note added successfully!' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
