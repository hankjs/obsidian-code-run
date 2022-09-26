export const TEMP_DIR = "obsidian_code_run";
import { RunType, Variant, VariantOutput } from "./types";

export const DEFAULT_VARIANTS: Record<string, Variant> = {
  python: {
    template: 'python3 -c "{{src}}"',
    runType: RunType.string,
    outputType: VariantOutput.notice,
  },
  "js,javascript": {
    template: 'node "{{src}}"',
    ext: "mjs",
    runType: RunType.file,
    outputType: VariantOutput.view,
  },
  "ts,typescript": {
    template: 'ts-node "{{src}}"',
    ext: "ts",
    options: {
      cwd: ["{{vault_path}}", "./javascript"],
    },
    runType: RunType.file,
    outputType: VariantOutput.modal,
  },
  c: {
    template:
      'gcc "{{src}}" -o "{{src_path}}/{{src_basename}}" && . "{{src_path}}/{{src_basename}}"',
    ext: "c",
    options: {
      shell: "pwsh",
    },
    runType: RunType.file,
    outputType: VariantOutput.modal,
  },
  sh: {
    template: "{{src}}",
    outputType: VariantOutput.notice,
  },
};
