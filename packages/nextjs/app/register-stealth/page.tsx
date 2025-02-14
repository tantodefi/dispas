"use client";

import type { NextPage } from "next";
import StealthKeyRegistration from "~~/components/StealthKeyRegistration";
import { UPRainbowKitCustomConnectButton } from "~~/components/scaffold-eth/UPRainbowKitCustomConnectButton";

const RegisterStealth: NextPage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-[450px] flex justify-end mb-4">
        <UPRainbowKitCustomConnectButton />
      </div>
      <StealthKeyRegistration />
    </main>
  );
};

export default RegisterStealth; 