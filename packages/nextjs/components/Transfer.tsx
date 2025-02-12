import React, { useState } from "react";
import Payment, { PaymentType } from "./Payment";
import Profile from "./Profile";
import ProfilePlaceholder from "./ProfilePlaceholder";
import { ProfileSearch } from "./ProfileSearch";
import { Button, HStack, Input } from "@chakra-ui/react";
import { formatEther, parseEther } from "viem";
import { useAccount, useSendTransaction, useWriteContract } from "wagmi";
import { useDeployedContractInfo, useWatchBalance } from "~~/hooks/scaffold-eth";
import { useCryptoPrice } from "~~/hooks/scaffold-eth/useCryptoPrice";

type Props = {};

export default function Transfer({}: Props) {
  const [totalNativeValue, setTotalNativeValue] = useState("");
  const [totalDollarValue, setTotalDollarValue] = useState("");
  const [isDollar, setIsDollar] = useState(false); // Toggle USD/LYX
  const [isSending, setIsSending] = useState(false);

  const [payments, setPayments] = useState<PaymentType[]>([]);

  const account = useAccount();
  const { data: balance } = useWatchBalance({ address: account.address });
  const { price: nativeCurrencyPrice } = useCryptoPrice();

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  const activeCurrencyStyle = { color: "purple", fontWeight: "bold" };
  const errorStyle = { color: "red" };

  const switchCurrency = () => {
    if (!nativeCurrencyPrice) {
      alert("Loading resources...");
      return;
    }

    setIsDollar(prev => !prev);
  };

  // Handle input conversion & enforce numeric values
  const handleInput = (input: string) => {
    if (input.trim() === "") {
      setTotalNativeValue("");
      setTotalDollarValue("");
      return;
    }

    // Ensure only valid floating numbers are parsed
    const numericValue = input.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except `.`
    if (!/^\d*\.?\d*$/.test(numericValue) || numericValue == "") return; // Ensure valid decimal format

    if (!nativeCurrencyPrice) {
      setTotalNativeValue(numericValue);
      return;
    }

    if (isDollar) {
      setTotalDollarValue(numericValue);
      setTotalNativeValue((parseFloat(numericValue) / nativeCurrencyPrice).toString());
    } else {
      setTotalNativeValue(numericValue);
      setTotalDollarValue((parseFloat(numericValue) * nativeCurrencyPrice).toFixed(2));
    }
  };

  const displayTotalValue = isDollar ? totalDollarValue : totalNativeValue;
  const displayConversion = isDollar ? totalNativeValue : totalDollarValue;
  const isBalanceInsufficient = Number(totalNativeValue) > formattedBalance;

  const handleRecipientSelection = (recipient: `0x${string}`): boolean => {
    // Check if the recipient is already in the list
    if (payments.some(payment => payment.recipient.toLowerCase() === recipient.toLowerCase())) {
      alert("Recipient already added");
      return false;
    }

    // Add recipient with an initial amount of 0
    // @ts-ignore
    setPayments(prevPayments => [...prevPayments, { recipient, amount: "" }]);

    return true;
  };

  const removePayment = (recipient: `0x${string}`) => {
    setPayments(prevPayments =>
      prevPayments.filter(payment => payment.recipient.toLowerCase() !== recipient.toLowerCase()),
    );
  };

  const addRecipientAmount = (recipient: `0x${string}`, amount: string) => {
    const payment = payments.find(payment => payment.recipient.toLowerCase() === recipient.toLowerCase());

    // add the difference between the old and new amount
    const totalValue = ((Number(totalNativeValue) || 0) + Number(amount) - Number(payment?.amount)).toString();

    setTotalNativeValue(totalValue);
    if (nativeCurrencyPrice) {
      setTotalDollarValue((parseFloat(totalValue) * nativeCurrencyPrice).toFixed(2));
    }
    // update amount
    setPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.recipient.toLowerCase() === recipient.toLowerCase() ? { ...payment, amount } : payment,
      ),
    );
  };

  const isSharedEqually = (): boolean =>
    totalNativeValue === "" ||
    payments.length === 0 ||
    Number(totalNativeValue) === payments.reduce((sum, p) => sum + Number(p.amount || -1), 0);

  const shareEqually = () => {
    if (payments.length === 0 || Number(totalNativeValue) === 0 || isSharedEqually()) return;

    const shareAmount = Number(totalNativeValue) / payments.length; // Fixed to 6 decimals for precision

    setPayments(prevPayments =>
      prevPayments.map(payment => ({
        ...payment,
        amount: shareAmount.toString(),
      })),
    );

    const newTotalNativeValue = shareAmount * payments.length;

    setTotalNativeValue(newTotalNativeValue.toString());

    if (nativeCurrencyPrice) {
      setTotalDollarValue((Number(newTotalNativeValue) * nativeCurrencyPrice).toFixed(2));
    }
  };

  const { data: dispas } = useDeployedContractInfo("Dispas");
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const send = async () => {
    if (totalNativeValue === "" || Number(totalNativeValue) === 0) {
      alert("Please input a valid total amount!");
      return;
    }

    // Ensure all payments have valid amounts
    const hasInvalidPayment = payments.some(payment => !payment.amount || Number(payment.amount) <= 0);
    if (hasInvalidPayment) {
      alert("All recipients must have a valid amount greater than zero!");
      return;
    }

    // Ensure total of payments matches the inputted amount
    if (!isSharedEqually()) {
      alert("Total amount does not match sum of payments!");
      return;
    }

    try {
      setIsSending(true);

      const _payments = payments.map(payment => ({ ...payment, amount: parseEther(payment.amount) }));

      if (_payments.length === 1) {
        await sendTransactionAsync({
          to: _payments[0].recipient,
          value: _payments[0].amount,
        });
      } else {
        if (!dispas) {
          alert("Loading resources...");
          return;
        }
        await writeContractAsync({
          abi: dispas.abi,
          address: dispas.address,
          functionName: "distributeFunds",
          args: [_payments],
          value: parseEther(totalNativeValue),
        });
      }

      alert("Transfer successful! 🚀");

      setTotalNativeValue("");
      setTotalDollarValue("");
      setPayments([]);
    } catch (error) {
      console.error("Failed to send: ", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="shadow-[0_3px_10px_rgb(0,0,0,0.2)] w-full max-w-[450px] mx-4 rounded-3xl flex flex-col">
      <div className="flex flex-1 flex-col justify-center items-center border-b rounded-t-3xl py-4">
        {account.isConnected && account.address ? (
          <Profile address={account.address as `0x${string}`} />
        ) : (
          <ProfilePlaceholder />
        )}

        <div className="flex justify-center items-center text-3xl w-full max-w-[90%] overflow-hidden text-ellipsis text-black whitespace-nowrap">
          {isDollar && totalNativeValue && <span>$</span>}
          <Input
            placeholder="0"
            className="h-16 text-center outline-none"
            value={displayTotalValue}
            onChange={e => handleInput(e.target.value)}
            required
            width={`${Math.max(displayTotalValue.length, 1)}ch`}
          />
          {!isDollar && totalNativeValue && <span className="ml-1">LYX</span>}
        </div>

        <strong
          className="text-md font-semibold italic text-gray-500 mt-[-10px]"
          style={isBalanceInsufficient ? errorStyle : {}}
        >
          ~{!isDollar && "$"}
          {displayConversion} {isDollar && "LYX"}
        </strong>

        <HStack className="mt-4">
          <button
            className="border border-gray-500 px-2 py-1 text-xs rounded-lg text-black w-24 h-8"
            onClick={switchCurrency}
          >
            <span style={isDollar ? activeCurrencyStyle : {}}>USD</span> /{" "}
            <span style={!isDollar ? activeCurrencyStyle : {}}>LYX</span>
          </button>

          <Button
            onClick={shareEqually}
            className="bg-gray-500 text-white w-24 h-8 font-bold hover:bg-white py-1 hover:text-gray-500 border hover:border-gray-500 rounded-lg duration-200 text-xs"
            disabled={isSharedEqually()}
          >
            Share
          </Button>
        </HStack>
      </div>

      <div className="flex-1 flex flex-col items-center py-4 bg-gray-100 shadow-inner rounded-b-3xl">
        <div
          id="payments"
          className="flex flex-1 max-w-full items-center overflow-x-auto space-x-2 py-4 px-2 no-scrollbar"
        >
          {payments.length === 0 ? (
            <ProfilePlaceholder />
          ) : (
            payments.map(payment => (
              <Payment
                key={payment.recipient}
                payment={payment}
                nativeCurrencyPrice={nativeCurrencyPrice}
                onClose={removePayment}
                onChange={addRecipientAmount}
              />
            ))
          )}
        </div>

        <ProfileSearch onSelectAddress={handleRecipientSelection} />

        <button
          onClick={send}
          className="bg-gray-500 text-white hover:bg-white px-8 py-2 hover:text-gray-500 border hover:border-gray-500 rounded-xl font-light duration-200 mt-4 text-sm h-12 w-[85%]"
        >
          <span className="font-extrabold">
            {isSending
              ? payments.length > 1
                ? "Distributing..."
                : "Sending..."
              : payments.length > 1
                ? "Distribute"
                : "Send"}
          </span>
        </button>
      </div>
    </div>
  );
}
