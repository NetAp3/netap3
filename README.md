## NetAP3 - NETworked Automated Program for Positions Placement

This is a learning project covering:

* modern Javascript and hopefully Typescript
* node ecosystem
* React
* Ethereum Virtual Machine (EVM) contract basics
* web3

Turns out the mechanics of programatic EVM are not that complicated,
just hidden behind complex terminology.

Don't use it for anything stupid.

### Examples

# Price

Run `node scripts/price.js` to read the a current pair price. It should output something like:

```
2021-04-04 14:09:38 Loading swap contract 0x1b96b92314c44b159149f7e0303511fb2fc4774f
2021-04-04 14:09:39 Loading coin contract 0xe9e7cea3dedca5984780bafc599bd69add087d56
2021-04-04 14:09:40 Loading decimals 0xe9e7cea3dedca5984780bafc599bd69add087d56 1000000000000000000
2021-04-04 14:09:40 Loading coin contract 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c
2021-04-04 14:09:40 Loading decimals 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c 1000000000000000000
2021-04-04 14:09:40 price reserve0 510280.425627774603729643 reserve1 173557919.954260812606229537
340.1226291225
```

Note that the output is just the pair ratio and thus an approximation of how much a buy/sell
would get since that depends on the liquidity and your own impact on that liquidity.