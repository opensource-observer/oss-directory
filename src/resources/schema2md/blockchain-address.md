# Blockchain address Schema

```txt
blockchain-address.json
```

An address on a blockchain

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                             |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [blockchain-address.json](../../../out/blockchain-address.json "open original schema") |

## Blockchain address Type

`object` ([Blockchain address](blockchain-address.md))

# Blockchain address Properties

| Property              | Type     | Required | Nullable       | Defined by                                                                                                     |
| :-------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------- |
| [address](#address)   | `string` | Required | cannot be null | [Blockchain address](blockchain-address-properties-address.md "blockchain-address.json#/properties/address")   |
| [tags](#tags)         | `array`  | Required | cannot be null | [Blockchain address](blockchain-address-properties-tags.md "blockchain-address.json#/properties/tags")         |
| [networks](#networks) | `array`  | Required | cannot be null | [Blockchain address](blockchain-address-properties-networks.md "blockchain-address.json#/properties/networks") |
| [name](#name)         | `string` | Optional | cannot be null | [Blockchain address](blockchain-address-properties-name.md "blockchain-address.json#/properties/name")         |

## address



`address`

* is required

* Type: `string`

* cannot be null

* defined in: [Blockchain address](blockchain-address-properties-address.md "blockchain-address.json#/properties/address")

### address Type

`string`

## tags



`tags`

* is required

* Type: unknown\[]

* cannot be null

* defined in: [Blockchain address](blockchain-address-properties-tags.md "blockchain-address.json#/properties/tags")

### tags Type

unknown\[]

### tags Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## networks



`networks`

* is required

* Type: unknown\[]

* cannot be null

* defined in: [Blockchain address](blockchain-address-properties-networks.md "blockchain-address.json#/properties/networks")

### networks Type

unknown\[]

### networks Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## name



`name`

* is optional

* Type: `string`

* cannot be null

* defined in: [Blockchain address](blockchain-address-properties-name.md "blockchain-address.json#/properties/name")

### name Type

`string`
