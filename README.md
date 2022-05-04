[![LivepeerJS](https://user-images.githubusercontent.com/555740/117340053-78210e80-ae6e-11eb-892c-d98085fe6824.png)](https://livepeer.github.io/livepeerjs/)

# Livepeer Explorer

## Getting started

1. Rename .env.example to .env
2. Install it and run:

```bash
yarn
yarn dev
```

## Developing on Arbitrum Rinkeby

Set `NEXT_PUBLIC_NETWORK` to `ARBITRUM_RINKEBY` inside `.env`

## Testing LIPs

In order to test LIPs, you will need to set the `NEXT_PUBLIC_GITHUB_LIP_NAMESPACE` variable to your Github username and [fork the LIPs](https://github.com/livepeer/LIPs/fork) repo. This can then be used to test LIPs locally.
