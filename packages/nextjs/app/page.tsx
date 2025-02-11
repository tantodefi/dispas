"use client";

import type { NextPage } from "next";
import Transfer from "~~/components/Transfer";

const Home: NextPage = () => {
  return (
    <main className="bg-white h-screen flex justify-center items-center">
      <Transfer />
    </main>
  );
};

export default Home;
