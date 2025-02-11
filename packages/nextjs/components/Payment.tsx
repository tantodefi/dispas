import React, { useMemo, useState } from "react";
import Profile from "./Profile";
import { CloseButton, Input } from "@chakra-ui/react";
import { useGlobalState } from "~~/services/store/store";

export interface PaymentType {
  recipient: `0x${string}`;
  amount: string;
}

type Props = {
  payment: PaymentType;
  onClose: (recipient: `0x${string}`) => void;
  onChange: (recipient: `0x${string}`, amount: string) => void;
};

export default function Payment({ payment, onClose, onChange }: Props) {
  const [showInput, setShowInput] = useState(true);
  const [nativeValue, setNativeValue] = useState(payment.amount);
  const [dollarValue, setDollarValue] = useState("");
  const [isDollar, setIsDollar] = useState(false);

  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);

  const handleInput = (input: string) => {
    if (input.trim() == "") {
      setNativeValue("");
      setDollarValue("");
      return;
    }
    // Ensure only valid floating numbers are parsed
    const numericValue = input.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except `.`
    if (!/^\d*\.?\d*$/.test(numericValue) || numericValue == "") return; // Ensure valid decimal format

    if (isDollar) {
      setDollarValue(numericValue);
      setNativeValue((parseFloat(numericValue) / nativeCurrencyPrice).toString());
    } else {
      setNativeValue(numericValue);
      setDollarValue((parseFloat(numericValue) * nativeCurrencyPrice).toFixed(2));
    }
  };

  const switchCurrency = () => {
    if (!nativeCurrencyPrice) return;

    setIsDollar(prev => !prev);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    onChange(payment.recipient, nativeValue);
    setShowInput(false);
  };

  const displayValue = isDollar ? dollarValue : nativeValue;
  const displayConversion = isDollar ? nativeValue : dollarValue;

  const currencyToggle = useMemo(() => {
    return (
      <div onClick={switchCurrency} className="cursor-pointer mx-2">
        {isDollar ? (
          <span className="text-sm text-green-500">$</span>
        ) : (
          <img src="./images/lukso_logo.png" className="w-4 aspect-square" />
        )}
      </div>
    );
  }, [isDollar]);

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <CloseButton className="absolute top-[-10px] right-0 text-red-500" onClick={() => onClose(payment.recipient)} />
      <Profile address={payment.recipient} showName />

      {showInput ? (
        <div className="flex flex-col items-center">
          <form onSubmit={handleSubmit} className="flex items-center bg-gray-100">
            {currencyToggle}
            <Input
              placeholder="0"
              className="h-8 w-32 outline-none"
              value={displayValue}
              onChange={e => handleInput(e.target.value)}
              required
            />
          </form>

          <strong className="text-md font-semibold italic text-gray-500">
            ~{!isDollar && "$"}
            {displayConversion} {isDollar && "LYX"}
          </strong>
        </div>
      ) : (
        <span className="text-sm cursor-pointer max-w-[100px]" onClick={() => setShowInput(true)}>
          {payment.amount} LYX
        </span>
      )}
    </div>
  );
}
