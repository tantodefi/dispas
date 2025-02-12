/**
 * Helper function to get the first 4 hex characters of an Ethereum wallet address,
 * excluding the '0x' prefix.
 *
 * @param {string} address - The Ethereum wallet address.
 * @returns {string} - The first 4 hex characters of the wallet address (without '0x').
 * @throws Will throw an error if the address is invalid or too short.
 */
export function getFirst4Hex(address: string): string {
  // Ensure the address is valid and has the expected length
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address");
  }

  // Remove '0x' prefix and return the first 4 characters
  return address.slice(2, 6);
}

/**
 * Truncates an Ethereum address for better readability.
 *
 * Example:
 * ```
 * truncateAddress("0x1234567890abcdef1234567890abcdef12345678");
 * // Output: "0x1234...5678"
 * ```
 *
 * @param {string} address - The full Ethereum address.
 * @returns {string} The truncated address in the format "0x1234...5678".
 */
export const truncateAddress = (address: string): string => {
  if (!address || address.length < 10) return address; // Return as is if too short
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
