import { useState, useEffect } from "react";
import { 
  Button, TextField, Container, Typography, List, ListItem, 
  ListItemText, IconButton, Box, Dialog, DialogActions, 
  DialogContent, DialogTitle 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [userId, setUserId] = useState("");
  const [tagId, setTagId] = useState("");

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        console.error("Invalid data format:", data);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  // Add new note
  const addNote = async () => {
    if (!title.trim() || !content.trim()) {
      console.error("Title or content cannot be empty.");
      return;
    }

    const newNote = { title, description: content, userId, tagId };

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        setUserId("");
        setTitle("");
        setContent("");
        setTagId("");
        fetchNotes();
      } else {
        console.error("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // Delete note
  const deleteNote = async (id) => {
    try {
      const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (response.ok) {
        setNotes(notes.filter((note) => note._id !== id));
      } else {
        console.error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Open edit dialog
  const openEditDialog = (note) => {
    setEditingNote(note);
    setUserId(note.userId);
    setTitle(note.title);
    setContent(note.description);
    setTagId(note.tagId);
    setOpenDialog(true);
  };

  // Close dialog
  const closeDialog = () => {
    setEditingNote(null);
    setUserId("");
    setTitle("");
    setContent("");
    setOpenDialog(false);
  };

  // Update note
  const updateNote = async () => {
    if (!editingNote || !editingNote.id) {
      console.error("No note ID for updating.");
      return;
    }

    const updatedNote = { title, description: content, userId, tagId };

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        fetchNotes();
        closeDialog();
      } else {
        console.error("Failed to update note");
      }
    } catch (error) {
      console.error("Error updating note:", error);
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
        <Button 
          variant="contained" 
          color="primary" 
          onClick={addNote} 
          style={{ width: "100%" }}
          aria-label="Add Note"
        >
          Add Note
        </Button>
      </Box>

      <List>
        {notes.length > 0 ? (
          notes.map((note) => (
            <ListItem key={note._id} secondaryAction={
              <>
                <IconButton 
                  edge="end" 
                  aria-label="edit" 
                  onClick={() => openEditDialog(note)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => deleteNote(note._id)}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            }>
              <ListItemText primary={note.title} secondary={note.description} />
            </ListItem>
          ))
        ) : (
          <Typography>No notes available</Typography>
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
