import { createClient } from "edgedb";
import e from "@dbschema/default.esdl";


const client = createClient();

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Fetch notes from the database with optional filtering
      const queryParams = req.query;

      // Build dynamic query using EdgeQL
      const query = e.select(e.Note, (note) => {
        // Dynamically filter based on query parameters
        const filters = Object.entries(queryParams).map(([key, value]) =>
          note[key].ilike(`%${value}%`)
        );
        return {
          filter: e.and(...filters),
          id: true,
          userId: true,
          title: true,
          description: true,
          tagId: true,
          deleted: true,
          pinned: true,
          timestamp: true,
        };
      });

      const notes = await query.run(client);
      return res.status(200).json(notes);
    } else if (req.method === "POST") {
      // Add a new note to the database
      const newNote = req.body;

      // Ensure required fields are present
      if (!newNote.title || !newNote.description || !newNote.userId || !newNote.tagId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await e
        .insert(e.Note, {
          title: newNote.title,
          description: newNote.description,
          userId: newNote.userId,
          tagId: newNote.tagId,
          deleted: newNote.deleted || false,
          pinned: newNote.pinned || false,
          timestamp: new Date(),
        })
        .run(client);

      return res.status(201).json({ message: "Note added successfully!", note: result });
    } else if (req.method === "PUT") {
      // Update an existing note
      const { id } = req.query;
      const updatedNote = req.body;

      if (!id) {
        return res.status(400).json({ error: "Note ID is required" });
      }

      const existingNote = await e.select(e.Note, { filter_single: { id }, id: true }).run(client);

      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      const updated = await e
        .update(e.Note, {
          filter: { id },
          set: {
            title: updatedNote.title ?? undefined,
            description: updatedNote.description ?? undefined,
            userId: updatedNote.userId ?? undefined,
            tagId: updatedNote.tagId ?? undefined,
            deleted: updatedNote.deleted ?? undefined,
            pinned: updatedNote.pinned ?? undefined,
          },
        })
        .run(client);

      return res.status(200).json({ message: "Note updated successfully!", note: updated });
    } else if (req.method === "DELETE") {
      // Delete a note from the database
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Note ID is required" });
      }

      const deleted = await e
        .delete(e.Note, { filter: { id } })
        .run(client);

      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ message: "Note deleted successfully!" });
    } else {
      // Method not allowed
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
