import { useScaffoldContract } from "./useScaffoldContract";
import { useWalletClient } from "wagmi";
import { getParsedError } from "~~/utils/scaffold-eth";

export const useScaffoldContractWrite = ({ contractName, functionName, args, value, onBlockConfirmation, blockConfirmations }) => {
  const { data: walletClient } = useWalletClient();
  const { data: deployedContract } = useScaffoldContract({
    contractName,
    walletClient,
  });

  // ... rest of hook implementation
}; 