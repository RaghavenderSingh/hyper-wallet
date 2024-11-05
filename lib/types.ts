
export type WalletStep = 'initial' | 'import' | 'create' | 'display';
export type ChainType = 'solana' | 'ethereum';

export interface WalletData {
  type: ChainType;
  publicKey: string;
  privateKey: string;
  mnemonic: string;
}