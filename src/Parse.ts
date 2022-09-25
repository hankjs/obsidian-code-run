import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ExecOptions } from "child_process";
import {
  App,
  MarkdownView,
  parseLinktext,
  resolveSubpath,
  TFile,
} from "obsidian";
import RunCode from "./main";
import { TEMP_DIR } from "./settings";
import { RunType, Source, SourceType, Variant } from "./types";
import { includePlaceholderReg } from "./utils/reg";
import { parseCodeBlock } from "./utils";

let uid = 0;
export const entrySymbol = Symbol("entry");
export class Parse {
  tmpFile = new Set<string>();
  tmpDir = path.join(os.tmpdir(), TEMP_DIR);
  sourceMap = new Map<string | symbol, Source>();

  constructor(public app: App, public plugin: RunCode) {}

  clear() {
    this.sourceMap.clear();
    if (this.tmpFile.size > 0) {
      for (const path of this.tmpFile) {
        fs.unlinkSync(path);
      }
      this.tmpFile.clear();
    }
  }

  generateTmpFile(code: string, ext: string, cwd?: string) {
    const file = path.join(
      cwd ? cwd : this.tmpDir,
      `code_runner_${Date.now()}_${uid++}.${ext}`
    );
    fs.mkdirSync(cwd ? cwd : this.tmpDir, { recursive: true });
    fs.writeFileSync(file, code, { encoding: "utf8" });
    return file;
  }

  getRuntimeVars() {
    let active_view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active_view == null) {
      return null;
    }

    let { basePath } = this.app.vault.adapter as any;
    let folder = active_view.file.parent.path;
    let fileName = active_view.file.name;

    return {
      vault_path: basePath,
      folder: folder,
      file_name: fileName,
      file_path: path.join(basePath, folder, fileName),
    };
  }

  async applyTemplate(
    variant: Variant,
    code: string
  ): Promise<{
    command: string;
    options: ExecOptions;
  } | void> {
    let active_view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active_view == null) {
      return;
    }
    this.clear();
    const {
      options = { encoding: "utf8" },
      template,
      ext = "",
      runType = RunType.string,
    } = variant;

    const runtimeVars: any = this.getRuntimeVars();
    if (!runtimeVars) return;
    const cwdPaths = ([] as string[])
      .concat(options?.cwd ?? "")
      .map((str) => templateByObj(str, runtimeVars));
    const cwd = variant.options?.cwd ? path.join(...cwdPaths) : "";
    options.cwd = cwd;

    const parsedCode = await this.resolveDependencies(
      variant,
      code,
      active_view.file
    );
    if (!parsedCode) return;

    let result = template;
    if (runType === RunType.file) {
      const entryPath = this.generateTmpFile(parsedCode, ext, cwd);
      this.sourceMap.set(entrySymbol, {
        type: SourceType.file,
        src: entryPath,
      });
      this.tmpFile.add(entryPath);

      result = templateByObj(result, {
        src: entryPath,
        src_basename: path.basename(entryPath, `.${ext}`),
        src_path: this.tmpDir,
      });
    } else if (runType === RunType.string) {
      result = template.replaceAll(
        "{{src}}",
        parsedCode.replaceAll('"', '\\"')
      );
    }

    return {
      command: templateByObj(result, runtimeVars),
      options: options as ExecOptions,
    };
  }

  get activeView() {
    return this.app.workspace.getActiveViewOfType(MarkdownView);
  }

  async resolveDependencies(variant: Variant, code: string, file: TFile) {
    const reg = new RegExp(includePlaceholderReg, "g");
    const matches = [...code.matchAll(reg)];
    if (matches.length === 0) {
      return code;
    }

    const { metadataCache } = this.app;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      // ['{{[[Export#^add]]}}', 'Export#^add', '', index: 0, input: '{{[[Export#^add]]}}{{[[Export#^add2]]}}', groups: undefined]
      const [
        // {{[[Export#^add]]}} | ts
        raw,
        // Export#^add
        linkMatches,
        // Export
        link,
        // #^add
        sub,
        // ts
        options,
      ] = match;
      const sourceType = options ? SourceType.file : SourceType.code;
      const linkTrimmed = link ? link.trim() : file.basename;
      const subTrimmed = sub.trim();
      const linktext = linkTrimmed + subTrimmed;
      if (this.sourceMap.has(raw)) {
        continue;
      }

      const linkObj = parseLinktext(linktext);
      const matchFile = metadataCache.getFirstLinkpathDest(
        linkObj.path,
        file.path
      );
      if (!matchFile) {
        continue;
      }

      const cache = metadataCache.getCache(matchFile.path);
      if (!cache) {
        this.sourceMap.set(raw, {
          type: sourceType,
          src: "",
        });
        continue;
      }
      const subpathResult = resolveSubpath(cache, linkObj.subpath);
      const source = await this.app.vault.cachedRead(matchFile);
      const codeBlock = parseCodeBlock(source, subpathResult);
      if (!codeBlock) {
        continue;
      }

      const parsedCode = await this.resolveDependencies(
        variant,
        codeBlock.code,
        matchFile
      );
      let src = parsedCode;

      if (options && sourceType === SourceType.file) {
        const [ext, ...flags] = options.split(" -");
        const cwd = variant.options?.cwd
          ? (variant.options?.cwd as string)
          : this.tmpDir;
        src = this.generateTmpFile(parsedCode, ext, cwd);
        this.tmpFile.add(src);
        flags.forEach((flag) => {
          switch (flag) {
            case "r":
            case "-relative":
              src = `./${path.relative(cwd, src)}`;
              break;

            default:
              console.log(`${linktext} unknown flag: ${flag}`);
              break;
          }
        });
      }

      code = code.replaceAll(raw, src);
      this.sourceMap.set(raw, {
        type: sourceType,
        src,
      });
    } // for matches
    return code;
  }
}

function templateByObj(str: string, obj: Record<string, any>) {
  let result = str;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result = result.replaceAll(`{{${key}}}`, obj[key]);
    }
  }

  return result;
}
