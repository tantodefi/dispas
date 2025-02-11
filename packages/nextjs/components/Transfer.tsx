import React, { useState } from "react";
import Payment, { PaymentType } from "./Payment";
import Profile from "./Profile";
import { Input } from "@chakra-ui/react";
import { IoIosSearch } from "react-icons/io";
import { formatEther, isAddress } from "viem";
import { useAccount } from "wagmi";
import { InputGroup } from "~~/components//ui/input-group";
import { useWatchBalance } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";

type Props = {};

export default function Transfer({}: Props) {
  const [totalNativeValue, setTotalNativeValue] = useState("");
  const [totalDollarValue, setTotalDollarValue] = useState("");
  const [isDollar, setIsDollar] = useState(false); // Toggle USD/LYX

  const [payments, setPayments] = useState<PaymentType[]>([]);

  const [recipient, setRecipient] = useState("");

  const account = useAccount();
  const { data: balance } = useWatchBalance({ address: account.address });
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  const activeCurrencyStyle = { color: "purple", fontWeight: "bold" };
  const errorStyle = { color: "red" };

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
    // add the difference between the old and new amount
    const payment = payments.find(payment => payment.recipient.toLowerCase() === recipient.toLowerCase());
    setTotalNativeValue(value => ((Number(value) || 0) + Number(amount) - Number(payment?.amount)).toString());

    // update amount
    setPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.recipient.toLowerCase() === recipient.toLowerCase() ? { ...payment, amount } : payment,
      ),
    );
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

        <button
          className="border border-black px-2 py-1 text-sm mt-2 rounded-md"
          onClick={() => setIsDollar(prev => !prev)}
        >
          <span style={isDollar ? activeCurrencyStyle : {}}>USD</span> /{" "}
          <span style={!isDollar ? activeCurrencyStyle : {}}>LYX</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-4">
        <div id="payments" className="flex flex-wrap gap-2">
          {payments.map(payment => (
            <Payment key={payment.recipient} payment={payment} onClose={removePayment} onChange={addRecipientAmount} />
          ))}
        </div>

        <form onSubmit={handleSearch} className="w-full flex justify-center">
          <InputGroup
            endElement={<IoIosSearch className="text-xl text-black" />}
            className="bg-gray-100 w-[85%] mt-4 rounded-lg"
          >
            <Input
              placeholder="Enter address of recipient"
              className="pl-4 outline-none"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
          </InputGroup>
        </form>

        <button className="bg-gray-500 text-white hover:bg-white px-8 py-2 hover:text-gray-500 border hover:border-gray-500 rounded-lg font-light duration-200 mt-4 text-sm w-[85%]">
          <text>Send 🚀</text>
        </button>
      </div>
    </div>
  );
}
