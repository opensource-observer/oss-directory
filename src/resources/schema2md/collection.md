# Collection Schema

```txt
collection.json
```

A collection of projects

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                             |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :--------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [collection.json](../../../out/collection.json "open original schema") |

## Collection Type

`object` ([Collection](collection.md))

# Collection Properties

| Property                       | Type     | Required | Nullable       | Defined by                                                                                     |
| :----------------------------- | :------- | :------- | :------------- | :--------------------------------------------------------------------------------------------- |
| [version](#version)            | `number` | Required | cannot be null | [Collection](collection-properties-version.md "collection.json#/properties/version")           |
| [name](#name)                  | `string` | Required | cannot be null | [Collection](collection-properties-name.md "collection.json#/properties/name")                 |
| [display\_name](#display_name) | `string` | Required | cannot be null | [Collection](collection-properties-display_name.md "collection.json#/properties/display_name") |
| [description](#description)    | `string` | Optional | cannot be null | [Collection](collection-properties-description.md "collection.json#/properties/description")   |
| [projects](#projects)          | `array`  | Required | cannot be null | [Collection](collection-properties-projects.md "collection.json#/properties/projects")         |
| [comments](#comments)          | `array`  | Optional | cannot be null | [Collection](collection-properties-comments.md "collection.json#/properties/comments")         |

## version



`version`

* is required

* Type: `number`

* cannot be null

* defined in: [Collection](collection-properties-version.md "collection.json#/properties/version")

### version Type

`number`

## name



`name`

* is required

* Type: `string`

* cannot be null

* defined in: [Collection](collection-properties-name.md "collection.json#/properties/name")

### name Type

`string`

## display\_name



`display_name`

* is required

* Type: `string`

* cannot be null

* defined in: [Collection](collection-properties-display_name.md "collection.json#/properties/display_name")

### display\_name Type

`string`

## description



`description`

* is optional

* Type: `string`

* cannot be null

* defined in: [Collection](collection-properties-description.md "collection.json#/properties/description")

### description Type

`string`

## projects



`projects`

* is required

* Type: `string[]`

* cannot be null

* defined in: [Collection](collection-properties-projects.md "collection.json#/properties/projects")

### projects Type

`string[]`

### projects Constraints

**minimum number of items**: the minimum number of items for this array is: `1`

## comments



`comments`

* is optional

* Type: `string[]`

* cannot be null

* defined in: [Collection](collection-properties-comments.md "collection.json#/properties/comments")

### comments Type

`string[]`
