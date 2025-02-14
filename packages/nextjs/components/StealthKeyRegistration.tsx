"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { useStealthAddress } from "~~/hooks/useStealthAddress";

const StealthKeyRegistration = () => {
  const { address } = useAccount();
  const { registerKeys, generateKeys, checkRegistration } = useStealthAddress();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegistration = async () => {
    if (!address) {
      notification.error("Please connect your wallet first");
      return;
    }

    try {
      setIsRegistering(true);
      
      // Generate new stealth keys
      const { stealthMetaAddress } = await generateKeys();
      
      // Register the keys
      const tx = await registerKeys(stealthMetaAddress);
      await tx.wait();
      
      setIsRegistered(true);
      notification.success("Successfully registered stealth keys!");
    } catch (error) {
      console.error("Error registering stealth keys:", error);
      notification.error("Failed to register stealth keys");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-base-100 shadow-lg rounded-lg w-full max-w-[400px]">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold">Stealth Key Registration</h2>
        <p className="text-sm text-center text-base-content/70">
          Register your stealth keys to receive private transfers
        </p>
      </div>

      {isRegistered ? (
        <div className="text-center text-success">
          <p>✓ Your stealth keys are registered</p>
          <p className="text-sm mt-2">You can now receive stealth transfers</p>
        </div>
      ) : (
        <button
          className="btn btn-primary w-full"
          onClick={handleRegistration}
          disabled={isRegistering || !address}
        >
          {isRegistering ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Registering...
            </>
          ) : (
            "Register Stealth Keys"
          )}
        </button>
      )}

      <div className="text-sm text-center mt-2 text-base-content/70">
        Note: You only need to register once per address
      </div>
    </div>
  );
};

export default StealthKeyRegistration; 