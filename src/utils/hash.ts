import * as Crypto from "expo-crypto";

export const hashString = async (value: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
