import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_CONSOLE } from "./types";
import { Console } from "./Console";

const noop = () => {};

export class ConsoleView extends ItemView {
  events?: { refresh: Function; close: Function };
  console: Console;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.console = new Console(this);
  }

  load() {
    this.containerEl.addClass("code-runner-container");
  }

  init(events: { refresh: Function; close: Function }) {
    this.events = events;
  }

  getViewData() {
    return "";
  }
  clear() {}

  // If clear is set, then it means we're opening a completely different file.
  setViewData(data: string, clear: boolean) {}

  getViewType() {
    return VIEW_TYPE_CONSOLE;
  }

  setStatus(str: string) {
    this.console.setStatus(str);
  }

  setMessage(message: string) {
    this.console.setMessage(message);
  }

  async onOpen() {
    if (!this.events) {
      this.events = {
        refresh: noop,
        close: noop,
      };
    }
    this.console.init(this.contentEl);
    this.console.render();
  }

  async onClose() {
    this.contentEl.empty();
    this.events?.close && this.events.close();
  }

  getDisplayText() {
    return "Console";
  }

  getIcon() {
    return "command-glyph";
  }
}
