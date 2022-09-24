import { ChildProcess, exec } from "child_process";
import * as os from "os";
import * as fs from "fs";
import { App, MarkdownView, Notice } from "obsidian";
import { t } from "./lang/helpers";
import { RunType, TEMP_DIR, Variant, VariantOutput } from "./settings";
import { PrefixNotice } from "./utils";
import RunCode from "./main";
import * as path from "path";
import { ConsoleModal } from "./ConsoleModal";

let uid = 0;
export class Sandbox {
  app: App;
  plugin: RunCode;
  notice?: Notice;
  output: string = "";
  childProcess?: ChildProcess;
  tmpFile?: string;
  modal?: ConsoleModal;
  tmpDir = path.join(os.tmpdir(), TEMP_DIR);

  constructor(app: App, plugin: RunCode) {
    this.app = app;
    this.plugin = plugin;
  }

  init() {
    this.output = "";
    this.notice && delete this.notice;
    this.modal && delete this.modal;

    this.childProcess?.kill();
    delete this.childProcess;
  }

  clear() {
    if (this.tmpFile) {
      fs.unlinkSync(this.tmpFile);
      delete this.tmpFile;
    }
  }

  execCode(lang: string, code: string) {
    const variant = this.getVariant(lang);
    if (!variant) {
      new PrefixNotice(`${lang} ${t("not find")}`);
      return;
    }
    const command = this.applyTemplate(variant, code);

    if (!command) return;
    const { options = { encoding: "utf8" }, outputType } = variant;
    this.init();

    try {
      this.childProcess = exec(command, options);
      this.childProcess.on("close", () => {
        this.print(outputType, "\n" + t("ChildProcess is close."));
        this.clear();
      });
      this.childProcess.stdout!.on("data", (data) => {
        this.print(outputType, data);
      });

      this.childProcess.stderr!.on("data", (error) => {
        this.print(outputType, "Error: ");
        this.print(outputType, error);
      });
    } catch (error) {
      this.print(outputType, "Error: ");
      if (error instanceof Error) {
        this.print(outputType, error.message);
      } else if (typeof error === "string") {
        this.print(outputType, error);
      }
    }
  }

  generateTmpFile(code: string, extname: string) {
    const file = path.join(this.tmpDir, `code_${Date.now()}_${uid}.${extname}`);
    fs.mkdirSync(this.tmpDir, { recursive: true });
    fs.writeFileSync(file, code, { encoding: "utf8" });
    return file;
  }

  print(outputType: VariantOutput, message: string) {
    switch (outputType) {
      case VariantOutput.notice:
        this.output += message;
        if (!this.notice) {
          this.notice = new Notice(this.output);
        } else {
          this.notice.setMessage(this.output);
        }
        break;
      case VariantOutput.modal:
        if (!this.modal) {
          this.modal = new ConsoleModal(this.app);
          this.modal.open();
        }

        this.modal.setMessage(
          message.replace(/\[\d+m/g, "").replaceAll("\x1B", "")
        );
        break;

      case VariantOutput.console:
      default:
        console.log(message);
        break;
    }
  }

  getVariant(lang: string) {
    const { variants } = this.plugin.settings;
    for (const langs in variants) {
      if (Object.prototype.hasOwnProperty.call(variants, langs)) {
        const langArr = langs.split(",").map((l) => l.toLowerCase());
        if (langArr.includes(lang)) {
          return variants[langs];
        }
      }
    }

    return null;
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

  applyTemplate(variant: Variant, code: string) {
    let active_view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (active_view == null) {
      return;
    }
    const { template, extname = "", runType = RunType.string } = variant;

    const runtimeVars: any = this.getRuntimeVars();
    if (!runtimeVars) return;

    let result = template;
    if (runType === RunType.file) {
      this.tmpFile = this.generateTmpFile(code, extname);

      result = templateByObj(result, {
        src: this.tmpFile,
        src_basename: path.basename(this.tmpFile, `.${extname}`),
        src_path: this.tmpDir,
      });
    } else if (runType === RunType.string) {
      result = template.replaceAll("{{src}}", code.replaceAll('"', '\\"'));
    }

    return templateByObj(result, runtimeVars);
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
