import { create, mplCore } from "@metaplex-foundation/mpl-core";
import { Connection } from "@solana/web3.js";
import {
  signerIdentity,
  generateSigner,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import bs58 from "bs58";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const pinataApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiZjRjZDYzYS03MzViLTRlODctYTU4YS1kMmFlOTQxNDdhMDAiLCJlbWFpbCI6ImJyaWNvbGxpbi5ob2xsaXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJGUkExIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9LHsiaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjJlOTdmNWVkY2FiNTc0ZGFiZmM3Iiwic2NvcGVkS2V5U2VjcmV0IjoiOWUxNzM0NWY3NTg4OTNiNTc1NDZkNTJjMTI4NjkyNTg3ZGRmMDczNWE0NTE4MzQzN2E0MjE2YWEyY2M1OGQ4MSIsImlhdCI6MTcyMzA0MzY4MX0.an_VtWE2HRes3G-qQ96tA__m-ilM4XoKq8M3S5VwcCA"
// https://fuchsia-rational-snake-674.mypinata.cloud

const uploadToIPFS = async (filePath) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();

  data.append("file", fs.createReadStream(filePath));

  const res = await axios.post(url, data, {
    maxContentLength: Infinity,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data.getBoundary()}`,
      'Authorization' : `Bearer ${pinataApiKey}`
    },
  });

  return res.data.IpfsHash;
};

const uploadMetadata = async (metadata) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  const res = await axios.post(url, metadata, {
    headers: {
      'Authorization' : `Bearer ${pinataApiKey}`
    },
  });

  return res.data.IpfsHash;
};

const HELIUS_RPC =
  "https://devnet.helius-rpc.com/?api-key=44b7171f-7de7-4e68-9d08-eff1ef7529bd";
const ut8 = bs58.decode(
  "3wGeLUz5e48ng8JpSzFKHaLdzhnNA1RaEUNbZ591KFGCiaj5D4VJDwdpiMSuyFcMM8LU8v2Z8Bvrd9d2gVGHp5p9"
);

const connection = new Connection(HELIUS_RPC, "confirmed");
const umi = createUmi(connection).use(mplCore());
const payer = umi.eddsa.createKeypairFromSecretKey(ut8);

// Create UMI instance
const payerSigner = createSignerFromKeypair(umi, payer);
umi.use(signerIdentity(payerSigner));
// umi.use(mplToolbox());

const main = async () => {
  const imageHash = await uploadToIPFS("1.jpg");
  const imageUri = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

  const metadataHash = await uploadMetadata({
    name: "ColCore",
    description: "This is a core NFT made by Collin",
    image: imageUri,
  });

  const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
  console.log("matadataURI", metadataUri);

  const assetSigner = generateSigner(umi);
  const result = await create(umi, {
    asset: assetSigner,
    name: "My Core",
    uri: metadataUri,
  }).sendAndConfirm(umi);
  console.log(result);
};

main();
