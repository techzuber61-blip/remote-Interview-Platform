import {StreamChat} from 'stream-chat';
import {StreamClient} from "@stream-io/node-sdk"
import { ENV } from './env.js';

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
    console.error('Missing Stream API key or secret');
}

export const streamClient = new StreamClient(apiKey, apiSecret);
export const chatClient = new StreamChat(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await chatClient.upsertUser(userData);
        console.log('Stream user upserted successfully');
        // return userData;
    } catch (error) {
        console.error('Error Upserting Stream user', error);
    }
}

export const deleteStreamUser = async (userId) => {
    try {
        await chatClient.deleteUser(userId);
        console.log('Stream user deleted successfully');
    } catch (error) {
        console.error('Error deleting Stream user', error);
    }
}

