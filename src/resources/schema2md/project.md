# Project Schema

```txt
project.json
```

A project is a collection of artifacts

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                       |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [project.json](../../../out/project.json "open original schema") |

## Project Type

`object` ([Project](project.md))

# Project Properties

| Property                             | Type     | Required | Nullable       | Defined by                                                                                  |
| :----------------------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------ |
| [version](#version)                  | `number` | Required | cannot be null | [Project](project-properties-version.md "project.json#/properties/version")                 |
| [name](#name)                        | `string` | Required | cannot be null | [Project](project-properties-name.md "project.json#/properties/name")                       |
| [display\_name](#display_name)       | `string` | Required | cannot be null | [Project](project-properties-display_name.md "project.json#/properties/display_name")       |
| [description](#description)          | `string` | Optional | cannot be null | [Project](project-properties-description.md "project.json#/properties/description")         |
| [websites](#websites)                | `array`  | Optional | cannot be null | [Project](project-properties-websites.md "project.json#/properties/websites")               |
| [social](#social)                    | `object` | Optional | cannot be null | [Project](project-properties-social-profile.md "social-profile.json#/properties/social")    |
| [github](#github)                    | `array`  | Optional | cannot be null | [Project](project-properties-github.md "project.json#/properties/github")                   |
| [npm](#npm)                          | `array`  | Optional | cannot be null | [Project](project-properties-npm.md "project.json#/properties/npm")                         |
| [crates](#crates)                    | `array`  | Optional | cannot be null | [Project](project-properties-crates.md "project.json#/properties/crates")                   |
| [pypi](#pypi)                        | `array`  | Optional | cannot be null | [Project](project-properties-pypi.md "project.json#/properties/pypi")                       |
| [go](#go)                            | `array`  | Optional | cannot be null | [Project](project-properties-go.md "project.json#/properties/go")                           |
| [open\_collective](#open_collective) | `array`  | Optional | cannot be null | [Project](project-properties-open_collective.md "project.json#/properties/open_collective") |
| [blockchain](#blockchain)            | `array`  | Optional | cannot be null | [Project](project-properties-blockchain.md "project.json#/properties/blockchain")           |
| [defillama](#defillama)              | `array`  | Optional | cannot be null | [Project](project-properties-defillama.md "project.json#/properties/defillama")             |
| [comments](#comments)                | `array`  | Optional | cannot be null | [Project](project-properties-comments.md "project.json#/properties/comments")               |

## version



`version`

* is required

* Type: `number`

* cannot be null

* defined in: [Project](project-properties-version.md "project.json#/properties/version")

### version Type

`number`

## name



`name`

* is required

* Type: `string`

* cannot be null

* defined in: [Project](project-properties-name.md "project.json#/properties/name")

### name Type

`string`

## display\_name



`display_name`

* is required

* Type: `string`

* cannot be null

* defined in: [Project](project-properties-display_name.md "project.json#/properties/display_name")

### display\_name Type

`string`

## description



`description`

* is optional

* Type: `string`

* cannot be null

* defined in: [Project](project-properties-description.md "project.json#/properties/description")

### description Type

`string`

## websites



`websites`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-websites.md "project.json#/properties/websites")

### websites Type

`object[]` ([URL](project-properties-websites-url.md))

## social

All social profile

`social`

* is optional

* Type: `object` ([Social Profile](project-properties-social-profile.md))

* cannot be null

* defined in: [Project](project-properties-social-profile.md "social-profile.json#/properties/social")

### social Type

`object` ([Social Profile](project-properties-social-profile.md))

## github



`github`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-github.md "project.json#/properties/github")

### github Type

`object[]` ([URL](project-properties-websites-url.md))

## npm



`npm`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-npm.md "project.json#/properties/npm")

### npm Type

`object[]` ([URL](project-properties-websites-url.md))

## crates



`crates`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-crates.md "project.json#/properties/crates")

### crates Type

`object[]` ([URL](project-properties-websites-url.md))

## pypi



`pypi`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-pypi.md "project.json#/properties/pypi")

### pypi Type

`object[]` ([URL](project-properties-websites-url.md))

## go



`go`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-go.md "project.json#/properties/go")

### go Type

`object[]` ([URL](project-properties-websites-url.md))

## open\_collective



`open_collective`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-open_collective.md "project.json#/properties/open_collective")

### open\_collective Type

`object[]` ([URL](project-properties-websites-url.md))

## blockchain



`blockchain`

* is optional

* Type: `object[]` ([Blockchain address](project-properties-blockchain-blockchain-address.md))

* cannot be null

* defined in: [Project](project-properties-blockchain.md "project.json#/properties/blockchain")

### blockchain Type

`object[]` ([Blockchain address](project-properties-blockchain-blockchain-address.md))

## defillama



`defillama`

* is optional

* Type: `object[]` ([URL](project-properties-websites-url.md))

* cannot be null

* defined in: [Project](project-properties-defillama.md "project.json#/properties/defillama")

### defillama Type

`object[]` ([URL](project-properties-websites-url.md))

## comments



`comments`

* is optional

* Type: `string[]`

* cannot be null

* defined in: [Project](project-properties-comments.md "project.json#/properties/comments")

### comments Type

`string[]`
