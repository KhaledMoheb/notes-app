import { firestore, messaging } from "../../../lib/firebaseAdmin"; // Import Firebase Admin SDK

const sendPushNotification = async (userId, title, message) => {
    try {
        // Fetch devices for the user
        const devicesSnapshot = await firestore.collection(`users/${userId}/devices`).get();
        const deviceTokens = devicesSnapshot.docs.map(doc => doc.data().deviceId);

        if (deviceTokens.length === 0) {
            console.log("No device tokens found for user.");
            return;
        }

        // Send push notification to all devices
        const messagePayload = {
            notification: {
                title,
                body: message,
            },
            tokens: deviceTokens,
        };

        // Send the notification to all registered devices
        await messaging.sendMulticast(messagePayload);
        console.log("Push notification sent!");
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};

export default async function handler(req, res) {
    const { id } = req.query; // Get note id from the request

    if (req.method === "PUT") {
        const { userId, title, description } = req.body;

        try {
            // Update note logic
            const noteRef = firestore.collection("notes").doc(id);
            await noteRef.update({
                title,
                description,
                updatedAt: new Date(),
            });

            // Send a push notification to the user's devices
            await sendPushNotification(userId, "Note Updated", "Your note has been updated.");

            return res.status(200).json({ message: "Note updated successfully" });
        } catch (error) {
            console.error("Error updating note:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
}
