import React, { useState } from "react";
import Profile from "./Profile";
import { Input } from "@chakra-ui/react";
import { InputGroup } from "~~/components//ui/input-group";

type Props = {};

export default function Recipient({}: Props) {
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    setShowInput(false);
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <Profile address="0xCDeC110F9c255357E37f46CD2687be1f7E9B02F7" />
      <strong className="text-sm mt-1 text-purple-500">
        @feindura<span className="text-blue-400">#b56d</span>
      </strong>

      {showInput ? (
        <div className="flex flex-col items-center">
          <form onSubmit={handleSubmit}>
            <InputGroup flex="1" startElement={<span className="text-md text-green-500">$</span>}>
              <Input placeholder="0" className="h-8 w-32 bg-gray-100 outline-none" required />
            </InputGroup>
          </form>
          <span className="text-xs font-semibold italic text-gray-500">~1.4569</span>
        </div>
      ) : (
        <span className="text-sm cursor-pointer" onClick={() => setShowInput(true)}>
          $458.92
        </span>
      )}
    </div>
  );
}
