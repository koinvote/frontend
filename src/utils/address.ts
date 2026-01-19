/**
 * Truncates a long address string by keeping the start and end characters
 * and replacing the middle with ellipsis.
 *
 * @param address - The full address string to truncate
 * @param startLength - Number of characters to keep at the start (default: 6)
 * @param endLength - Number of characters to keep at the end (default: 4)
 * @returns The truncated address string (e.g., "bc1qxy...0wlh")
 *
 * @example
 * truncateAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")
 * // Returns: "bc1qxy...0wlh"
 *
 * truncateAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", 8, 6)
 * // Returns: "bc1qxy2k...x0wlh"
 */
export function truncateAddress(
  address: string,
  startLength = 6,
  endLength = 4
): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
