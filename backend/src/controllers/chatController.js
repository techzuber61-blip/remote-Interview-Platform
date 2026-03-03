import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
    try {
        const token = await chatClient.createToken(req.user.clerkId.toString());
        res.status(200).json({ 
            token,
            userId: req.user.clerkId,
            userName: req.user.name,
            userImage: req.user.profileImage
         });
    } catch (error) {
        console.error('Error creating Stream token', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}