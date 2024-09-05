export type usertype = {
	_id: { contract: string, id: number },
	name: string,
	image: string,
	tgChats: number[],
	owner: string
}

// Define the structure of the chat document
export interface ChatType {
	_id: number; // Chat ID
	profileIds: {
		contract: string;
		id: number;
	}[]; // Array of profile IDs subscribed to the chat
}
