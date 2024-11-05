"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Grid2X2,
  List,
  Plus,
  Trash,
  Wallet,
} from "lucide-react";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { ethers } from "ethers";
import { toast } from "sonner";

type WalletType = "solana" | "ethereum";

interface WalletData {
  type: WalletType;
  publicKey: string;
  privateKey: string;
  path: string;
  index: number;
}

const WalletSetup: React.FC = () => {
  const [step, setStep] = useState<"initial" | "display">("initial");
  const [mnemonic, setMnemonic] = useState<string>("");
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean[]>([]);
  const [gridView, setGridView] = useState<boolean>(false);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");

  useEffect(() => {
    const storedWallets = localStorage.getItem("hdWallets");
    const storedMnemonic = localStorage.getItem("hdMnemonic");
    if (storedWallets && storedMnemonic) {
      setWallets(JSON.parse(storedWallets));
      setMnemonic(storedMnemonic);
      setShowPrivateKeys(
        new Array(JSON.parse(storedWallets).length).fill(false)
      );
      setStep("display");
    }
  }, []);

  const generateWallet = (
    type: WalletType,
    index: number
  ): WalletData | null => {
    try {
      const currentMnemonic = mnemonic || generateMnemonic(256);
      if (!mnemonic) setMnemonic(currentMnemonic);

      const seedBuffer = mnemonicToSeedSync(currentMnemonic);
      const path =
        type === "solana"
          ? `m/44'/501'/${index}'/0'`
          : `m/44'/60'/0'/0/${index}`;

      if (type === "solana") {
        const { key: derivedSeed } = derivePath(
          path,
          seedBuffer.toString("hex")
        );
        const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
        return {
          type: "solana",
          publicKey: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString("hex"),
          path,
          index,
        };
      } else {
        const hdNode = ethers.HDNodeWallet.fromPhrase(currentMnemonic);
        const wallet = hdNode.derivePath(path);
        return {
          type: "ethereum",
          publicKey: wallet.address,
          privateKey: wallet.privateKey,
          path,
          index,
        };
      }
    } catch (error) {
      console.error("Wallet generation error:", error);
      toast.error("Failed to generate wallet");
      return null;
    }
  };

  const handleCreateWallet = (type: WalletType): void => {
    if (mnemonicInput && !validateMnemonic(mnemonicInput)) {
      toast.error("Invalid recovery phrase");
      return;
    }

    if (mnemonicInput) {
      setMnemonic(mnemonicInput);
    }

    const wallet = generateWallet(type, wallets.length);
    if (wallet) {
      const updatedWallets = [...wallets, wallet];
      setWallets(updatedWallets);
      setShowPrivateKeys([...showPrivateKeys, false]);
      localStorage.setItem("hdWallets", JSON.stringify(updatedWallets));
      localStorage.setItem("hdMnemonic", mnemonic || mnemonicInput);
      setStep("display");
      toast.success("Wallet created successfully!");
    }
  };

  const handleDeleteWallet = (index: number): void => {
    const updatedWallets = wallets.filter((_, i) => i !== index);
    setWallets(updatedWallets);
    setShowPrivateKeys(showPrivateKeys.filter((_, i) => i !== index));
    localStorage.setItem("hdWallets", JSON.stringify(updatedWallets));
    toast.success("Wallet deleted successfully!");
  };

  const handleClearWallets = (): void => {
    localStorage.removeItem("hdWallets");
    localStorage.removeItem("hdMnemonic");
    setWallets([]);
    setMnemonic("");
    setShowPrivateKeys([]);
    setStep("initial");
    toast.success("All wallets cleared");
  };

  const copyToClipboard = (content: string): void => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const togglePrivateKey = (index: number): void => {
    setShowPrivateKeys(
      showPrivateKeys.map((show, i) => (i === index ? !show : show))
    );
  };

  return (
    <div className="min-h-screen p-4">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              <CardTitle>HD Wallet Setup</CardTitle>
            </div>
            {wallets.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setGridView(!gridView)}
                  className="hidden md:flex"
                >
                  {gridView ? <Grid2X2 /> : <List />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Clear All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all wallets?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All wallets will be
                        removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearWallets}>
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {step === "initial" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">Create New HD Wallet</h2>
                <Input
                  placeholder="Enter recovery phrase (optional)"
                  value={mnemonicInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMnemonicInput(e.target.value)
                  }
                  className="max-w-xl"
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={() => handleCreateWallet("solana")}>
                  Create Solana Wallet
                </Button>
                <Button onClick={() => handleCreateWallet("ethereum")}>
                  Create Ethereum Wallet
                </Button>
              </div>
            </div>
          )}

          {mnemonic && (
            <div className="border rounded-lg p-4 mb-6">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                <h3 className="text-lg font-semibold">Recovery Phrase</h3>
                <Button variant="ghost" size="sm">
                  {showMnemonic ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </div>
              {showMnemonic && (
                <div
                  className="mt-4 p-4 bg-secondary rounded-lg cursor-pointer"
                  onClick={() => copyToClipboard(mnemonic)}
                >
                  {mnemonic}
                </div>
              )}
            </div>
          )}

          <div
            className={`grid gap-6 ${
              gridView ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            }`}
          >
            {wallets.map((wallet, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {wallet.type === "solana" ? "Solana" : "Ethereum"} Wallet{" "}
                    {index + 1}
                  </h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete wallet?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteWallet(index)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Public Address
                    </label>
                    <div
                      className="mt-1 p-2 bg-secondary rounded cursor-pointer truncate"
                      onClick={() => copyToClipboard(wallet.publicKey)}
                    >
                      {wallet.publicKey}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Private Key</label>
                    <div className="mt-1 relative">
                      <div
                        className="p-2 bg-secondary rounded cursor-pointer truncate"
                        onClick={() => copyToClipboard(wallet.privateKey)}
                      >
                        {showPrivateKeys[index]
                          ? wallet.privateKey
                          : "•".repeat(20)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => togglePrivateKey(index)}
                      >
                        {showPrivateKeys[index] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Derivation Path
                    </label>
                    <div className="mt-1 p-2 bg-secondary rounded truncate">
                      {wallet.path}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {wallets.length > 0 && (
            <div className="mt-6">
              <Button onClick={() => setStep("initial")} className="mr-2">
                Add Another Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletSetup;
