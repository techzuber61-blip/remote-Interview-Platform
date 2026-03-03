import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
    try {
        const {problem, difficulty} = req.body;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        if(!problem || !difficulty) {
            return res.status(400).json({error: "Problem and difficulty are required"});

            // generate a unique callId for stream video
            const callId = `session_${Date.now()}_${Math.random().toString(35).substring(7)}`;

            const session = await Session.create({problem, difficulty, host: userId, callId});
            
            await streamClient.video.call("default", callId).getOrCreate({
                data: {
                    created_by_id: clerkId,
                    custom: {problem, difficulty, sessionId: session._id.toString()}
                }
            })

            const channel = await chatClient.channel("messaging", callId, {
                name: `${problem} Session`,
                created_by_id: clerkId,
                members: [clerkId]
            }).create();
            res.status(201).json({session});
        }
    } catch (error) {
        console.error("Error in createSession controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export async function getActiveSessions(_, res) {
    try {
        const sessions = await Session.find({status: "active"})
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId")
        .sort({createdAt: -1})
        .limit(20);

        res.status(200).json({sessions});
    } catch (error) {
        console.error("Error in getActiveSessions controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export async function getMyRecentSessions(req, res) {
    try {
        // get sessions where user is either host or participant
        const userId = req.user._id;
        const sessions = await Session.find({
            status: "completed",
            $or: [{host: userId}, {participant: userId}]
        })
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId")
        .sort({createdAt: -1})
        .limit(20);

        res.status(200).json({sessions});
    } catch (error) {
        console.error("Error in getMyRecentSessions controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export async function getSessionById(req, res) {
    try {
        const sessionId = req.params.id;
        const session = await Session.findById(sessionId)
        .populate("host", "name profileImage email clerkId")
        .populate("participant", "name profileImage email clerkId");

        if(!session) {
            return res.status(404).json({error: "Session not found"});
        }

        res.status(200).json({session});
    } catch (error) {
        console.error("Error in getSessionById controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export async function joinSession(req, res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        const session = await Session.findById(id);
        if(!session) {
            return res.status(404).json({error: "Session not found"});
        }

        if(session.status === "completed") {
            return res.status(400).json({error: "Session already completed"});
        }

        if(session.participant) {
            return res.status(400).json({error: "Session is full"});
        }

        session.participant = userId;
        await session.save();

        const channel = chatClient.channel("messaging", session.callId)
        await channel.addMembers([clerkId]);

        res.status(200).json({session});
    } catch (error) {
        console.error("Error in joinSession controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export async function endSession(req, res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;

        const session = await Session.findById(id);
        if(!session) {
            return res.status(404).json({error: "Session not found"});
        }

        // check if user is host
        if(session.host.toString() !== userId.toString()) {
            return res.status(403).json({error: "You are not authorized to end this session"});
        }

        if(session.status === "completed") {
            return res.status(400).json({error: "Session already completed"});
        }

        session.status = "completed";

        // end stream video
        await streamClient.video.call("default", session.callId).delete({hard: true});

        // end stream chat
        await chatClient.channel("messaging", session.callId).delete();

        await session.save();

        res.status(200).json({session});
    } catch (error) {
        console.error("Error in endSession controller", error);
        res.status(500).json({error: "Internal Server Error"});
    }
}