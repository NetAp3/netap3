const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const keys = require('../private/keys.js');
const {liquidate} = require('./utils.js');
const {COIN, ROUTER} = require('./constants.js');

// BSC mainnet
const web3 = new Web3('https://bsc-dataseed1.binance.org:443');

const myAccount = web3.eth.accounts.privateKeyToAccount(keys);

web3.eth.accounts.wallet.add(myAccount) ;

global.web3 = web3;
global.ownAddress = myAccount.address;

liquidate(COIN.BUSD,
    0.03 /* exchange rate BNB / coin */, COIN.BNB,
    ROUTER
    )
.then(resp => console.log(resp));
