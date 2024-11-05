"use client";
import React, { use, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { EthereumWallet, SolanaWallet, WalletState } from "@/lib/types";

const MultiWalletGenerator: React.FC = () => {
  const [wallets, setWallets] = useState<WalletState>({
    mnemonic: "",
    solana: [],
    ethereum: [],
  });
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [walletNumber, setWalletNumber] = useState<number>(1);

  const generateInitialWallets = async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const [
        { generateMnemonic, mnemonicToSeedSync },
        { derivePath },
        { Keypair },
        { ethers },
      ] = await Promise.all([
        import("bip39"),
        import("ed25519-hd-key"),
        import("@solana/web3.js"),
        import("ethers"),
      ]);

      const mnemonic = generateMnemonic(256);
      const seedBuffer = mnemonicToSeedSync(mnemonic);
      const solanaWallets: SolanaWallet[] = [];
      const ethereumWallets: EthereumWallet[] = [];

      try {
        const path = `m/44'/501'/0'/0'`;
        const { key: derivedSeed } = derivePath(
          path,
          seedBuffer.toString("hex")
        );
        const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
        solanaWallets.push({
          path,
          publicKey: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        });
      } catch (error) {
        console.error("Error generating Solana wallet:", error);
        toast.error("Error generating Solana wallet");
      }

      try {
        const hdNode = ethers.Wallet.fromPhrase(mnemonic);

        const path = `m/44'/60'/0'/0/0`;
        const wallet = ethers.HDNodeWallet.fromMnemonic(
          ethers.Mnemonic.fromPhrase(mnemonic),
          path
        );
        ethereumWallets.push({
          path,
          address: wallet.address,
          privateKey: wallet.privateKey,
        });
      } catch (error) {
        console.error("Error generating Ethereum wallets:", error);
        toast.error("Error generating Ethereum wallets");
      }

      if (solanaWallets.length === 0 && ethereumWallets.length === 0) {
        throw new Error("Failed to generate any wallets");
      }

      setWallets({
        mnemonic,
        solana: solanaWallets,
        ethereum: ethereumWallets,
      });

      toast.success("Initial wallets generated successfully!");
    } catch (error) {
      console.error("Error in wallet generation:", error);
      toast.error(
        "Failed to generate wallets. Please check console for details."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAdditionalWallet = async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const [{ derivePath }, { Keypair }, { ethers }] = await Promise.all([
        import("ed25519-hd-key"),
        import("@solana/web3.js"),
        import("ethers"),
      ]);

      const solanaWallet: SolanaWallet = await new Promise(
        (resolve, reject) => {
          try {
            const path = `m/44'/501'/${walletNumber}'/0'`;
            const { key: derivedSeed } = derivePath(path, wallets.mnemonic);
            const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
            resolve({
              path,
              publicKey: keypair.publicKey.toString(),
              privateKey: Buffer.from(keypair.secretKey).toString("hex"),
            });
          } catch (error) {
            console.error("Error generating Solana wallet:", error);
            reject(error);
          }
        }
      );

      const ethereumWallet: EthereumWallet = await new Promise(
        (resolve, reject) => {
          try {
            const path = `m/44'/60'/0'/0/${walletNumber}`;
            const wallet = ethers.HDNodeWallet.fromMnemonic(
              ethers.Mnemonic.fromPhrase(wallets.mnemonic),
              path
            );
            resolve({
              path,
              address: wallet.address,
              privateKey: wallet.privateKey,
            });
          } catch (error) {
            console.error("Error generating Ethereum wallets:", error);
            reject(error);
          }
        }
      );

      setWallets((prevState) => ({
        ...prevState,
        solana: [...prevState.solana, solanaWallet],
        ethereum: [...prevState.ethereum, ethereumWallet],
      }));

      setWalletNumber(walletNumber + 1);
      toast.success("Additional wallet generated successfully!");
    } catch (error) {
      console.error("Error in wallet generation:", error);
      toast.error(
        "Failed to generate additional wallet. Please check console for details."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (content: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="min-h-screen p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Multi-Wallet Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button
                onClick={() => generateInitialWallets()}
                className="mb-4"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Initial Wallets"}
              </Button>
              <Button
                onClick={() => generateAdditionalWallet()}
                className="mb-4"
                disabled={isGenerating}
              >
                Add Wallet
              </Button>
              {wallets.mnemonic && (
                <Button
                  variant="outline"
                  onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                >
                  {showPrivateKeys ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showPrivateKeys ? "Hide" : "Show"} Private Keys
                </Button>
              )}
            </div>

            {wallets.mnemonic && (
              <div className="space-y-6">
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Seed Phrase:</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallets.mnemonic)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="break-all">{wallets.mnemonic}</p>
                </div>

                {wallets.solana.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold">Solana Wallets:</h3>
                    {wallets.solana.map((wallet, i) => (
                      <div key={i} className="bg-secondary p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm mb-1 break-all">
                            Public Key: {wallet.publicKey}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.publicKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {showPrivateKeys && (
                          <div className="flex justify-between items-center">
                            <p className="text-sm break-all">
                              Private Key: {wallet.privateKey}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(wallet.privateKey)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {wallets.ethereum.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold">Ethereum Wallets:</h3>
                    {wallets.ethereum.map((wallet, i) => (
                      <div key={i} className="bg-secondary p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm mb-1 break-all">
                            Address: {wallet.address}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {showPrivateKeys && (
                          <div className="flex justify-between items-center">
                            <p className="text-sm break-all">
                              Private Key: {wallet.privateKey}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(wallet.privateKey)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiWalletGenerator;
