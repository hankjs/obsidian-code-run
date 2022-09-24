import { App, ButtonComponent, Modal } from "obsidian";
import { t } from "./lang/helpers";

export class ConsoleModal extends Modal {
  val!: string;
  consoleEl!: HTMLElement;
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    this.titleEl.setText(t("CodeRunner Console"));

    this.clearButton(this.contentEl);

    this.consoleEl = createEl("pre");
    this.consoleEl.addClass("code-runner-console");
    this.contentEl.appendChild(this.consoleEl);
    this.val = "";
  }

  setMessage(message: string) {
    this.val += message;
    this.consoleEl.setText(this.val);
  }

  onClose() {
    this.val = "";
  }

  clearButton(el: HTMLElement) {
    const btn = new ButtonComponent(el);
    btn.setButtonText(t("Clear"));
    btn.onClick(() => {
      this.val = "";
      this.setMessage("");
    });
  }
}
