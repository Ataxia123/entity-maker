
"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { usertype } from "~~/types/dataTypes";

// To access the profile in your components
const CharacterProfileComponent = () => {
  const [characterName, setCharacterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/langchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ characterName }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate character profile");
      }

      const { profile } = await response.json();
      console.log(profile);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={characterName}
        onChange={e => setCharacterName(e.target.value)}
        placeholder="Enter character name"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Character"}
      </button>
    </form>
  );
};

const NFTApp = () => {
  const { address: connectedAddress } = useAccount();
  const contract = useScaffoldContract({ contractName: "WarpDrive" });
  const [selectedToken, setSelectedToken] = useState(1n);
  const [tgChat, setTgChat] = useState<number>(0);
  const [nftData, setNFTData] = useState({
    nftId: 1,
    Level: "",
    Power1: "",
    Power2: "",
    Power3: "",
    Power4: "",
    Alignment1: "",
    Alignment2: "",
    Side: "",
    capName: "",
    image: "",
    telegramChats: [] as number[],
  });

  const {
    data: userNFTs,
    isLoading: isLoadingEvents,
    error,
    refetch,
  } = useScaffoldEventHistory({
    contractName: "WarpDrive",
    filters: { to: connectedAddress },
    eventName: "Transfer",
    fromBlock: 15795907n,
  });

  const { data: uri } = useScaffoldReadContract({
    contractName: "WarpDrive",
    functionName: "tokenURI",
    args: [selectedToken],
  });

  console.log(uri, "URI");

  const app = useGlobalState();

  const fetchNFT = async (data: string) => {
    if (!data) return console.log("no uri data");
    const response = await fetch(data);
    const metadata = await response.json();
    console.log(uri, metadata);

    console.log("Metadata received in the parent component:", metadata);
    // Extract the attributes from the metadata
    const attributes = metadata?.attributes.reduce((acc: any, attr: any) => {
      acc[attr.trait_type] = attr.value;
      return acc;
    }, {});
    const ipfsGateway = "https://ipfs.ai-universe.io"; // Choose a gateway
    const imageUrl = metadata?.image.replace("ipfs://", `${ipfsGateway}/ipfs/`);

    console.log(imageUrl);

    console.log("attributes", metadata);
    if (!attributes) return;
    const nftQuery = {
      nftId: 1,
      Level: attributes?.Level,
      Power1: attributes["Power 1"],
      Power2: attributes["Power 2"],
      Power3: attributes["Power 3"],
      Power4: attributes["Power 4"],
      Alignment1: attributes["Alignment 1"],
      Alignment2: attributes["Alignment 2"],
      Side: attributes.Side,
      capName: "",
      image: imageUrl,
      telegramChats: [] as number[],
    };
    nftQuery.capName = `${nftQuery.Level} ${nftQuery.Power1} ${nftQuery.Power2} ${nftQuery.Power3} ${nftQuery.Power4}`;
    nftQuery.capName = nftQuery.capName.replace(/undefined/g, "");
    console.log(nftQuery.capName);
    setNFTData(nftQuery);
  };
  const fetchTokenIds = (userNFTs: any) => {
    if (!connectedAddress || !userNFTs || userNFTs.length == 0) {
      console.log("No address or deployed contract");
      return;
    }
    console.log(userNFTs);
    try {
      const ownedTokenIds = userNFTs.map((event: { args: { tokenId: { toString: () => any } } }) =>
        event.args.tokenId.toString(),
      );
      app.setTokenIds(ownedTokenIds);
      console.log("tokenIds", ownedTokenIds, userNFTs.length, "userBalance");
    } catch (error) {
      console.error("Error in fetchTokenIds:", error);
    }
  };

  const fetchIds = async () => {
    app.setTransfers(userNFTs);

    fetchTokenIds(userNFTs || []);

    console.log("LOGS", userNFTs, error);
  };

  useEffect(() => {
    if (connectedAddress && isLoadingEvents == false && userNFTs) {
      refetch();
      fetchIds();
      console.log(isLoadingEvents, connectedAddress);
    }
  }, [connectedAddress, isLoadingEvents, userNFTs]);

  useEffect(() => {
    getChat();
    if (uri) {
      //           app.setTokenURI(uri.data);
      //         app.setBlockNumber(String(blockNumber));
      fetchNFT(uri);
      //       console.log("URI", uri, balance.data, blockNumber)
    }
  }, [uri, selectedToken]);

  const tokenIds = app.tokenIds;

  console.log(nftData);

  const registerChat = async (e: FormEvent) => {
    e.preventDefault();

    if (nftData.telegramChats.indexOf(tgChat || 0) != -1) return console.log("Already Submitted");
    if (tgChat.toString().length > 11 || tgChat.toString().length < 10) return toast.error("TG IDS ARE 10 CHARACTERS");
    nftData.telegramChats.push(tgChat || 1);
    const payload: usertype = {
      _id: { contract: contract.data?.address || "0x", id: Number(selectedToken) },
      name: nftData.capName,
      image: nftData.image,
      tgChats: nftData.telegramChats,
      owner: connectedAddress || "",
    };
    await postToMongo(payload);
  };

  const postToMongo = async (payload: any) => {
    try {
      const res = await fetch("api/mongo", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
      });
      console.log(res);
      if (res.ok) {
        toast.success("Connected to Mongo!!");
      } else {
        console.log("Oops! Something is wrong.");
        toast(await res.json());
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getChat = async () => {
    try {
      const res = await fetch("api/mongo", {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        console.log("Yeai!");
        toast.success(`added to chat`);
      } else {
        console.log("Oops! Something is wrong.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5 flex flex-row">
          <ul>
            <li>Register your NFTs into ongoing adventures!</li>
            <li>Join a room, or start your own quest!</li>
            <li>Earn points, level up and explore the AI-Universe!</li>
          </ul>
          <CharacterProfileComponent />
          <div className="card flex justify-center items-center space-x-2 flex-col">
            <div className="card-title">
              <h1 className="text-center">
                <span className="block text-2xl mb-2">Welcome to the</span>
                <span className="block text-4xl font-bold">METAREGISTRY</span>
              </h1>
            </div>
            <figure>
              <Image src={nftData.image} width={400} height={400} alt="Picture of the author" />
            </figure>

            <div className="card-body flex">
              <p className="my-2 font-medium">Connected Address:</p>
              <Address address={connectedAddress} />
              <div className="card-actions flex flex-col">
                Name: {nftData.capName}
                <form onSubmit={e => registerChat(e)}>
                  <label>
                    enter telegram chat
                    <input onChange={e => setTgChat(Number(e.target.value))} />
                  </label>
                  <button className="btn" type="submit">
                    Submit
                  </button>
                </form>
                <select
                  id="tokenIds"
                  value={Number(selectedToken)}
                  onChange={e => {
                    setSelectedToken(BigInt(e.target.value));
                  }}
                >
                  <option>ID</option>

                  {tokenIds.map((tokenId, key) => (
                    <option key={key}>
                      <li key={key}>{tokenId}</li>
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NFTApp;
