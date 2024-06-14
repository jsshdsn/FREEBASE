import { useEffect, useState } from "react";
import { utils } from "ethers";
import {
  ConnectWallet,
  Web3Button,
  createMerkleTreeFromAllowList,
  getProofsForAllowListEntry,
  useAddress,
  useContract,
} from "@thirdweb-dev/react";

const sound = new Audio("/success.mp3");
const startup = new Audio("/startup.mp3");
const loop = new Audio("/loop.mp3");
loop.loop = true;

import allowList from "../../airdrop-merkle-tree/tree.json";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function App() {
  const [soundStarted, setSoundStarted] = useState(false);
  const [claimable, setClaimable] = useState(true);
  const [claimedSuccessfully, setClaimedSuccessfully] = useState(false);
  const [successHash, setSuccessHash] = useState(null);
  const address = useAddress();
  const { contract: airdropContract } = useContract(
    import.meta.env.VITE_AIRDROP_CONTRACT_ADDRESS
  );

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  const calculateTimeLeft = () => {
    const difference = +new Date("2024-07-03") - +new Date();
    let timeLeft: Countdown = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  const getMaxClaimable = (address: string) => {
    const entry = allowList.find(
      (item: { address: string }) =>
        item.address.toLowerCase() === address.toLowerCase()
    );
    return entry ? entry.maxClaimable : 0;
  };

  const getUserProof = async (address: string) => {
    const merkleTree = await createMerkleTreeFromAllowList(allowList);
    const leaf = {
      address: address,
      maxClaimable: getMaxClaimable(address).toString(),
    };
    const proofs = await getProofsForAllowListEntry(merkleTree, leaf);

    return proofs;
  };

  const readVerifyClaim = async () => {
    try {
      // @ts-expect-error thirdweb sucking
      await airdropContract.call("verifyClaim", [
        address,
        utils.parseEther(getMaxClaimable(address as string).toString()),
        await getUserProof(address as string),
        utils.parseEther(getMaxClaimable(address as string).toString()),
      ]);
      setClaimable(true);
      // console.log(result);
    } catch (error) {
      console.log(error);
      setClaimable(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setSoundStarted(false);
    }
    if (address && !soundStarted) {
      startup.addEventListener("ended", () => loop.play());
      startup.play();
      setSoundStarted(true);
    }
    if (address && airdropContract && getMaxClaimable(address) > 0) {
      readVerifyClaim();
    }
  }, [address, airdropContract]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const handleClaimErrors = (error: any) => {
    if (error && error.code === 4001) {
      console.log("rejected");
      return;
    }

    console.log("Claiming error:", error);
    alert("Claiming failed. Please try again later.");
  };

  const handleClaimSuccess = (result: any) => {
    if (result.receipt.status === 0) {
      setClaimedSuccessfully(false);
      alert(
        "The claim transaction failed. Please try again later. TX Hash: " +
          result.receipt.transactionHash
      );
      return;
    }
    if (result.receipt.status === 1) {
      sound.play();
      setSuccessHash(result.receipt.transactionHash);
      setClaimedSuccessfully(true);
    }
  };

  const handleAddToken = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20", // Use 'ERC721' for NFTs
            options: {
              address: "0x4458B23D6e0AD0444bE4735Fac2aE9fB374C60B9", // The token's contract address
              symbol: "FREEBASE", // A string symbol of the token
              decimals: 18, // The number of decimals the token uses
              //image: token.image, // A string URL of the token logo
            },
          },
        });
      } else {
        alert(
          "This feature may not be supported by your wallet. Please add the token manually."
        );
      }
    } catch (error) {
      console.error("Failed to add token:", error);
      alert("Failed to add token. Please add it manually.");
    }
  };

  // const asciiString = `
  // ░▒▓████████▓▒░▒▓███████▓▒░░▒▓████████▓▒░▒▓████████▓▒░▒▓███████▓▒░ ░▒▓██████▓▒░ ░▒▓███████▓▒░▒▓████████▓▒░
  // ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░
  // ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░
  // ░▒▓██████▓▒░ ░▒▓███████▓▒░░▒▓██████▓▒░ ░▒▓██████▓▒░ ░▒▓███████▓▒░░▒▓████████▓▒░░▒▓██████▓▒░░▒▓██████▓▒░
  // ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░
  // ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░
  // ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░░▒▓████████▓▒░
  // `;

  return (
    <main className="crt w-full bg-black text-primary h-dvh flex items-center justify-center flex-col space-y-4 p-3 font-mono text-sm lg:text-base">
      <div>
        <div className="text-4xl sm:text-5xl md:text-6xl text-center">
          <span>{formatTime(timeLeft["days"])}</span>
          <span>:</span>
          <span>{formatTime(timeLeft["hours"])}</span>
          <span>:</span>
          <span>{formatTime(timeLeft["minutes"])}</span>
          <span>:</span>
          <span>{formatTime(timeLeft["seconds"])}</span>
        </div>
        <p className="text-center uppercase text-xs sm:text-sm md:text-base lg:text-lg">
          until the freebase experience
        </p>
      </div>

      <div className="flex flex-col items-center">
        <img src="logo.png"></img>
      </div>

      <p>Claim your tokens.</p>

      <ConnectWallet
        switchToActiveChain={true}
        theme={"dark"}
        modalSize="compact"
        modalTitleIconUrl=""
      />

      {/* Is wallet connected? */}
      {address && !claimedSuccessfully && (
        <div className="max-w-lg">
          {/* Is address included in merkle tree? */}
          {getMaxClaimable(address) > 0 && claimable ? (
            <div className="space-y-4 flex flex-col text-center">
              <p className="font-bold">
                You are eligible to claim{" "}
                {getMaxClaimable(address).toLocaleString()} FREEBASE.
              </p>

              <p>
                Claiming is gasless and only requires a signature. You do not
                need to have Base ETH on your address to claim.
              </p>

              <Web3Button
                theme={"dark"}
                contractAddress={import.meta.env.VITE_AIRDROP_CONTRACT_ADDRESS}
                action={async (contract) =>
                  contract.call("claim", [
                    address,
                    utils.parseEther(getMaxClaimable(address).toString()),
                    await getUserProof(address),
                    utils.parseEther(getMaxClaimable(address).toString()),
                  ])
                }
                onError={handleClaimErrors}
                onSuccess={handleClaimSuccess}
              >
                Claim For Free
              </Web3Button>
            </div>
          ) : (
            <div className="text-center">
              {/* If address is included in the merkle tree, it means already claimed (verify Claim failed). Otherwise not eligible. */}
              {getMaxClaimable(address) > 0 ? (
                <p className="font-bold">
                  You have already claimed your tokens.
                </p>
              ) : (
                <p>
                  You're not eligible with this address. <br />
                  Connect a different wallet.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="font-bold">
        {claimedSuccessfully && (
          <div className="text-center">
            You successfully{" "}
            <a
              href={`https://basescan.org/tx/${successHash}`}
              className="underline"
              target="_blank"
            >
              claimed
            </a>{" "}
            your tokens!
            <br />
            <a href="#" className="underline" onClick={() => handleAddToken()}>
              Add FREEBASE
            </a>{" "}
            to your wallet.
          </div>
        )}
      </p>
    </main>
  );
}

export default App;
