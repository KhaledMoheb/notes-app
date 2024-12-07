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

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


const sendPushNotification = async (userId, title, message) => {
    try {
        console.log("sendPushNotification", userId);
        const devicesSnapshot = await firestore.collection(`users/${userId}/devices`).get();
        const deviceTokens = devicesSnapshot.docs.map((doc) => doc.data().deviceId);
        console.log("devicesSnapshot", devicesSnapshot);

        if (deviceTokens.length === 0) {
            console.log("No device tokens found for user.");
            return;
        }

        const messagePayload = {
            notification: {
                title,
                body: message,
            },
            tokens: deviceTokens,
        };

        await messaging.sendEachForMulticast(messagePayload);
        console.log("Push notification sent!");
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};

export default async function handler(req, res) {
    console.log("Handler invoked. Request method:", req.method);

    if (req.method !== "POST") {
        console.log("Invalid method:", req.method);
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        console.log("Connecting to MongoDB...");
        await connectMongoDB();

        const { notes } = req.body; // Expect an array of notes
        console.log("Received request body:", JSON.stringify(req.body, null, 2));

        if (!Array.isArray(notes)) {
            console.error("Invalid request format. Expected an array of notes.");
            return res.status(400).json({ error: "Invalid request format. Expected an array of notes." });
        }

        const processedNotes = [];
        console.log(`Processing ${notes.length} notes...`);

        const usersIds = new Set();

        for (const noteData of notes) {
            const { id, title, description, userId, tagId, deleted, pinned, timestamp } = noteData;
            if (!usersIds.has(userId)) {
                usersIds.add(userId);
            }

            console.log("Processing note:", JSON.stringify(noteData, null, 2));

            let processedNote;

            if (id) {
                if (isValidObjectId(id)) {
                    console.log(`ID ${id} is a valid ObjectId. Checking for existing note...`);
                    const existingNote = await Note.findById(id);

                    if (existingNote) {
                        console.log(`Found existing note with ID ${id}:`, JSON.stringify(existingNote, null, 2));

                        if (new Date(timestamp) > new Date(existingNote.timestamp)) {
                            console.log("Incoming timestamp is newer. Updating note...");
                            processedNote = await Note.findByIdAndUpdate(
                                id,
                                { title, description, tagId, deleted, pinned, timestamp: new Date(timestamp) },
                                { new: true }
                            );
                            console.log("Note updated:", JSON.stringify(processedNote, null, 2));
                        } else {
                            console.log("Existing note has a newer timestamp. Skipping update.");
                            processedNote = existingNote;
                        }
                    } else {
                        console.log(`No note found with ID ${id}. Creating a new note...`);
                    }
                } else {
                    console.warn(`ID ${id} is not a valid ObjectId. Creating a new note instead.`);
                }
            }

            if (!processedNote) {
                console.log("Creating a new note...");
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
                console.log("New note created:", JSON.stringify(processedNote, null, 2));
            }

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

        usersIds.forEach(async (userId) => {
            await sendPushNotification(userId, "Notes Synced", `You synced ${notes.length} notes`);
        });

        console.log("All notes processed successfully.");
        return res.status(200).json({ message: "Sync completed successfully!", notes: processedNotes });
    } catch (error) {
        console.error("Error handling sync:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
