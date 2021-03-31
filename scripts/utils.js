const moment = require('moment-timezone');

const BigNumber = require('bignumber.js');
const erc20abi = require('../abi/bep20-abi.js'); //same as ECR20-abi, actually
const pairAbi = require('../abi/cakeswap-abi.js');
const routerAbi = require('../abi/pancake-router-abi.js');

//GLOBALS:
// global.web3
// global.ownAddress

//map<address, webjsContract>
const coinContracts = {};
//map<address, BigNumber>
const _decimals = {};
//map<address, webjsContract>
const uniContracts = {};

//map<address, webjsContract>
const routerContracts = {};

// ERC20 / BEP20 coin contract for the address.
// Will be returned from cache if already loaded
const coinContract = async (address) => {
    address = address.toLowerCase();
    if (!(address in coinContracts)) {
        //load
        const web3 = global.web3;
        const ownAddress = global.ownAddress;

        const contract = await new web3.eth.Contract(erc20abi, address);

        coinContracts[address] = contract;
        log("Loading coin contract " + address);
    } else {
        log("Cache hit on coin contract " + address);
    }

    return coinContracts[address];
}

// Cake Swap contract for the address.
// Will be returned from cache if already loaded
const uniContract = async (address) => {
    address = address.toLowerCase();
    if (!(address in uniContracts)) {
        //load
        const web3 = global.web3;
        const ownAddress = global.ownAddress;

        const contract = await new web3.eth.Contract(pairAbi, address);

        uniContracts[address] = contract;
        log("Loading swap contract " + address);
    } else {
        log("Cache hit on swap contract " + address);
    }

    return uniContracts[address];
}

// Cake Swap router contract for the address.
// Will be returned from cache if already loaded
const routerContract = async (address) => {
    address = address.toLowerCase();
    if (!(address in routerContracts)) {
        //load
        const web3 = global.web3;
        const ownAddress = global.ownAddress;

        const contract = await new web3.eth.Contract(routerAbi, address);

        routerContracts[address] = contract;
        log("Loading router contract " + address);
    } else {
        log("Cache hit on router contract " + address);
    }

    return routerContracts[address];
}


// 10^decimals
const decimals = async (address) => {
    address = address.toLowerCase();
    if (!(address in _decimals)) {
        const token1contract = await coinContract(address);

        const decimals1 = await token1contract.methods.decimals().call();
        const p1 = BigNumber(10).exponentiatedBy(BigNumber(decimals1));
        _decimals[address] = p1;
        log("Loading decimals " + address+ " " + p1);
    } else {
        log("Cache hit on decimals " + address);
    }

    return _decimals[address];
}

/**
 * EXPECTS: global.web3 for the connection
 * @param shitcoinAdd the address of the coin
 * @param ownAddress our own Address
 * @return [balance:BigNumber, humanReadableBalance:BigNumber] the human readable doesn't have all those decimals
 */
const balanceOf = async (shitcoinAdd) => {
    const web3 = global.web3;
    const ownAddress = global.ownAddress;

    const token1contract = await coinContract(shitcoinAdd); 

    const p1 = await decimals(shitcoinAdd);

    const balanceRaw = await token1contract.methods.balanceOf(ownAddress).call();

    const balance = BigNumber(balanceRaw);
    const balanceHuman = balance.dividedBy(p1);
    //log("balance:" + balance);
    //log("balanceHumanReadable:" + balanceHuman);

    return [balance, balanceHuman];
};

const allowance = async (shitcoinAdd, ownAddress, spenderAddress) => {
    const token1contract = await coinContract(shitcoinAdd); 

    const p1 = await decimals(shitcoinAdd);

    const allowanceRaw = await token1contract.methods.allowance(ownAddress, spenderAddress).call();

    const allowance = BigNumber(allowanceRaw);
    const allowanceHuman = allowance.dividedBy(p1);

    return [allowance, allowanceHuman];
};

const approve = async (shitcoinAdd, spenderAddress, amountIn) => {
    const web3 = global.web3;
    const ownAddress = global.ownAddress;

    const token1contract = await coinContract(shitcoinAdd); 

    const p1 = await decimals(shitcoinAdd);

    const gasPrice = await web3.eth.getGasPrice();

    log("Gas price: " + gasPrice);

    let method = token1contract.methods.approve(
        spenderAddress,
        amountIn);

    var callOptions = {
        from: ownAddress, 
        gasPrice: gasPrice,
    }

    let gas = await method.estimateGas(callOptions);
   
    log("Estimated gas is " + gas);

    callOptions.gas = BigNumber(gas).multipliedBy(1.1).integerValue();
    return method
        .send(callOptions);
    /*
        .on('transactionHash', function(hash){
            log("Transaction " + hash);
        })
        .on('confirmation', function(confirmationNumber, receipt){
            log("Confirmation " + confirmationNumber);
            if (confirmationNumber == 0)
                log(receipt);
        })
        .on('receipt', function(receipt){
            log("Receipt");
            log(receipt);
        })
        .on('error', function(error, receipt) {
            log("Error");
            log(error);
            log(receipt);
        }); */
};

//get price in token0. (BNB, shit) pair => price in BNB. If token order is reversed it's price in the other token
// NOTE: This is not the *exact* price paid since x * y = k formula applies so it depends on
// the trade size and liquidity available.
const price = async (pairAdd, token0Add, token1Add) => {
    const pairContract = await uniContract(pairAdd);

    const pairFirstTokenAdd = await pairContract.methods.token0().call();

    const reserves = await pairContract.methods.getReserves().call();
    let reserveRaw0 = await reserves[0];
    let reserveRaw1 = await reserves[1];

    const p0 = await decimals(token0Add);
    const p1 = await decimals(token1Add);

    const humanReserve0 = BigNumber(reserveRaw0).dividedBy(p0);
    const humanReserve1 = BigNumber(reserveRaw1).dividedBy(p1);

    log("price reserve0 " + humanReserve0 + " reserve1 " + humanReserve1);

    let pairPrice;
    if (pairFirstTokenAdd.toLowerCase() == token0Add)
        pairPrice = humanReserve0.dividedBy(humanReserve1);
    else
        pairPrice = humanReserve1.dividedBy(humanReserve0);

    return pairPrice;
}

const buy = async (shitcoinAdd, amountIn, exchangeRate, wrappedBNB, routerAdd) => {
    const web3 = global.web3;
    const ownAddress = global.ownAddress;

    const router = await routerContract(routerAdd);

    const bnbDecimals = await decimals(wrappedBNB);
    const p1 = await decimals(shitcoinAdd);

    const gasPrice = await web3.eth.getGasPrice();

    log("Gas price: " + gasPrice);

    //TODO: check impact on balance / reserve

    const minAmountRaw = BigNumber(amountIn).dividedBy(exchangeRate).multipliedBy(0.98 /* 2% slippage */);
    const minAmount = minAmountRaw.multipliedBy(p1).integerValue();
    log("min amount (without all the decimals): "+ minAmountRaw);
    log("value (without all the decimals): " + BigNumber(amountIn))

    const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 3; // 3 minutes


    let method = router.methods.swapExactETHForTokens(
        minAmount,
        [wrappedBNB, shitcoinAdd],
        ownAddress,
        deadline);

    var callOptions = {
        from: ownAddress, 
        gasPrice: gasPrice,
        value: BigNumber(amountIn).multipliedBy(bnbDecimals).integerValue()
    }

    let gas = await method.estimateGas(callOptions);
   
    log("Estimated gas is " + gas);

    callOptions.gas = BigNumber(gas).multipliedBy(1.2).integerValue();

    return method
        .send(callOptions);
    /*
        .on('transactionHash', function(hash){
            log("Transaction " + hash);
        })
        .on('confirmation', function(confirmationNumber, receipt){
            log("Confirmation " + confirmationNumber);
            if (confirmationNumber == 0)
                log(receipt);
        })
        .on('receipt', function(receipt){
            log("Receipt");
            log(receipt);
        })
        .on('error', function(error, receipt) {
            log("Error");
            log(error);
            log(receipt);
        });
    */
};

const liquidate = async (shitcoinAdd, exchangeRate, wrappedBNB, routerAdd) => {
    const [amountInRaw,humanAmountIn] = await balanceOf(shitcoinAdd, ownAddress);

    return sell(shitcoinAdd, exchangeRate, wrappedBNB, routerAdd, humanAmountIn, amountInRaw);
}


//amountInRaw is optional and will be auto-computed if missing
const sell = async(shitcoinAdd, exchangeRate, wrappedBNB, routerAdd, humanAmountIn, amountInRaw) => {
    const web3 = global.web3;
    const ownAddress = global.ownAddress;

    const p1 = await decimals(shitcoinAdd);

    if (typeof amountInRaw === 'undefined') {
        amountInRaw = humanAmountIn.multipliedBy(p1);
    }

    const [allowanceRaw,humanAllowance] = await allowance(shitcoinAdd, ownAddress, routerAdd);

    log("Liquidate: Amount " + humanAmountIn);
    log("Liquidate: Allowance " + humanAllowance);
    if (allowanceRaw.isLessThan(amountInRaw))
        await approve(shitcoinAdd, routerAdd, amountInRaw.multipliedBy(10))

    const token0contract = await coinContract(wrappedBNB);
    const token1contract = await coinContract(shitcoinAdd); 
    const router = await routerContract(routerAdd);

    const bnbDecimals = await decimals(wrappedBNB);

    const gasPrice = await web3.eth.getGasPrice();

    log("Liquidate: Gas price: " + gasPrice);

    //TODO: check impact on balance / reserve

    const humanMinAmountETH= BigNumber(humanAmountIn).multipliedBy(exchangeRate).multipliedBy(0.98 /* 2% slippage */);
    const minAmountETHRaw = humanMinAmountETH.multipliedBy(bnbDecimals)
        .integerValue();
    log("Liquidate: shitvalue (without all the decimals): " + humanAmountIn);
    log("Liquidate: output " + humanMinAmountETH);

    const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 3; // 3 minutes

    let method = router.methods.swapExactTokensForETH(
        amountInRaw,
        minAmountETHRaw,
        [shitcoinAdd, wrappedBNB],
        ownAddress,
        deadline);

    var callOptions = {
        from: ownAddress, 
        gasPrice: gasPrice,
        value : 0
    }

    let gas = await method.estimateGas(callOptions);
   
    log("Liquidate: Estimated gas is " + gas);

    callOptions.gas = BigNumber(gas).multipliedBy(1.2).integerValue();
    return method
        .send(callOptions);
    /*
        .on('transactionHash', function(hash){
            log("Transaction " + hash);
        })
        .once('confirmation', function(confirmationNumber, receipt){
            log("Confirmation " + confirmationNumber);
            if (confirmationNumber == 0)
                log(receipt);
        })
        .on('receipt', function(receipt){
            log("Receipt");
            log(receipt);
        })
        .on('error', function(error, receipt) {
            log("Error");
            log(error);
            log(receipt);
        });
        */
};

const goldBalanceRaw = async () => {
    const web3 = global.web3;
    const ownAddress = global.ownAddress;

    const balanceRaw = await web3.eth.getBalance(ownAddress);

    return BigNumber(balanceRaw);
};

const log = (text, timestamp) => {
    if (timestamp == undefined)
        timestamp = new Date().getTime() / 1000;

    const formattedDate = moment.unix(timestamp).utc().tz("Europe/Bucharest").format("YYYY-MM-DD HH:mm:ss");
    console.log(formattedDate + " " + text);
}

module.exports.balanceOf = balanceOf;
module.exports.goldBalanceRaw = goldBalanceRaw;
module.exports.allowance = allowance;
module.exports.approve = approve;
module.exports.price = price;
module.exports.buy = buy;
module.exports.sell = sell;
module.exports.liquidate = liquidate;
module.exports.coinContract = coinContract;
module.exports.pairContract = uniContract;
module.exports.decimals = decimals;
module.exports.log = log;
