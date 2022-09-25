```js
function add(x, y) {
	return x + y
}
```
^add

## Same File

```js
{{[[#^add]]}}

const addOne = (x) => add(x, 1)
```
^randomEmbedsId

## ESModule

```js
export function add(x, y) {
	return x + y
}
```

^7d02cc

## ESModule nest


```js
import { add } from "{{[[#^7d02cc]]|mjs --relative}}"

export const addOne = (x) => add(x, 1)
```

^911dc7
