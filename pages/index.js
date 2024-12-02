import { useState, useEffect } from "react";
import { Button, TextField, Container, Typography, List, ListItem, ListItemText, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

export default function Home() {
  const [notes, setNotes] = useState([]); // Initialize as an empty array
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch all notes on initial load
  useEffect(() => {
    fetchNotes();
  }, []);

  // Fetch notes from the API
  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setNotes(data); // Ensure it's an array before setting the state
      } else {
        console.error("Fetched data is not an array:", data); // Handle non-array response
      }
    } catch (error) {
      console.error("Error fetching notes:", error); // Catch any errors during fetch
    }
  };

  // Add a new note
  const addNote = async () => {
    const newNote = { title, content };
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNote),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      setTitle("");
      setContent("");
      fetchNotes();
    }
  };

  // Delete a note
  const deleteNote = async (id) => {
    const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (response.ok) {
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  // Open the edit dialog
  const openEditDialog = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setOpenDialog(true);
  };

  // Close the dialog
  const closeDialog = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setOpenDialog(false);
  };

  // Update the note
  const updateNote = async () => {
    const updatedNote = { title, content };
    const response = await fetch(`/api/notes/${editingNote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedNote),
    });

    if (response.ok) {
      fetchNotes();
      closeDialog();
    }
  };

  return (
    <Container maxWidth="md" style={{ paddingTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Notes
      </Typography>

      <Box marginBottom="20px">
        <TextField
          fullWidth
          label="Title"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <TextField
          fullWidth
          label="Content"
          variant="outlined"
          multiline
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ marginBottom: "20px" }}
        />
        <Button variant="contained" color="primary" onClick={addNote} style={{ width: "100%" }}>
          Add Note
        </Button>
      </Box>

      <List>
        {Array.isArray(notes) && notes.length > 0 ? (
          notes.map((note) => (
            <ListItem key={note.id} secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => openEditDialog(note)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => deleteNote(note.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }>
              <ListItemText primary={note.title} secondary={note.content} />
            </ListItem>
          ))
        ) : (
          <Typography>No notes available</Typography> // Handle empty notes
        )}
      </List>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={closeDialog}>
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <TextField
            fullWidth
            label="Content"
            variant="outlined"
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={updateNote} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
