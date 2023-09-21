export type NetworkObject = {
  name: string;
  chainId: number;
  rpcUrl: string;
  logoUrl: string;
  explorerUrl: string;
  explorerName: string;
  nativeCoin: string;
  // blockPerSeconds: number;
  // multicallAddr: string;
  type: 'mainnet' | 'testnet';
};

import { allChains } from '@thirdweb-dev/chains';
export const defaultNetworks: NetworkObject[] = allChains.map((chain) => {
  const parse = (src: string | undefined) => {
    if (!src) return src;
    if (src?.startsWith("ipfs")) {
      return "https://ipfs.io/ipfs/" + src.split("://")[1];
    }
    return src;
  }
  return {
    name: chain.name,
    chainId: chain.chainId,
    rpcUrl: chain.rpc[0],
    logoUrl: parse(chain.icon?.url),
    explorerUrl: chain.explorers?.[0]?.url,
    explorerName: chain.explorers?.[0]?.name,
    nativeCoin: chain.nativeCurrency.symbol,
    type: chain.testnet ? 'testnet' : 'mainnet'
  };
})
// export const defaultNetworks: NetworkObject[] = [
//   {
//     name: 'ETH',
//     chainId: 1,
//     rpcUrl: `https://rpc.ankr.com/eth`,
//     logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/icon/eth.svg',
//     explorerUrl: 'https://etherscan.io',
//     explorerName: 'EtherScan',
//     nativeCoin: 'ETH',
//     type: 'mainnet'
//   },
//   {
//     name: 'Polygon',
//     chainId: 137,
//     logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/icon/matic.svg',
//     rpcUrl: 'https://polygon-rpc.com/',
//     explorerUrl: 'https://explorer-mainnet.maticvigil.com/',
//     explorerName: 'PolygonScan',
//     nativeCoin: 'MATIC',
//     type: 'mainnet'
//   },
//   {
//     name: 'BSC',
//     chainId: 56,
//     rpcUrl: 'https://rpc.ankr.com/bsc',
//     logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/icon/bnb.svg',
//     explorerUrl: 'https://bscscan.com',
//     explorerName: 'BscScan',
//     nativeCoin: 'BNB',
//     type: 'mainnet'
//   },
//   {
//     name: 'IoTeX',
//     chainId: 4689,
//     rpcUrl: 'https://babel-api.mainnet.iotex.io/',
//     logoUrl: 'https://coingecko-proxy.iopay.me/coins/images/3334/large/iotex-logo.png?1547037941',
//     explorerUrl: 'https://iotexscan.io',
//     explorerName: 'IotexScan',
//     nativeCoin: 'IOTX',
//     type: 'mainnet'
//   },
//   {
//     name: 'IoTeX Testnet',
//     chainId: 4690,
//     rpcUrl: `https://babel-api.testnet.iotex.io`,
//     logoUrl: 'https://coingecko-proxy.iopay.me/coins/images/3334/large/iotex-logo.png?1547037941',
//     explorerUrl: 'https://testnet.iotexscan.io',
//     explorerName: 'IotexScan',
//     nativeCoin: 'IOTX',
//     type: 'testnet'
//   },
//   {
//     name: 'Avalanche',
//     chainId: 43114,
//     rpcUrl: 'https://rpc.ankr.com/avalanche',
//     logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/icon/avax.svg',
//     explorerUrl: 'https://subnets.avax.network/',
//     explorerName: 'AVAXScan',
//     nativeCoin: 'AVAX',
//     type: 'mainnet'
//   },
//   {
//     name: "Optimism",
//     chainId: 10,
//     rpcUrl: "https://mainnet.optimism.io",
//     logoUrl: "https://optimistic.etherscan.io/images/svg/brands/optimism.svg?v=23.09.02.4",
//     explorerUrl: "https://optimistic.etherscan.io",
//     explorerName: "Optimistic Etherscan",
//     nativeCoin: "ETH",
//     type: "mainnet"
//   },
// ];
