const { ethers } = require("ethers");
const { ChainId, UniswapPair, ETH, UniswapPairSettings, UniswapVersion } = require("simple-uniswap-sdk");
require("dotenv").config({ path: __dirname + "/.env" });
const {tokenAbi, routerAbi, pancakeRouterAddress} = require("./abi");

var url = 'https://bsc-dataseed.binance.org/';
const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(process.env.KEY, provider);

const etcAddress = "0xd17479997f34dd9156deef8f95a52d81d265be9c";//usdd
const wbnbAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";//wbnb

const getBestPath = async (fromToken, toToken) => {
  const uniswapPair = new UniswapPair({
    // the contract address of the token you want to convert FROM
    fromTokenContractAddress: fromToken,
    // the contract address of the token you want to convert TO
    toTokenContractAddress: toToken,
    // the ethereum address of the user using this part of the dApp
    ethereumAddress: "0xB1E6079212888f0bE0cf55874B2EB9d7a5e02cD9",
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
          routerAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
          factoryAddress: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
          pairAddress: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        },
      },
      customNetwork: {
        nameNetwork: "Binance",
        multicallContractAddress: "0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D",
        nativeCurrency: {
          name: "Binance",
          symbol: "BNB",
        },
        nativeWrappedTokenInfo: {
          chainId: 56,
          contractAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          decimals: 18,
          symbol: "WBNB",
          name: "Wrapped Binance",
        },
        baseTokens: {
            usdt: {
                chainId: 56,
                contractAddress: "0x55d398326f99059ff775485246999027b3197955",
                decimals: 18,
                symbol: "USDT",
                name: "Theter USD",
            },
            comp: {
                chainId: 56,
                contractAddress: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                decimals: 18,
                symbol: "BUSD",
                name: "Binance USD",
              },
            usdc: {
                chainId: 56,
                contractAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                decimals: 18,
                symbol: "USDC",
                name: "USD Coin",
              },
            dai: {
                chainId: 56,
                contractAddress: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
                decimals: 18,
                symbol: "DAI",
                name: "Dai",
              },
            wbtc: {
                chainId: 56,
                contractAddress: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
                decimals: 18,
                symbol: "WBTC",
                name: "Wrapped Bitcoin",
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
  const routerContract = new ethers.Contract(pancakeRouterAddress, routerAbi, provider);
  const decimals = await getDecimals(fromToken, toToken);
  const path = await getBestPath(fromToken, toToken);
  const amountsout = await routerContract.getAmountsOut((10**decimals).toString(), path);
  console.log(parseFloat(amountsout[amountsout.length - 1])/(10**18));
  return (amountsout[amountsout.length - 1]);
}

getOut(etcAddress, wbnbAddress)

async function swap(fromToken, toToken, amount) {
  const routerContract = new ethers.Contract(pancakeRouterAddress, routerAbi, provider);
  const decimals = await getDecimals(fromToken);
  const path = await getBestPath(fromToken, toToken);
  const minimumAmountOut = await getOut(fromToken, toToken);
  const deadline =  Date.now + 5*60*1000;
  const result = await routerContract.connect(wallet).swapExactTokensForTokens((amount*10**decimals).toString(), minimumAmountOut, path, deadline);
  const receipt = await result.wait();
  if(receipt.status == 1){
    console.log("Success!")
  }
}