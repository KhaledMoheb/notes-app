import fs from "fs";
import path from "path";

const notesFilePath = path.join(process.cwd(), "notes.json");

// Ensure the 'notes.json' file exists before performing any operation
const ensureNotesFileExists = () => {
  if (!fs.existsSync(notesFilePath)) {
    fs.writeFileSync(notesFilePath, JSON.stringify([])); // Create an empty array if the file does not exist
  }
};

export default function handler(req, res) {
  ensureNotesFileExists(); // Ensure notes.json file exists

  // Handle GET request to fetch filtered notes
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
      console.error("Error reading notes:", error);
      res.status(500).json({ error: "Unable to read notes" });
    }
  }
  
  // Handle POST request to add a new note
  else if (req.method === "POST") {
    try {
      const newNote = req.body;

      // Check if the new note has an 'id' field; otherwise, generate one
      if (!newNote.id) {
        newNote.id = Date.now().toString(); // Generate a unique ID based on the current timestamp
      }

      const data = fs.readFileSync(notesFilePath, "utf-8");
      const notes = JSON.parse(data);

      // Add the new note to the notes array
      notes.push(newNote);

      // Write the updated notes array back to the file
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2), "utf-8");
      res.status(201).json({ message: "Note added successfully!" });
    } catch (error) {
      console.error("Error adding note:", error);
      res.status(500).json({ error: "Unable to add note" });
    }
  }

  // Handle PUT request to update an existing note
  else if (req.method === "PUT") {
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
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Unable to update note" });
    }
  }

  // Handle DELETE request to remove a note
  else if (req.method === "DELETE") {
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
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Unable to delete note" });
    }
  }

  // Handle any other unsupported request methods
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
