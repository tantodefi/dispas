"use client";

import { useState } from "react";
import { parseEther, Address } from "viem";
import { useAccount } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
import { ProfileSearch } from "~~/components/ProfileSearch";
import { notification } from "~~/utils/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useStealthAddress } from "~~/hooks/useStealthAddress";
import { Profile } from "~~/components/Profile";

type StealthPayment = {
  recipient: string;
  amount: string;
  stealthMetaAddress: string;
  isUP: boolean;
  profileInfo?: {
    name?: string;
    avatar?: string;
    address: string;
  };
};

const StealthTransfer = () => {
  const { address } = useAccount();
  const { generateStealthMetaAddress, checkRegistration } = useStealthAddress();
  const [payments, setPayments] = useState<StealthPayment[]>([
    { recipient: "", amount: "", stealthMetaAddress: "", isUP: false },
  ]);
  const [registrationStatus, setRegistrationStatus] = useState<{[key: string]: boolean}>({});

  const { writeAsync: transferTokens, isLoading } = useScaffoldWriteContract({
    contractName: "DispasStealth",
    functionName: "batchTransferWithStealth",
    args: [
      payments.map(p => ({
        stealthMetaAddress: p.stealthMetaAddress,
        amount: parseEther(p.amount || "0"),
      })),
    ],
    value: "0",
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      notification.success("Stealth Transfer successful!");
    },
  });

  const handleProfileSelect = async (index: number, profile: { address: string; name?: string; avatar?: string }) => {
    try {
      const isRegistered = await checkRegistration(profile.address as Address);
      setRegistrationStatus(prev => ({ ...prev, [profile.address]: isRegistered }));

      const newPayments = [...payments];
      newPayments[index] = {
        ...newPayments[index],
        recipient: profile.address,
        profileInfo: {
          name: profile.name,
          avatar: profile.avatar,
          address: profile.address
        }
      };

      if (isRegistered) {
        const metaAddress = await generateStealthMetaAddress(profile.address as Address);
        if (metaAddress) {
          newPayments[index].stealthMetaAddress = metaAddress;
        }
      } else {
        notification.warning(
          "Recipient hasn't registered stealth keys yet. They need to register before receiving stealth transfers.",
          { duration: 6000 }
        );
        newPayments[index].stealthMetaAddress = "";
      }

      setPayments(newPayments);
    } catch (error) {
      console.error("Error handling profile selection:", error);
      notification.error("Failed to process recipient");
    }
  };

  const addPayment = () => {
    setPayments([...payments, { recipient: "", amount: "", stealthMetaAddress: "", isUP: false }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const toggleRecipientType = (index: number) => {
    const newPayments = [...payments];
    newPayments[index] = { 
      ...newPayments[index], 
      isUP: !newPayments[index].isUP,
      recipient: "",
      stealthMetaAddress: ""
    };
    setPayments(newPayments);
  };

  const updatePayment = async (index: number, field: keyof StealthPayment, value: string) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };

    if (field === 'recipient' && value) {
      try {
        const isRegistered = await checkRegistration(value as Address);
        setRegistrationStatus(prev => ({ ...prev, [value]: isRegistered }));

        if (!isRegistered) {
          notification.warning(
            "Recipient hasn't registered stealth keys yet. They need to register before receiving stealth transfers.",
            { duration: 6000 }
          );
          newPayments[index].stealthMetaAddress = "";
        } else {
          const metaAddress = await generateStealthMetaAddress(value as Address);
          if (metaAddress) {
            newPayments[index].stealthMetaAddress = metaAddress;
          }
        }
      } catch (error) {
        console.error("Error checking stealth registration:", error);
        notification.error("Failed to verify stealth registration");
      }
    }

    setPayments(newPayments);
  };

  const isValid = payments.every(p => {
    const isRegistered = registrationStatus[p.recipient];
    return isRegistered && p.stealthMetaAddress && p.amount && parseFloat(p.amount) > 0;
  });

  const RecipientDisplay = ({ payment }: { payment: StealthPayment }) => {
    if (!payment.recipient) return null;

    return (
      <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
        {payment.isUP ? (
          <Profile
            address={payment.recipient as Address}
            avatar={payment.profileInfo?.avatar}
            name={payment.profileInfo?.name}
            size="sm"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img
                  src={`https://effigy.im/a/${payment.recipient}.svg`}
                  alt="Avatar"
                />
              </div>
            </div>
            <span className="text-sm font-medium">{payment.recipient}</span>
          </div>
        )}
        {registrationStatus[payment.recipient] && (
          <span className="text-xs text-success">✓ Stealth Ready</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-base-100 shadow-lg rounded-lg w-full max-w-[500px]">
      <div className="flex items-center justify-between">
        <span className="text-xl">Stealth Batch Transfer</span>
        <button 
          className="btn btn-sm btn-secondary" 
          onClick={addPayment}
        >
          Add Recipient
        </button>
      </div>

      {payments.map((payment, index) => (
        <div key={index} className="flex flex-col gap-2 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Recipient {index + 1}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">EOA</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={payment.isUP}
                  onChange={() => toggleRecipientType(index)}
                />
                <span className="text-xs">UP</span>
              </div>
              {index > 0 && (
                <button 
                  className="btn btn-sm btn-ghost text-error" 
                  onClick={() => removePayment(index)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {payment.recipient ? (
            <RecipientDisplay payment={payment} />
          ) : (
            payment.isUP ? (
              <ProfileSearch
                onSelect={(profile) => handleProfileSelect(index, profile)}
                onSelectAddress={(address) => handleProfileSelect(index, { address })}
                placeholder="Search Universal Profile"
              />
            ) : (
              <AddressInput
                value={payment.recipient}
                onChange={(value) => updatePayment(index, "recipient", value)}
                placeholder="Recipient Address"
              />
            )
          )}

          <div className="text-sm">
            {payment.recipient && (
              registrationStatus[payment.recipient] ? (
                <div className="text-success flex items-center gap-2">
                  <span>✓ Stealth keys registered</span>
                  {payment.stealthMetaAddress && (
                    <span className="text-xs">- Ready for stealth transfer</span>
                  )}
                </div>
              ) : (
                <div className="text-error flex flex-col">
                  <span>⚠️ Recipient needs to register stealth keys</span>
                  <button 
                    className="text-xs underline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/register-stealth`);
                      notification.success("Registration link copied to clipboard!");
                    }}
                  >
                    Copy registration link
                  </button>
                </div>
              )
            )}
          </div>

          <input
            type="number"
            placeholder="Amount"
            value={payment.amount}
            onChange={(e) => updatePayment(index, "amount", e.target.value)}
            className="input input-bordered w-full"
            disabled={!registrationStatus[payment.recipient]}
          />
        </div>
      ))}

      <button
        className="btn btn-primary w-full mt-4"
        onClick={() => transferTokens()}
        disabled={isLoading || !isValid}
      >
        {isLoading ? "Transferring..." : "Transfer to Stealth Addresses"}
      </button>

      <div className="text-sm text-center mt-2 text-base-content/70">
        Note: Recipients must <a href="/register-stealth" className="underline hover:text-primary">register their stealth keys</a> before they can receive stealth transfers
      </div>
    </div>
  );
};

export default StealthTransfer; 