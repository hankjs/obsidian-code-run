import { ButtonComponent } from "obsidian";
import { ConsoleView } from "./ConsoleView";
import { t } from "./lang/helpers";
import { ConsoleModal } from "./ConsoleModal";

export class Console {
  val!: string;
  consoleEl!: HTMLElement;
  titleStatusEl?: HTMLSpanElement;
  events?: {
    refresh?: Function;
  };
  titleEl?: HTMLElement;
  contentEl?: HTMLElement;
  ctrlsEl?: HTMLElement;

  constructor(public view: ConsoleView | ConsoleModal) {}

  init(contentEl: HTMLElement, titleEl?: HTMLElement) {
    if (!titleEl) {
      const containerEl = contentEl;
      titleEl = createDiv();
      contentEl = createDiv();
      containerEl.appendChild(titleEl);
      containerEl.appendChild(contentEl);
    }

    this.titleEl = titleEl;
    this.contentEl = contentEl;
  }

  render() {
    if (!this.titleEl || !this.contentEl) {
      console.error("Please init Console before open");
      return;
    }
    this.titleEl.setText(t("CodeRunner Console"));
    this.contentEl.addClass("code-runner-content");

    // Title status
    this.titleStatusEl = createEl("span", "code-runner-title-status");
    this.titleEl.appendChild(this.titleStatusEl);

    // Ctrls
    this.ctrlsEl = createDiv("code-runner-ctrls");
    this.clearButton(this.ctrlsEl);
    this.refreshButton(this.ctrlsEl);
    this.contentEl.appendChild(this.ctrlsEl);

    // Console
    const consoleWrap = createDiv("code-runner-console-wrap");
    this.consoleEl = createEl("pre", "code-runner-console");
    consoleWrap.appendChild(this.consoleEl);
    this.contentEl.appendChild(consoleWrap);
    this.val = "";
  }

  setStatus(str: string) {
    this.titleStatusEl?.setText(str);
  }

  setMessage(message: string, clear: boolean = false) {
    if (clear) {
      this.clear();
    }
    this.val += message;
    const code = createEl("code", {
      text: message,
      cls: "code-runner-console-code",
    });
    this.consoleEl.appendChild(code);
    code.scrollIntoView({ behavior: "smooth" });
  }

  clear() {
    this.val = "";
    this.consoleEl.empty();
  }

  clearButton(el: HTMLElement) {
    const btn = new ButtonComponent(el);
    btn.setButtonText(t("Clear"));
    btn.setClass("code-runner-console-btn");
    btn.onClick(() => {
      this.clear();
    });
  }

  refreshButton(el: HTMLElement) {
    const btn = new ButtonComponent(el);
    btn.setButtonText(t("Restart"));
    btn.setClass("code-runner-console-btn");
    btn.onClick(() => {
      this.view.events?.refresh && this.view.events?.refresh();
    });
  }
}
