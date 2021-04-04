const wrappedBNB    = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const pancakeRouter = '0x05ff2b0db69458a0750badebc4f9e13add608c7f'; // on BCS main

const bUSDCoinAdd = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
const bnbBUSDPair = '0x1b96b92314c44b159149f7e0303511fb2fc4774f';

let pairs = {};
pairs[bnbBUSDPair] = [wrappedBNB, bUSDCoinAdd];

module.exports = {
    COIN: {
        BNB: wrappedBNB,
        BUSD: bUSDCoinAdd
    },
    PAIR: {
        BNBBUSD: bnbBUSDPair
    },
    ROUTER: pancakeRouter,
    PAIRS: pairs
};
