```js
{{[[Export#^add]]}}

console.log(add(1, 2)) // 3
```

## Nest embeds

```js
{{[[Export#^randomEmbedsId]]}}

console.log(add(1, 2)) // 3
console.log(addOne(2)) // 3
```

## Embeds to file

```js
import { add } from "{{[[Export#^7d02cc]]|mjs -r -f}}"

console.log(add(1, 2)) // 3
```

## Nest file


```js
import { add } from "{{[[Export#^7d02cc]]|mjs -r}}"
import { addOne } from "{{[[Export#^911dc7]]|mjs --relative}}"

console.log(add(1, 2)) // 3
console.log(addOne(2)) // 3
```
