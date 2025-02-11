import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ERC725, ERC725JSONSchema } from "@erc725/erc725.js";
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { Profile as ProfileType, luksoNetworks } from "~~/contexts/UniversalProfileContext";
import { getFirst4Hex } from "~~/utils/helpers";
import { getAddressColor } from "~~/utils/scaffold-eth/getAddressColor";

type Props = {
  address: `0x${string}`;
  showName?: boolean;
};

export default function Profile({ address, showName }: Props) {
  const [profile, setProfile] = useState<ProfileType | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const network = luksoNetworks[0];

        // Instanciate the LSP3-based smart contract
        const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], address, network.rpcUrl, {
          ipfsGateway: network.ipfsGateway,
        });

        const profileMetadata = await erc725js.fetchData("LSP3Profile");

        if (
          profileMetadata.value &&
          typeof profileMetadata.value === "object" &&
          "LSP3Profile" in profileMetadata.value
        ) {
          setProfile(profileMetadata.value.LSP3Profile);
        }
      } catch (error) {
        console.error("Cannot fetch Hero data", error);
      }
    })();
  }, [address]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-20 aspect-square rounded-full" style={{ backgroundColor: getAddressColor(address) }}>
        {!profile?.profileImage || profile.profileImage.length === 0 ? null : (
          <Link href={`https://universaleverything.io/${address}`} target="_blank">
            <img
              src={profile.profileImage[0].url.replace("ipfs://", "https://api.universalprofile.cloud/ipfs/")}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </Link>
        )}
      </div>

      {showName && profile && (
        <strong className="text-sm mt-1 text-purple-500">
          @{profile?.name}
          <span className="text-blue-400">#{getFirst4Hex(address)}</span>
        </strong>
      )}
    </div>
  );
}
