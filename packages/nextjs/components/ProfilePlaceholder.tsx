import React from "react";
import { IoPersonOutline } from "react-icons/io5";

type Props = {};

export default function ProfilePlaceholder({}: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[4.3rem] aspect-square rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-white text-3xl">
        <IoPersonOutline />
      </div>

      <text className="text-gray-300 font-bold">--</text>
    </div>
  );
}
