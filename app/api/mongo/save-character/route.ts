import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI||"";
const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    const profile = await request.json();

    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
    }

    await client.connect();
    const database = client.db("your_database_name");
    const collection = database.collection("character_profiles");
    
    const result = await collection.insertOne(profile);

    return NextResponse.json({ 
      message: 'Profile saved successfully', 
      id: result.insertedId 
    });

  } catch (error) {
    console.error('Error saving character profile:', error);
    return NextResponse.json({ error: 'Failed to save character profile' }, { status: 500 });
  } finally {
    await client.close();
  }
}
