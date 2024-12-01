const fs = require("fs");
const path = require("path");

const notesFilePath = path.join(process.cwd(), "notes.json");

export default function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = fs.readFileSync(notesFilePath, "utf-8");
      const notes = JSON.parse(data);

      const queryParams = req.query;

      // Filter notes based on all query parameters dynamically
      const filteredNotes = notes.filter((note) => {
        return Object.entries(queryParams).every(([key, value]) => {
          if (note[key]) {
            return note[key].toString().toLowerCase().includes(value.toLowerCase());
          }
          return false;
        });
      });

      res.status(200).json(filteredNotes);
    } catch (error) {
      res.status(500).json({ error: "Unable to read notes" });
    }
  } else if (req.method === "POST") {
    try {
      const newNote = req.body;

      const data = fs.readFileSync(notesFilePath, "utf-8");
      const notes = JSON.parse(data);

      // Add the new note to the notes array
      notes.push(newNote);

      // Write updated notes to the file
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), "utf-8");
      res.status(201).json({ message: "Note added successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Unable to add note" });
    }
  } else if (req.method === "PUT") {
    try {
      const { id } = req.query;
      const updatedNote = req.body;

      const data = fs.readFileSync(notesFilePath, "utf-8");
      let notes = JSON.parse(data);

      // Find the note by id
      const noteIndex = notes.findIndex((note) => note.id == id);

      if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Update the note
      notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };

      // Write the updated notes array back to the file
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), "utf-8");
      res.status(200).json({ message: "Note updated successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Unable to update note" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      const data = fs.readFileSync(notesFilePath, "utf-8");
      let notes = JSON.parse(data);

      // Find the note by id
      const noteIndex = notes.findIndex((note) => note.id == id);

      if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Remove the note from the array
      notes.splice(noteIndex, 1);

      // Write the updated notes array back to the file
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), "utf-8");
      res.status(200).json({ message: "Note deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "Unable to delete note" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
