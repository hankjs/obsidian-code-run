import { ExecOptions } from "child_process";

export const VIEW_TYPE_CONSOLE = "VIEW_TYPE_CONSOLE";

export enum SourceType {
  code = "code",
  file = "file",
}

export interface Source {
  type: SourceType;
  src: string;
}

export interface Variant {
  options?: Omit<ExecOptions, "cwd"> & {
    encoding?: BufferEncoding;
    cwd?: string[] | string;
  };
  template: string;
  ctrlTemplate?: string;
  altTemplate?: string;
  ext?: string;
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
  view = "view",
}

export enum TemplatePlaceholder {}
