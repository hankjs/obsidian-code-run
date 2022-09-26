import { App, ButtonComponent, Modal } from "obsidian";
import { t } from "./lang/helpers";
import { Console } from "./Console";

export class ConsoleModal extends Modal {
  events?: { refresh: Function; close: Function };
  console: Console;
  constructor(
    app: App,
    events: {
      refresh: Function;
      close: Function;
    }
  ) {
    super(app);
    this.events = events;
    this.console = new Console(this);
  }

  onOpen() {
    this.console.init(this.contentEl, this.titleEl);
    this.console.render();
  }

  setStatus(str: string) {
    this.console.setStatus(str);
  }

  setMessage(message: string) {
    this.console.setMessage(message);
  }

  onClose() {
    this.console.clear();
    this.events?.close();
  }
}
