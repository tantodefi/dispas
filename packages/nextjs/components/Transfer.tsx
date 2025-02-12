import React, { useState } from "react";
import Payment, { PaymentType } from "./Payment";
import Profile from "./Profile";
import { Input } from "@chakra-ui/react";
import { CiSearch } from "react-icons/ci";
import { formatEther, isAddress, parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { InputGroup } from "~~/components//ui/input-group";
import { useDeployedContractInfo, useWatchBalance } from "~~/hooks/scaffold-eth";
import { useCryptoPrice } from "~~/hooks/scaffold-eth/useCryptoPrice";

type Props = {};

export default function Transfer({}: Props) {
  const [totalNativeValue, setTotalNativeValue] = useState("");
  const [totalDollarValue, setTotalDollarValue] = useState("");
  const [isDollar, setIsDollar] = useState(false); // Toggle USD/LYX
  const [isSending, setIsSending] = useState(false);

  const [payments, setPayments] = useState<PaymentType[]>([]);

  const [recipient, setRecipient] = useState("");

  const account = useAccount();
  const { data: balance } = useWatchBalance({ address: account.address });
  const { price: nativeCurrencyPrice } = useCryptoPrice();

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  const activeCurrencyStyle = { color: "purple", fontWeight: "bold" };
  const errorStyle = { color: "red" };

  const switchCurrency = () => {
    if (!nativeCurrencyPrice) return;

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAddress(recipient)) {
      alert("Invalid address");
      return;
    }

    // Check if the recipient is already in the list
    if (payments.some(payment => payment.recipient.toLowerCase() === recipient.toLowerCase())) {
      alert("Recipient already added");
      return;
    }

    // Add recipient with an initial amount of 0
    // @ts-ignore
    setPayments(prevPayments => [...prevPayments, { recipient, amount: "" }]);

    // Clear input field after adding
    setRecipient("");
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

  const send = async () => {
    if (totalNativeValue === "" || Number(totalNativeValue) === 0) {
      alert("Please input a valid total amount!");
      return;
    }

    if (!dispas) {
      alert("Loading resources...");
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

      await writeContractAsync({
        abi: dispas.abi,
        address: dispas.address,
        functionName: "distributeFunds",
        args: [_payments],
        value: parseEther(totalNativeValue),
      });

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
    <div className="shadow-2xl h-[75vh] w-full max-w-[500px] mx-4 rounded-2xl flex flex-col">
      <div className="flex flex-1 flex-col justify-center items-center border-b">
        <Profile address="0xb5dcad2a23c5de55e241f20602224d1921318008" />

        <div className="flex justify-center items-center w-full max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap">
          {isDollar && totalNativeValue && <span className="text-4xl">$</span>}
          <Input
            placeholder="0"
            className="h-16 text-center text-4xl outline-none"
            value={displayTotalValue}
            onChange={e => handleInput(e.target.value)}
            required
            width={`${Math.max(displayTotalValue.length, 1)}ch`}
          />
          {!isDollar && totalNativeValue && <span className="text-4xl ml-1">LYX</span>}
        </div>

        <strong className="text-md font-semibold italic text-gray-500" style={isBalanceInsufficient ? errorStyle : {}}>
          ~{!isDollar && "$"}
          {displayConversion} {isDollar && "LYX"}
        </strong>

        <button className="border border-black px-2 py-1 text-sm mt-2 rounded-md" onClick={switchCurrency}>
          <span style={isDollar ? activeCurrencyStyle : {}}>USD</span> /{" "}
          <span style={!isDollar ? activeCurrencyStyle : {}}>LYX</span>
        </button>

        <button
          onClick={shareEqually}
          className="bg-gray-500 text-white hover:bg-white px-4 py-2 hover:text-gray-500 border hover:border-gray-500 rounded-3xl font-light duration-200 mt-4 text-xs"
          disabled={isSharedEqually()}
        >
          Share
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center py-4 bg-gray-100 shadow-inner">
        <div id="payments" className="flex flex-1 max-w-full items-center overflow-x-auto space-x-2 px-2 no-scrollbar">
          {payments.map(payment => (
            <Payment
              key={payment.recipient}
              payment={payment}
              nativeCurrencyPrice={nativeCurrencyPrice}
              onClose={removePayment}
              onChange={addRecipientAmount}
            />
          ))}
        </div>

        <form onSubmit={handleSearch} className="w-full flex justify-center">
          <InputGroup
            endElement={<CiSearch className="text-2xl text-black" />}
            className="border border-gray-200 bg-white w-[85%] rounded-xl mt-4"
          >
            <Input
              placeholder="Enter address of recipient"
              className="pl-4 text-sm text-black rounded-xl h-12"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
          </InputGroup>
        </form>

        <button
          onClick={send}
          className="bg-gray-500 text-white hover:bg-white px-8 py-2 hover:text-gray-500 border hover:border-gray-500 rounded-xl font-light duration-200 mt-4 text-sm h-12 w-[85%]"
        >
          <text className="font-extrabold">{payments.length > 1 ? "Distribute" : "Send"}</text>
        </button>
      </div>
    </div>
  );
}
