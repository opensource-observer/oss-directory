# URL Schema

```txt
url.json#/properties/websites/items
```

A generic URL

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                         |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :----------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Allowed               | none                | [project.json\*](../../../out/project.json "open original schema") |

## items Type

`object` ([URL](project-properties-websites-url.md))

# items Properties

| Property    | Type     | Required | Nullable       | Defined by                                              |
| :---------- | :------- | :------- | :------------- | :------------------------------------------------------ |
| [url](#url) | `string` | Required | cannot be null | [URL](url-properties-url.md "url.json#/properties/url") |

## url



`url`

* is required

* Type: `string`

* cannot be null

* defined in: [URL](url-properties-url.md "url.json#/properties/url")

### url Type

`string`

### url Constraints

**URI**: the string must be a URI, according to [RFC 3986](https://tools.ietf.org/html/rfc3986 "check the specification")
