import React, { useState } from "react";
import Profile from "./Profile";
import Recipient from "./Recipient";
import { Input } from "@chakra-ui/react";
import { IoIosSearch } from "react-icons/io";
import { InputGroup } from "~~/components//ui/input-group";

type Props = {};

export default function Transfer({}: Props) {
  const [totalNativeValue, setTotalNativeValue] = useState("");
  const [isDollar, setIsDollar] = useState(true); // Toggle USD/LYX

  const activeCurrencyStyle = { color: "purple", fontWeight: "bold" };

  return (
    <div className="shadow-2xl h-[75vh] w-full max-w-[500px] mx-4 rounded-2xl flex flex-col">
      <div className="flex flex-1 flex-col justify-center items-center border-b">
        <Profile address="0xb5dcad2a23c5de55e241f20602224d1921318008" />

        <div className="flex justify-center items-center">
          {isDollar && totalNativeValue && <span className="text-4xl">$</span>}
          <Input
            placeholder="0"
            className="h-16 text-center text-4xl outline-none"
            value={totalNativeValue}
            onChange={e => setTotalNativeValue(e.target.value)}
            width={`${Math.max(totalNativeValue.length, 1)}ch`}
          />
          {!isDollar && totalNativeValue && <span className="text-4xl">LYX</span>}
        </div>

        <strong className="text-md font-semibold italic text-gray-500">~1.4980</strong>

        <button
          className="border border-black px-2 py-1 text-sm mt-2 rounded-md"
          onClick={() => setIsDollar(prev => !prev)}
        >
          <span style={isDollar ? activeCurrencyStyle : {}}>USD</span> /{" "}
          <span style={!isDollar ? activeCurrencyStyle : {}}>LYX</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-4">
        <div className="flex items-center gap-2">
          <Recipient />
          <Recipient />
        </div>

        <InputGroup
          endElement={<IoIosSearch className="text-xl text-black" />}
          className="bg-gray-100 w-[85%] mt-4 rounded-lg"
        >
          <Input placeholder="Enter address of recipient" className="pl-4 outline-none" />
        </InputGroup>

        <button className="bg-gray-500 text-white hover:bg-white px-8 py-2 hover:text-gray-500 border hover:border-gray-500 rounded-lg font-light duration-200 mt-4 text-sm w-[85%]">
          <text>Send 🚀</text>
        </button>
      </div>
    </div>
  );
}
