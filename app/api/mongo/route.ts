

import clientPromise from "../../../lib/mongodb";
import { usertype as ProfileType, ChatType } from "~~/types/dataTypes";



const client = clientPromise;
const db = client.db("nerDB");

export async function GET() {
	// Fetch all groups
	const posts = await db.collection("groups").find({}).toArray();

	const chats = await db.collection("tgChats").find({}).toArray();
	return Response.json({ posts, chats });
}

export async function POST(req: Request) {
	const subscription: ProfileType = await req.json();

	console.log(subscription);
	const chatId = subscription.tgChats[subscription.tgChats.length - 1]

	if (!process.env.BOT_TOKEN) return console.log("no token")
	//const isChat = await bot.telegram.getChat(chatId.toString())
	// Check if the profile exists in the 'groups' collection
	const existingProfile = await db.collection<ProfileType>('groups').findOne({ _id: subscription._id });

	if (!existingProfile) {

		await db.collection<ProfileType>('groups').insertOne(subscription)

	}
	// Update the 'tgChats' collection to subscribe the profile to the specified chats
	if (subscription.tgChats && subscription.tgChats.length > 0) {
		for (const chatId of subscription.tgChats) {
			// Check if the chat already exists in the 'tgChats' collection
			const chat = await db.collection<ChatType>('tgChats').findOne({ _id: chatId });

			if (chat) {
				// Check if the profile is already in the chat's profileIds array
				const isProfileInChat = chat.profileIds.some(
					(profile) => profile.contract === subscription._id.contract && profile.id === subscription._id.id
				);

				if (!isProfileInChat) {
					// If not, add the profile ID to the chat's profileIds array
					await db.collection<ChatType>('tgChats').updateOne(
						{ _id: chatId },
						{ $addToSet: { profileIds: subscription._id } }
					);
				}
			} else {
				// If the chat doesn't exist, create a new chat document
				await db.collection<ChatType>('tgChats').insertOne({
					_id: chatId,
					profileIds: [subscription._id]
				});
			}
		}

	}

	return Response.json('Profile successfully subscribed to the Telegram chat(s)');
}

