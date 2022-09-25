import { ChildProcess, exec } from "child_process";
import { App, Notice, parseLinktext, resolveSubpath } from "obsidian";
import { t } from "./lang/helpers";
import { VariantOutput } from "./types";
import { PrefixNotice } from "./utils";
import RunCode from "./main";
import { ConsoleModal } from "./ConsoleModal";
import { Parse } from "./Parse";

export class Sandbox {
  app: App;
  plugin: RunCode;
  notice?: Notice;
  output: string = "";
  childProcess?: ChildProcess;
  modal?: ConsoleModal;
  parse: Parse;

  constructor(app: App, plugin: RunCode) {
    this.app = app;
    this.plugin = plugin;
    this.parse = new Parse(app, plugin);
  }

  init() {
    this.output = "";
    this.notice && delete this.notice;
    this.modal && delete this.modal;

    this.childProcess?.kill();
    delete this.childProcess;
  }

  async execCode(lang: string, code: string) {
    const variant = this.getVariant(lang);
    if (!variant) {
      new PrefixNotice(`${lang} ${t("not find")}`);
      return;
    }
    this.init();
    const { outputType } = variant;
    this.setStatus(outputType, "[running] generate code...");
    const parsed = await this.parse.applyTemplate(variant, code);
    this.setStatus(outputType, "[running] waiting process stdout");

    if (!parsed) return;
    const { command, options } = parsed;
    console.log("command: \n", command);

    try {
      this.childProcess = exec(command, options);

      this.childProcess.on("error", (data) => {
        console.log("this.childProcess.error", data);
        this.print(outputType, data.message);
      });
      this.childProcess.on("close", () => {
        this.setStatus(outputType, `[close] ${t("ChildProcess is close.")}`);
        this.parse.clear();
      });
      this.childProcess.stdout!.on("data", (data) => {
        console.log("this.childProcess.stdout", data);
        this.print(outputType, data);
      });

      this.childProcess.stderr!.on("data", (error) => {
        console.log("this.childProcess.stderr", error);
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

  setStatus(outputType: VariantOutput, message: string) {
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

        this.modal.setStatus(message);
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
}
