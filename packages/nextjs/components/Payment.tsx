import React, { useEffect, useMemo, useState } from "react";
import Profile from "./Profile";
import { toaster } from "./ui/toaster";
import { Input } from "@chakra-ui/react";
import { IoIosCloseCircleOutline } from "react-icons/io";

export interface PaymentType {
  recipient: `0x${string}`;
  amount: string;
}

type Props = {
  payment: PaymentType;
  nativeCurrencyPrice: number | null;
  onClose: (recipient: `0x${string}`) => void;
  onChange: (recipient: `0x${string}`, amount: string) => void;
};

export default function Payment({ payment, nativeCurrencyPrice, onClose, onChange }: Props) {
  const [showInput, setShowInput] = useState(true);
  const [nativeValue, setNativeValue] = useState(payment.amount);
  const [dollarValue, setDollarValue] = useState("");
  const [isDollar, setIsDollar] = useState(false);

  const handleInput = (input: string) => {
    if (input.trim() == "") {
      setNativeValue("");
      setDollarValue("");
      return;
    }
    // Ensure only valid floating numbers are parsed
    const numericValue = input.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except `.`
    if (!/^\d*\.?\d*$/.test(numericValue) || numericValue == "") return; // Ensure valid decimal format

    if (!nativeCurrencyPrice) {
      setNativeValue(numericValue);
      return;
    }

    if (isDollar) {
      setDollarValue(numericValue);
      setNativeValue((parseFloat(numericValue) / nativeCurrencyPrice).toString());
    } else {
      setNativeValue(numericValue);
      setDollarValue((parseFloat(numericValue) * nativeCurrencyPrice).toFixed(2));
    }
  };

  const switchCurrency = () => {
    if (!nativeCurrencyPrice) {
      toaster.create({
        title: "Loading resources",
        type: "error",
      });
      return;
    }

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

  useEffect(() => {
    if (payment.amount !== "") {
      setShowInput(false);
      setNativeValue(payment.amount);

      if (!nativeCurrencyPrice) return;
      setDollarValue((parseFloat(payment.amount) * nativeCurrencyPrice).toFixed(2));
    }
  }, [payment.amount]);

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <IoIosCloseCircleOutline
        className="absolute top-[-5px] right-5 text-lg cursor-pointer duration-200 text-gray-600 hover:text-red-400"
        onClick={() => onClose(payment.recipient)}
      />
      <Profile address={payment.recipient} showName />

      {showInput ? (
        <div className="flex flex-col items-center">
          <form onSubmit={handleSubmit} className="flex items-center border border-gray-200 bg-white rounded-lg">
            {currencyToggle}
            <Input
              placeholder="0"
              className="h-8 w-24 outline-none text-black"
              value={displayValue}
              onChange={e => handleInput(e.target.value)}
              required
            />
          </form>

          <strong className="text-xs text-center font-semibold italic text-gray-500 max-w-[100px]">
            ~{!isDollar && "$"}
            {displayConversion} {isDollar && "LYX"}
          </strong>
        </div>
      ) : (
        <span
          className="text-sm text-black hover:text-purple-400 hover:font-bold duration-200 text-center cursor-pointer max-w-[100px]"
          onClick={() => setShowInput(true)}
        >
          {payment.amount} LYX
        </span>
      )}
    </div>
  );
}
