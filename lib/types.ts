
export type WalletStep = 'initial' | 'import' | 'create' | 'display';
export type ChainType = 'solana' | 'ethereum';

export interface WalletData {
  type: ChainType;
  publicKey: string;
  privateKey: string;
  mnemonic: string;
}
export interface SolanaWallet {
    path: string;
    publicKey: string;
    privateKey: string;
  }
  
  export interface EthereumWallet {
    path: string;
    address: string;
    privateKey: string;
  }
  
  export interface WalletState {
    mnemonic: string;
    solana: SolanaWallet[];
    ethereum: EthereumWallet[];
  }
  export interface Wallet {
    index: number;
    address: string;
    balance: number;
    tokens: { [key: string]: number };
  }
  
  export interface Transaction {
    timestamp: number;
    type: 'Send' | 'Receive';
    amount: number;
    status: 'pending' | 'confirmed';
  }
  
  export interface Network {
    name: string;
    rpcUrl: string;
    chainId: number;
  }