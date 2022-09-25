
```ts
console.log(1)  

setTimeout(() => {
	console.log(2)
}, 2000)
```

Error code

```javascript
console.log(1);
cfonsole.log(1)
```

Setup work dir

## config

```json
"ts,typescript": {
  "options": {
	  "cwd": "{{vault_path}}/javascript"
  }
},
```

```ts
console.log(process.cwd())
import _ from "lodash"
console.log(_.now())
```
