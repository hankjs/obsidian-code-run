export const TEMP_DIR = "obsidian_code_run";
import { ExecOptions } from "child_process";
export interface Variant {
  options?: ExecOptions & { encoding?: BufferEncoding };
  template: string;
  extname?: string;
  runType?: RunType;
  outputType: VariantOutput;
}

export enum RunType {
  string = "string",
  file = "file",
}

export enum VariantOutput {
  notice = "notice",
  modal = "modal",
  console = "console",
}

export enum TemplatePlaceholder {}

export const DEFAULT_VARIANTS: Record<string, Variant> = {
  python: {
    template: 'python3 -c "{{src}}"',
    runType: RunType.string,
    outputType: VariantOutput.notice,
  },
  "js,javascript": {
    template: 'node "{{src}}"',
    extname: "js",
    runType: RunType.file,
    outputType: VariantOutput.console,
  },
  "ts,typescript": {
    template: 'ts-node "{{src}}"',
    extname: "ts",
    runType: RunType.file,
    outputType: VariantOutput.modal,
  },
  c: {
    template:
      'gcc "{{src}}" -o "{{src_path}}/{{src_basename}}" && . "{{src_path}}/{{src_basename}}"',
    extname: "c",
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
