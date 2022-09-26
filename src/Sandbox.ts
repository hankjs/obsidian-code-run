import { ChildProcess, exec } from "child_process";
import { App, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import { t } from "./lang/helpers";
import { Variant, VariantOutput, VIEW_TYPE_CONSOLE } from "./types";
import { PrefixNotice } from "./utils";
import RunCode from "./main";
import { ConsoleModal } from "./ConsoleModal";
import { Parse } from "./Parse";
import { ConsoleView } from "./ConsoleView";

export class Sandbox {
  app: App;
  plugin: RunCode;
  notice?: Notice;
  output: string = "";
  childProcess?: ChildProcess;
  modal?: ConsoleModal;
  parse: Parse;
  lang?: string;
  code?: string;
  variant?: Variant;
  view?: MarkdownView;
  consoleView?: ConsoleView;
  leaf?: WorkspaceLeaf;
  eventKey: "ctrl" | "alt" | "" = "";

  constructor(app: App, plugin: RunCode) {
    this.app = app;
    this.plugin = plugin;
    this.parse = new Parse(app, plugin);
  }

  init() {
    this.output = "";
    this.notice && delete this.notice;
    this.eventKey = "";
    delete this.view;
    delete this.lang;
    delete this.code;
    delete this.variant;

    this.childProcess?.kill();
    delete this.childProcess;
  }

  async execCode(
    lang: string,
    code: string,
    view: MarkdownView,
    eventKey: "ctrl" | "alt" | ""
  ) {
    let variant = this.getVariant(lang);
    if (!variant) {
      new PrefixNotice(`${lang} ${t("not find")}`);
      return;
    }
    if (this.eventKey) {
      switch (this.eventKey) {
        case "alt":
          variant = {
            ...variant,
            template: variant.altTemplate || variant.template,
          };
          break;

        case "ctrl":
        default:
          variant = {
            ...variant,
            template: variant.ctrlTemplate || variant.template,
          };
          break;
      }
    }
    this.init();
    this.eventKey = eventKey;
    this.view = view;
    this.lang = lang;
    this.code = code;
    this.variant = variant;

    const { outputType } = variant;
    await this.setStatus(outputType, "[running] generate code...");
    const parsed = await this.parse.applyTemplate(variant, code, view);
    if (!parsed) {
      this.finished(outputType);
      return;
    }
    this.setStatus(outputType, "[running] waiting process stdout");

    const { command, options } = parsed;
    console.log("command: \n", command);

    try {
      this.childProcess = exec(command, options);

      this.childProcess.on("error", (data) => {
        console.log("this.childProcess.error", data);
        this.print(outputType, data.message);
      });
      this.childProcess.on("close", () => {
        this.finished(outputType);
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

  finished(outputType: VariantOutput) {
    this.setStatus(outputType, `[finished] ${t("ChildProcess is close.")}`);
  }

  refresh() {
    if (!this.view) {
      return;
    }
    this.execCode(this.lang || "", this.code || "", this.view, this.eventKey);
  }

  print(outputType: VariantOutput, message: string) {
    message = message.replace(/\[\d+m/g, "").replaceAll("\x1B", "");
    switch (outputType) {
      case VariantOutput.notice:
        this.output += message;
        this.notice && this.notice.setMessage(this.output);
        break;
      case VariantOutput.modal:
        this.modal && this.modal.setMessage(message);
        break;
      case VariantOutput.view:
        this.consoleView && this.consoleView.setMessage(message);
        break;

      case VariantOutput.console:
      default:
        console.log(message);
        break;
    }
  }

  async setStatus(outputType: VariantOutput, message: string) {
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
          this.modal = new ConsoleModal(this.app, {
            refresh: this.refresh.bind(this),
            close: () => {
              delete this.modal;
            },
          });
          this.modal.open();
        }

        this.modal.setStatus(message);
        break;
      case VariantOutput.view:
        if (!this.consoleView) {
          const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CONSOLE);
          const [leaf] = leaves;
          if (leaf) {
            this.consoleView = leaf.view as ConsoleView;
            this.consoleView.init({
              refresh: this.refresh.bind(this),
              close: () => {
                delete this.consoleView;
              },
            });
          }
        }
        if (!this.consoleView) {
          this.leaf = this.app.workspace.getLeaf("split", "vertical");

          this.consoleView = new ConsoleView(this.leaf);
          this.consoleView.init({
            refresh: this.refresh.bind(this),
            close: () => {
              delete this.consoleView;
            },
          });
          await this.leaf.open(this.consoleView);
        }

        this.consoleView.setStatus(message);
        break;

      case VariantOutput.console:
      default:
        console.log(message);
        break;
    }

    return Promise.resolve();
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
