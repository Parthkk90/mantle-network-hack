export const MANTLE_SEPOLIA = {
  chainId: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  explorerUrl: 'https://sepolia.mantlescan.xyz',
  currency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
};

export const PAYMENT_PROCESSOR_ADDRESS = '0x7D7A1bbD55c6A2e1F23cD711B319F377D09D93f8';

export const PAYMENT_PROCESSOR_ABI = [
  'function sendMNT(address payable recipient, string calldata note) external payable returns (uint256)',
  'function sendToken(address token, address recipient, uint256 amount, string calldata note) external returns (uint256)',
  'function payments(uint256) external view returns (uint256 id, address sender, address recipient, address token, uint256 amount, uint256 timestamp, string memory note, uint8 paymentType)',
  'function userSentPayments(address, uint256) external view returns (uint256)',
  'function userReceivedPayments(address, uint256) external view returns (uint256)',
];

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];
