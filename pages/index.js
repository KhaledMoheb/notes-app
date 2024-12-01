import { useState, useEffect } from "react";

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Fetch notes
  useEffect(() => {
    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => setNotes(data));
  }, []);

  const addNote = async () => {
    const newNote = { title, content };
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      setTitle('');
      setContent('');
      fetch('/api/notes')
        .then((res) => res.json())
        .then((data) => setNotes(data));
    }
  };

  const deleteNote = async (id) => {
    const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Notes</h1>
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={addNote}>Add Note</button>
      </div>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <button onClick={() => deleteNote(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
