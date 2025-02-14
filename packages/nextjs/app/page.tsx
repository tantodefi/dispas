"use client";

import { useState } from "react";
import type { NextPage } from "next";
import Transfer from "~~/components/Transfer";
import StealthTransfer from "~~/components/StealthTransfer";
import { UPRainbowKitCustomConnectButton } from "~~/components/scaffold-eth/UPRainbowKitCustomConnectButton";

const Home: NextPage = () => {
  const [isStealthEnabled, setIsStealthEnabled] = useState(false);

  return (
    <main className="bg-white flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-[450px] flex justify-end mb-2">
        <UPRainbowKitCustomConnectButton />
      </div>

      {isStealthEnabled ? <StealthTransfer /> : <Transfer />}
      
      <div className="flex items-center gap-2 mt-4">
        <span>Enable Stealth Transfer</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={isStealthEnabled}
          onChange={e => setIsStealthEnabled(e.target.checked)}
        />
      </div>
    </main>
  );
};

export default Home;
