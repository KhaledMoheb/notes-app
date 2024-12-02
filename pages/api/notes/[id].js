import mongoose from "mongoose";
import { firestore, messaging } from "../../../lib/firebaseAdmin";

const connectMongoDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("MongoDB is already connected.");
            return; // Already connected
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect("mongodb+srv://kmo7eb:mQAe3mpfA50wHy4U@cluster0.x57sh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
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
    const { id } = req.query;

    try {
        await connectMongoDB();

        if (req.method === "PUT") {
            const { userId, title, description, tagId, pinned } = req.body;

            const updatedNote = await Note.findByIdAndUpdate(
                id,
                { title, description, tagId, pinned, updatedAt: new Date() },
                { new: true }
            );

            if (!updatedNote) {
                return res.status(404).json({ error: "Note not found" });
            }

            await sendPushNotification(userId, "Note Updated", "Your note has been updated.");
            return res.status(200).json({ message: "Note updated successfully", note: updatedNote });
        }

        if (req.method === "DELETE") {
            const note = await Note.findById(id);

            if (!note) {
                return res.status(404).json({ error: "Note not found" });
            }

            const updatedNote = await Note.findByIdAndUpdate(
                id,
                {
                    title: "",
                    description: "",
                    deleted: true,
                    timestamp: new Date(), // Keep a timestamp for when the deletion occurred
                },
                { new: true } // Return the updated document
            );

            await sendPushNotification(userId, "Note Deleted", "A note has been deleted.");
            return res.status(200).json({ message: "Note deleted successfully" });
        }

        return res.status(405).json({ error: "Method Not Allowed" });
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
