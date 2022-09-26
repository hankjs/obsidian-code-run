import {
  Plugin,
  PluginManifest,
  App,
  MarkdownView,
  WorkspaceLeaf,
} from "obsidian";
import { Variant, VIEW_TYPE_CONSOLE } from "./types";
import { RunCodeSettingsTab } from "./SettingsTab";
import { Sandbox } from "./Sandbox";

import { DEFAULT_VARIANTS } from "./settings";
import { getCodeByPreviewMode, getCodeByReadMode } from "./utils";

import "./styles.scss";
import { ConsoleView } from "./ConsoleView";

interface RunCodeHTMLElement extends HTMLElement {
  __runCodeRegister?: boolean;
}

interface RunCodeSettings {
  variants: Record<string, Variant>;
}

const DEFAULT_SETTINGS: RunCodeSettings = {
  variants: DEFAULT_VARIANTS,
};

export default class RunCode extends Plugin {
  // This field stores your plugin settings.
  settings: RunCodeSettings = DEFAULT_SETTINGS;
  sandbox: Sandbox;

  constructor(app: App, pluginManifest: PluginManifest) {
    super(app, pluginManifest);
    this.sandbox = new Sandbox(app, this);
  }

  async loadSettings() {
    this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onload() {
    console.log("Loading Snippets-plugin");
    await this.loadSettings();

    this.addSettingTab(new RunCodeSettingsTab(this.app, this));
    this.registerView(
      VIEW_TYPE_CONSOLE,
      (leaf: WorkspaceLeaf) => new ConsoleView(leaf)
    );

    // this.addCommand({
    //   id: "snippets-plugin",
    //   name: "Run",
    //   callback: () => this.runSnippet(),
    //   hotkeys: [
    //     {
    //       modifiers: ["Mod", "Shift"],
    //       key: "Enter",
    //     },
    //   ],
    // });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf) {
          return;
        }
        this.registerContainerClick(leaf.view.containerEl);
      })
    );

    // Add the view to the right sidebar
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.app.workspace.onLayoutReady(this.initLeaf.bind(this));
    }
  }

  initLeaf() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CONSOLE).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_CONSOLE,
    });
  }

  registerContainerClick(el: RunCodeHTMLElement) {
    if (el.__runCodeRegister) {
      return;
    }
    el.__runCodeRegister = true;
    el.addEventListener("click", this.containerClick.bind(this));
  }

  containerClick(event: MouseEvent) {
    const target = event.target as RunCodeHTMLElement;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return;
    }
    switch (target.tagName.toLowerCase()) {
      case "div":
        if (target.classList.contains("HyperMD-codeblock-end")) {
          const processed = getCodeByPreviewMode(target);
          this.sandbox.execCode(
            processed.lang.toLowerCase(),
            processed.code,
            view,
            event.ctrlKey ? "ctrl" : event.altKey ? "alt" : ""
          );
        }
        break;
      case "pre":
        if (
          Array.from(target.classList).findIndex((name) =>
            name.match(/language-.*/)
          ) > -1
        ) {
          const processed = getCodeByReadMode(target);
          this.sandbox.execCode(
            processed.lang.toLowerCase(),
            processed.code,
            view,
            event.ctrlKey ? "ctrl" : event.altKey ? "alt" : ""
          );
        }
        break;

      default:
        break;
    }
  }
}
