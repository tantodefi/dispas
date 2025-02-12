"use client";

import type { NextPage } from "next";
import Transfer from "~~/components/Transfer";
import { UPRainbowKitCustomConnectButton } from "~~/components/scaffold-eth/UPRainbowKitCustomConnectButton";

const Home: NextPage = () => {
  return (
    <main className="bg-white flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-[450px] flex justify-end mb-2">
        <UPRainbowKitCustomConnectButton />
      </div>
      <Transfer />
    </main>
  );
};

export default Home;
