## Obsidian Code Runner Plugin

## Example

open `example` folder in Obsidian

## Default Config

```json
{
  "python": {
    "template": "python3 -c \"{{src}}\"",
    "runType": "string",
    "outputType": "notice"
  },
  "js,javascript": {
    "template": "node \"{{src}}\"",
    "extname": "js",
    "runType": "file",
    "outputType": "console"
  },
  "ts,typescript": {
    "template": "ts-node \"{{src}}\"",
    "extname": "ts",
    "runType": "file",
    "outputType": "modal"
  },
  "c": {
    "template": "gcc \"{{src}}\" -o \"{{src_path}}/{{src_basename}}\" && . \"{{src_path}}/{{src_basename}}\"",
    "extname": "c",
    "options": {
      "shell": "pwsh"
    },
    "runType": "file",
    "outputType": "modal"
  },
  "sh": {
    "template": "{{src}}",
    "outputType": "notice"
  }
}
```

### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-code-runner/`.
