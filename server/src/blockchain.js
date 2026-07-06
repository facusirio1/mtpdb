/**
 * MTP PLATFORM — Cliente ETTIOS Blockchain (ethers.js v6).
 */
import { ethers } from 'ethers';
import 'dotenv/config';

const RPC_URL     = process.env.ETTIOS_RPC_URL || 'https://rpc.ettiosblockchain.io';
const CHAIN_ID    = Number(process.env.ETTIOS_CHAIN_ID || 2237);
const CONTRACT    = process.env.ETTIOS_CONTRACT_ADDRESS || null;
const PRIVATE_KEY = process.env.ETTIOS_PRIVATE_KEY || null;

const NFT_ABI = [
  'function safeMint(address to, string memory uri) public returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string memory)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function nextTokenId() public view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

let provider = null;
let wallet = null;
let contract = null;

function init() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: 'ettios' });
  }
  if (PRIVATE_KEY && !wallet) wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  if (CONTRACT && wallet && !contract) {
    contract = new ethers.Contract(CONTRACT, NFT_ABI, wallet);
  }
}

export async function ettiosHealth() {
  init();
  try {
    if (!provider) return { ok: false, error: 'Provider no configurado' };
    const network = await provider.getNetwork();
    return {
      ok: true,
      rpc: RPC_URL,
      chainId: Number(network.chainId),
      expectedChainId: CHAIN_ID,
      contract: CONTRACT,
      wallet_configured: !!wallet,
      contract_loaded: !!contract,
    };
  } catch (err) {
    return { ok: false, error: err.message, rpc: RPC_URL };
  }
}

export function buildMetadata({ doc, owner, validationsCount = 0 }) {
  return {
    name: `MTP Certificate · ${doc.title}`,
    description: doc.description || `Certificación MTP tipo ${doc.doc_type?.toUpperCase()}`,
    image: `https://api.mtp.platform/nft/image/${doc._id || doc.id}.png`,
    external_url: `https://mtp.platform/verify/${doc._id || doc.id}`,
    attributes: [
      { trait_type: 'Certificate Type',  value: (doc.doc_type || 'otro').toUpperCase() },
      { trait_type: 'Owner',             value: owner.full_name || owner.company_name },
      { trait_type: 'KYC Status',        value: owner.kyc_status || 'pendiente' },
      { trait_type: 'Reputation',        value: Math.round(Number(owner.reputation || 0)) },
      { trait_type: 'Membership',        value: owner.membership || 'basica' },
      { trait_type: 'Validations',       value: validationsCount },
      { trait_type: 'AI Risk',           value: doc.ai_risk || 'bajo' },
      { trait_type: 'File SHA-256',      value: doc.file_hash || 'unknown' },
      { trait_type: 'Issued On',         value: (doc.created_at instanceof Date ? doc.created_at : new Date(doc.created_at)).toISOString() },
    ],
  };
}

export async function mintValidationNFT({ to, metadata }) {
  init();
  if (!contract) throw new Error('Contrato no configurado (revisar ETTIOS_CONTRACT_ADDRESS y ETTIOS_PRIVATE_KEY)');
  if (!ethers.isAddress(to)) throw new Error(`Dirección destino inválida: ${to}`);

  const metadataUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

  const tx = await contract.safeMint(to, metadataUri);
  const receipt = await tx.wait();

  // Extraer tokenId del evento Transfer
  let tokenId = 'unknown';
  for (const log of receipt.logs || []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'Transfer') { tokenId = parsed.args.tokenId.toString(); break; }
    } catch { /* ignore */ }
  }

  return {
    tokenId,
    txHash: tx.hash,
    contractAddress: CONTRACT,
    chainId: CHAIN_ID,
    blockNumber: receipt.blockNumber,
    metadataUri,
  };
}
