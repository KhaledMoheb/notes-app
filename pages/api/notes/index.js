import mongoose from "mongoose";

// MongoDB connection setup
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB is already connected.");
      return; // Already connected
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect("mongodb+srv://kmo7eb:mQAe3mpfA50wHy4U@cluster0.x57sh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", clientOptions);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("MongoDB connection failed");
  }
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

    console.log(`Handling ${req.method} request`);

    if (req.method === "GET") {
      const queryParams = req.query;
      let filters = {};

      // Ensure userId is provided
      if (!queryParams.userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Add userId filter
      filters.userId = queryParams.userId;

      // Add timestamp filter if provided
      if (queryParams.timestamp) {
        const delta = new Date(queryParams.timestamp);
        if (isNaN(delta.getTime())) {
          return res.status(400).json({ error: "Invalid timestamp" });
        }
        filters.timestamp = { $gt: delta }; // Only notes with a timestamp greater than delta
      }

      // Add additional filters (optional)
      if (queryParams.title) filters.title = { $regex: queryParams.title, $options: "i" }; // Case-insensitive regex
      if (queryParams.description) filters.description = { $regex: queryParams.description, $options: "i" };
      if (queryParams.tagId) filters.tagId = queryParams.tagId;
      if (queryParams.deleted) filters.deleted = queryParams.deleted === "true"; // Convert string to boolean
      if (queryParams.pinned) filters.pinned = queryParams.pinned === "true";

      console.log("Query filters:", filters);

      try {
        // Query MongoDB with filters and use lean() to return plain JavaScript objects
        const notes = await Note.find(filters).lean();

        // Map the notes to rename _id to id
        const notesWithId = notes.map(note => ({
          id: note._id.toString(), // Convert ObjectId to string
          title: note.title,
          description: note.description,
          userId: note.userId,
          tagId: note.tagId,
          deleted: note.deleted,
          pinned: note.pinned,
          timestamp: note.timestamp,
        }));

        console.log("Fetched notes:", notesWithId.length);
        return res.status(200).json(notesWithId);
      } catch (error) {
        console.error("Error fetching notes:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    } else if (req.method === "POST") {
      // Add a new note to the database
      const newNote = req.body;

      console.log("Creating new note:", newNote);

      if (!newNote.title || !newNote.description || !newNote.userId || !newNote.tagId) {
        console.log("Error: Missing required fields in the request");
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
      console.log("Note added:", result);

      // Return the note with the id field instead of _id
      return res.status(201).json({
        message: "Note added successfully!",
        note: {
          id: result._id.toString(), // Convert ObjectId to string
          title: result.title,
          description: result.description,
          userId: result.userId,
          tagId: result.tagId,
          deleted: result.deleted,
          pinned: result.pinned,
          timestamp: result.timestamp,
        },
      });
    } else if (req.method === "DELETE") {
      // Delete a note from the database
      const { id } = req.query;

      console.log("Deleting note with ID:", id);

      if (!id) {
        console.log("Error: Note ID is required for deletion");
        return res.status(400).json({ error: "Note ID is required" });
      }

      const updatedNote = await Note.findByIdAndUpdate(
        id,
        {
          title: "",
          description: "",
          tagId: null,
          userId: null,
          pinned: false,
          deleted: true,
          updatedAt: new Date(), // Keep a timestamp for when the deletion occurred
        },
        { new: true } // Return the updated document
      );

      console.log("Note deleted successfully");
      return res.status(200).json({ message: "Note deleted successfully!" });
    } else {
      console.log("Error: Method not allowed");
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
