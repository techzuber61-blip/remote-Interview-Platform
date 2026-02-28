import { Inngest } from "inngest";
import { connectDB } from "./db";
import User from "../models/User.js";
import { ENV } from "./env.js";

export const inngest = new Inngest({ id: "interview-platform" });

const syncUser = inngest.createFunction(
    {id: "sync-user"},
    {event: "clerk/user.created"},
    async ({ event }) => {
        await connectDB();
        
        const {id, email_addresses, first_name, last_name, image_url} = event.data;

        const newUser = new User({
            name: `${first_name || ""} ${last_name || ""}`,
            email: email_addresses[0].email_address,
            profileImage: image_url,
            clerkId: id
        });

        await User.create(newUser);
        console.log("User created");
    }
);

const deleteUserFromDB = inngest.createFunction(
    {id: "delete-user-from-db"},
    {event: "clerk/user.deleted"},
    async ({ event }) => {
        await connectDB();
        
        const {id} = event.data;

        await User.deleteOne({clerkId: id});
        console.log("User deleted");
    }
);

export const functions = [syncUser, deleteUserFromDB];