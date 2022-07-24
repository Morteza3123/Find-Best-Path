const { ethers } = require("ethers");
const { ChainId, UniswapPair, ETH, UniswapPairSettings, UniswapVersion } = require("simple-uniswap-sdk");
const { quickRouterAddress, routerAbi, tokenAbi } = require("./abi");
require("dotenv").config({ path: __dirname + "/.env" });

var url = 'https://polygon-rpc.com/';
const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(process.env.KEY, provider);

const usdtAddress = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";

const getBestPath = async (fromToken, toToken) => {
  const uniswapPair = new UniswapPair({
    // the contract address of the token you want to convert FROM
    fromTokenContractAddress: fromToken,
    // the contract address of the token you want to convert TO
    toTokenContractAddress: toToken,
    // the ethereum address of the user using this part of the dApp
    // ethereumAddress: "0xB1E6079212888f0bE0cf55874B2EB9d7a5e02cD9",
    // you can pass in the provider url as well if you want
    // providerUrl: YOUR_PROVIDER_URL,
    // OR if you want to inject your own ethereum provider (no need for chainId if so)
    // ethereumProvider: YOUR_WEB3_ETHERS_OR_CUSTOM_ETHEREUM_PROVIDER,
    ethereumAddress: "0x75Ea58a28f52948309Ee9B0bFa926dA079627241",
    ethereumProvider: provider,

    settings: new UniswapPairSettings({
        
    //   slippage: 50, // Slippage config
      deadlineMinutes: 5, // 5m max execution deadline
      disableMultihops: false, // Allow multihops
      uniswapVersions: [UniswapVersion.v2], // Only V2
      cloneUniswapContractDetails: {
        v2Override: {
          routerAddress: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
          factoryAddress: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
          pairAddress: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
        },
      },
      customNetwork: {
        nameNetwork: "polygon",
        multicallContractAddress: "0x275617327c958bD06b5D6b871E7f491D76113dd8",
        nativeCurrency: {
          name: "Matic Token",
          symbol: "MATIC",
        },
        nativeWrappedTokenInfo: {
          chainId: 137,
          contractAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
          decimals: 18,
          symbol: "WMATIC",
          name: "Wrapped Matic",
        },
        baseTokens: {
            usdt: {
                chainId: 137,
                contractAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
                decimals: 18,
                symbol: "USDT",
                name: "Theter USD",
            },
            comp: {
                chainId: 137,
                contractAddress: "0xa8d394fe7380b8ce6145d5f85e6ac22d4e91acde",
                decimals: 18,
                symbol: "BUSD",
                name: "Binance USD",
              },
            usdc: {
                chainId: 137,
                contractAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
                decimals: 18,
                symbol: "USDC",
                name: "USD Coin",
              },
            dai: {
                chainId: 137,
                contractAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
                decimals: 18,
                symbol: "DAI",
                name: "Dai",
              },
            wbtc: {
                chainId: 137,
                contractAddress: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                decimals: 18,
                symbol: "WETH",
                name: "Wrapped Ether",
              },
        }
      },
    }),
  });

  const uniswapPairFactory = await uniswapPair.createFactory();
  
  // the amount is the proper entered amount
  // so if they enter 10 pass in 10
  // it will work it all out for you
  const findBestRoute = await uniswapPairFactory.findBestRoute('1');
  console.log(findBestRoute.bestRouteQuote.routeText)
  return findBestRoute.bestRouteQuote.routePathArray;
};





async function getDecimals(tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
  const decimals = await tokenContract.decimals()
  console.log("decimals :", decimals)
  return decimals;
}

async function getOut(fromToken, toToken) {
  const routerContract = new ethers.Contract(quickRouterAddress, routerAbi, provider);
  const fromDecimals = await getDecimals(fromToken);
  const toDecimals = await getDecimals(toToken);
  const path = await getBestPath(fromToken, toToken);
  const amountsout = await routerContract.getAmountsOut((10**fromDecimals).toString(), path);
  console.log(parseFloat(amountsout[amountsout.length - 1])/(10**toDecimals));
  return (amountsout[amountsout.length - 1]);
}

 getOut(wbtcAddress, usdtAddress)

// async function swap(fromToken, toToken, amount) {
//   const routerContract = new ethers.Contract(pancakeRouterAddress, routerAbi, provider);
//   const decimals = await getDecimals(fromToken);
//   const path = await getBestPath(fromToken, toToken);
//   const minimumAmountOut = await getOut(fromToken, toToken);
//   const deadline =  Date.now + 5*60*1000;
//   const result = await routerContract.connect(wallet).swapExactTokensForTokens((amount*10**decimals).toString(), minimumAmountOut, path, deadline);
//   const receipt = await result.wait();
//   if(receipt.status == 1){
//     console.log("Success!")
//   }
// }