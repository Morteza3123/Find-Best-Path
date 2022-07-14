const { ethers } = require('ethers');
const { ChainId, UniswapPair, ETH } = require('simple-uniswap-sdk');
require("dotenv").config({ path: __dirname + "/.env" });
const {tokenAbi, routerAbi, uniRouterAddress} = require("./abi");

var url = 'https://eth-mainnet.g.alchemy.com/v2/a5GizY0_Rs95iDiLkMYT8tD4yEgVWFKh';
const provider = new ethers.providers.JsonRpcProvider(url);
const wallet = new ethers.Wallet(process.env.KEY, provider);

const usdn = '0x674C6Ad92Fd080e4004b2312b45f796a192D27a0'; //usdn 
const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; //weth 

const getBestPath = async (fromToken, toToken) => {
  const uniswapPair = new UniswapPair({
    // the contract address of the token you want to convert FROM
    fromTokenContractAddress: fromToken,
    // the contract address of the token you want to convert TO
    toTokenContractAddress: toToken,
    // the ethereum address of the user using this part of the dApp
    ethereumAddress: '0xB1E6079212888f0bE0cf55874B2EB9d7a5e02cD9',
    // you can pass in the provider url as well if you want
    // providerUrl: YOUR_PROVIDER_URL,
    // OR if you want to inject your own ethereum provider (no need for chainId if so)
    // ethereumProvider: YOUR_WEB3_ETHERS_OR_CUSTOM_ETHEREUM_PROVIDER,
    chainId: ChainId.MAINNET,
  });

  // now to create the factory you just do
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
  const routerContract = new ethers.Contract(uniRouterAddress, routerAbi, provider);
  const decimals = await getDecimals(fromToken, toToken);
  const path = await getBestPath(fromToken, toToken);
  const amountsout = await routerContract.getAmountsOut((10**decimals).toString(), path);
  console.log(parseFloat(amountsout[amountsout.length - 1])/(10**18));
  return (amountsout[amountsout.length - 1]);
}

getOut(usdn, weth)

async function swap(fromToken, toToken, amount) {
  const routerContract = new ethers.Contract(uniRouterAddress, routerAbi, provider);
  const decimals = await getDecimals(fromToken);
  const path = await getBestPath(fromToken, toToken);
  const minimumAmountOut = await getOut(fromToken, toToken);
  const deadline =  Date.now + 5*60*1000;
  const result = await routerContract.connect(wallet).swapExactTokensForTokens((amount*10**decimals).toString(), minimumAmountOut, path, deadline);
  const receipt = await result.wait();
  if(receipt.status == 1){
    console.log("Success!");
  }
}