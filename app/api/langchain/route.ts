import { NextResponse } from "next/server";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ChromaClient } from "chromadb";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";

/**/const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
});

export async function POST(request: Request) {


  const vectorStore = await HNSWLib.fromTexts(
    ["Hello world", "Bye bye", "hello nice world"],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    embeddings
  );
  const resultOne = await vectorStore.similaritySearch("hello world", 1);
  console.log(resultOne);
  try {
    const { characterName } = await request.json();
    console.log(characterName);

    if (!characterName) {
      return NextResponse.json({ error: "Character name is required" }, { status: 400 });
    }


    console.log(embeddings);


    //const vectorStore = await makeVectorStore(characterName);

    //vectorStore.ensureCollection();
    //const profile = await createAIFlow(characterName);

    /*
     *  const client = new ChromaClient();

    const collection = await client.createCollection({
      name: "my_collection",
    });
        // Save the profile to MongoDB
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mongo/save-character`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        });
    
        if (!saveResponse.ok) {
          throw new Error("Failed to save character profile");
        }
    
        const saveResult = await saveResponse.json();
    */
    return NextResponse.json(characterName);
  } catch (error) {
    console.error("Error in character generation process:", error);
    return NextResponse.json({ error: "Failed to generate or save character profile" }, { status: 500 });
  }
}
