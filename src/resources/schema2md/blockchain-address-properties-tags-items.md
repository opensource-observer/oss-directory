# Untitled undefined type in Blockchain address Schema

```txt
blockchain-address.json#/properties/tags/items
```



> Tags that classify the address. Options include:
>
> * 'eoa': Externally Owned Account
> * 'safe': Gnosis Safe or other multi-sig wallet
> * 'deployer' (or 'creator'): An address that should be monitored for contract deployment events
> * 'factory': A contract that deploys other contracts
> * 'proxy': Proxy contract
> * 'contract': A smart contract address
> * 'wallet': An address that should be monitored for funding events
> * 'bridge': An address that should be monitored for crosschain bridge-related events

| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                               |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [blockchain-address.json\*](../../../out/blockchain-address.json "open original schema") |

## items Type

unknown

## items Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation |
| :----------- | :---------- |
| `"bridge"`   |             |
| `"contract"` |             |
| `"creator"`  |             |
| `"deployer"` |             |
| `"eoa"`      |             |
| `"factory"`  |             |
| `"proxy"`    |             |
| `"safe"`     |             |
| `"wallet"`   |             |
