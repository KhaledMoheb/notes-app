import mongoose from "mongoose";

// MongoDB connection setup
const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const connectMongoDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB is already connected.");
            return;
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(
            "mongodb+srv://kmo7eb:mQAe3mpfA50wHy4U@cluster0.x57sh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
            clientOptions
        );
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
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        await connectMongoDB();

        const { notes } = req.body; // Expect an array of notes
        if (!Array.isArray(notes)) {
            return res.status(400).json({ error: "Invalid request format. Expected an array of notes." });
        }

        const processedNotes = [];

        for (const noteData of notes) {
            const { id, title, description, userId, tagId, deleted, pinned, timestamp } = noteData;

            let processedNote;

            if (id) {
                // Find the existing note by ID
                const existingNote = await Note.findById(id);

                if (existingNote) {
                    // Only update if the incoming timestamp is greater
                    if (new Date(timestamp) > new Date(existingNote.timestamp)) {
                        processedNote = await Note.findByIdAndUpdate(
                            id,
                            { title, description, tagId, deleted, pinned, timestamp: new Date(timestamp) },
                            { new: true }
                        );
                    } else {
                        // Skip update if existing timestamp is newer
                        processedNote = existingNote;
                    }
                }
            }

            if (!processedNote) {
                // Create a new note if no valid ID or update condition not met
                const newNote = new Note({
                    title: title || "",
                    description: description || "",
                    userId,
                    tagId,
                    deleted: deleted || false,
                    pinned: pinned || false,
                    timestamp: new Date(timestamp) || new Date(),
                });

                processedNote = await newNote.save();
            }

            // Push the processed note with id formatted
            processedNotes.push({
                id: processedNote._id.toString(),
                title: processedNote.title,
                description: processedNote.description,
                userId: processedNote.userId,
                tagId: processedNote.tagId,
                deleted: processedNote.deleted,
                pinned: processedNote.pinned,
                timestamp: processedNote.timestamp,
            });
        }

        return res.status(200).json({ message: "Sync completed successfully!", notes: processedNotes });
    } catch (error) {
        console.error("Error handling sync:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
