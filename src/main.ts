import { DEFAULT_VARIANTS, Variant } from "./settings";
import "./styles.scss";

import { Plugin, PluginManifest, App } from "obsidian";
import { getCodeByPreviewMode, getCodeByReadMode } from "./utils";
import { RunCodeSettingsTab } from "./RunCodeSettingsTab";
import { Sandbox } from "./Sandbox";

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
    switch (target.tagName.toLowerCase()) {
      case "div":
        if (target.classList.contains("HyperMD-codeblock-end")) {
          const processed = getCodeByPreviewMode(target);
          this.sandbox.execCode(processed.lang.toLowerCase(), processed.code);
        }
        break;
      case "pre":
        if (
          Array.from(target.classList).findIndex((name) =>
            name.match(/language-.*/)
          ) > -1
        ) {
          const processed = getCodeByReadMode(target);
          this.sandbox.execCode(processed.lang.toLowerCase(), processed.code);
        }
        break;

      default:
        break;
    }
  }
}
