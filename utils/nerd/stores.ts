import clientPromise from "../../lib/mongodb";
import { ChatType, usertype as Usertype } from "../../types/dataTypes";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import type { Document } from "@langchain/core/documents";

const client = clientPromise;

// Assuming you have a MongoDB client instance
const db = client.db("nerDB");

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
});

export const makeVectorStore = async (name: string) => {
  return new Chroma(embeddings, {
    collectionName: name,
    url: process.env.CHROMADB_URL, // Optional, will default to this value
  });
};

export async function createVectorStoreDocumentsForChat(
  chatId: number,
): Promise<{ documents: Document[]; ids: string[] }> {
  // Step 1: Fetch the chat document using the chat ID (ctx.from value)
  const chat: ChatType | null = await db.collection<ChatType>("tgChats").findOne({ _id: chatId });

  if (!chat) {
    throw new Error(`Chat with ID ${chatId} not found`);
  }

  // Step 2: Extract the profile IDs from the chat document
  const profileIds = chat.profileIds;

  // Step 3: Fetch the corresponding profiles from the `users` collection
  const profiles: Usertype[] = await db
    .collection<Usertype>("groups")
    .find({
      _id: { $in: profileIds },
    })
    .toArray();

  // Step 4: Create Document objects for the vector store
  const documents: Document[] = profiles.map(profile => ({
    pageContent: JSON.stringify(profile),
    metadata: {
      profileId: profile._id,
      chatId: chat._id,
    },
  }));

  const ids = profiles.map(profile => `${profile._id.contract}-${profile._id.id}`);

  return { documents, ids };
}
