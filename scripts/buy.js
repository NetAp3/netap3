const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const keys = require('../private/keys.js');
const {price, buy} = require('./utils.js');
const {PAIR, COIN, ROUTER} = require('./constants.js');

// BSC mainnet
const web3 = new Web3('https://bsc-dataseed1.binance.org:443');

const myAccount = web3.eth.accounts.privateKeyToAccount(keys);

web3.eth.accounts.wallet.add(myAccount) ;

global.web3 = web3;
global.ownAddress = myAccount.address;

price(PAIR.BNBBUSD, COIN.BNB, COIN.BUSD)
    .then(priceInBNB => {
        buy(COIN.BUSD,
            0.001 /* in BNB Human */, priceInBNB, COIN.BNB,
            ROUTER)
        .then((receipt) => console.log(receipt));
    });
