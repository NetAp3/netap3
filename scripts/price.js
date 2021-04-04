const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const {price} = require('./utils.js');
const {COIN, PAIR} = require('./constants.js');

// BSC mainnet
const web3 = new Web3('https://bsc-dataseed1.binance.org:443');

global.web3 = web3;

	price(PAIR.BNBBUSD, COIN.BUSD, COIN.BNB)
	.then((price) => {
        console.log(price.toFixed(10));
    });
