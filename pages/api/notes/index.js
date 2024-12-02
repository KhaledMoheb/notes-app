import mongoose from "mongoose";

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

// MongoDB connection setup
const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) return; // Already connected
  await mongoose.connect(process.env.MONGO_URI, clientOptions); // Make sure to set your MongoDB URI in .env
};

// Define Note model
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: String, required: true },
  tagId: { type: Number, required: true },
  deleted: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

export default async function handler(req, res) {
  try {
    await connectMongoDB(); // Ensure MongoDB is connected

    if (req.method === "GET") {
      const queryParams = req.query;
      let filters = {};

      // Build dynamic filters based on query parameters
      if (queryParams.title) filters.title = { $regex: queryParams.title, $options: "i" }; // Case-insensitive regex
      if (queryParams.description) filters.description = { $regex: queryParams.description, $options: "i" };
      if (queryParams.userId) filters.userId = queryParams.userId;
      if (queryParams.tagId) filters.tagId = queryParams.tagId;
      if (queryParams.deleted) filters.deleted = queryParams.deleted === "true"; // Convert string to boolean
      if (queryParams.pinned) filters.pinned = queryParams.pinned === "true";

      // Query MongoDB with filters
      const notes = await Note.find(filters);

      return res.status(200).json(notes);
    } else if (req.method === "POST") {
      // Add a new note to the database
      const newNote = req.body;

      if (!newNote.title || !newNote.description || !newNote.userId || !newNote.tagId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const note = new Note({
        title: newNote.title,
        description: newNote.description,
        userId: newNote.userId,
        tagId: newNote.tagId,
        deleted: newNote.deleted || false,
        pinned: newNote.pinned || false,
      });

      const result = await note.save();

      return res.status(201).json({ message: "Note added successfully!", note: result });
    } else if (req.method === "PUT") {
      // Update an existing note
      const { id } = req.query;
      const updatedNote = req.body;

      if (!id) {
        return res.status(400).json({ error: "Note ID is required" });
      }

      const existingNote = await Note.findById(id);

      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Update fields based on what was passed
      const updated = await Note.findByIdAndUpdate(
        id,
        {
          $set: {
            title: updatedNote.title ?? existingNote.title,
            description: updatedNote.description ?? existingNote.description,
            userId: updatedNote.userId ?? existingNote.userId,
            tagId: updatedNote.tagId ?? existingNote.tagId,
            deleted: updatedNote.deleted ?? existingNote.deleted,
            pinned: updatedNote.pinned ?? existingNote.pinned,
          },
        },
        { new: true } // Return the updated document
      );

      return res.status(200).json({ message: "Note updated successfully!", note: updated });
    } else if (req.method === "DELETE") {
      // Delete a note from the database
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Note ID is required" });
      }

      const deleted = await Note.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ message: "Note deleted successfully!" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
