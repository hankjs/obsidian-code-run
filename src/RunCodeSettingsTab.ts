import { DEFAULT_VARIANTS } from "./settings";
import { App, PluginSettingTab, Setting } from "obsidian";
import RunCode from "./main";

export class RunCodeSettingsTab extends PluginSettingTab {
  plugin: RunCode;

  constructor(app: App, plugin: RunCode) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;
    containerEl.empty();

    this.containerEl.createEl("h3", {
      text: "Snippets",
    });

    new Setting(containerEl)
      .setName("Code fences")
      .setDesc("config for each language")
      .addTextArea((text) => {
        text
          .setPlaceholder(JSON.stringify(DEFAULT_VARIANTS, null, 2))
          .setValue(
            JSON.stringify(this.plugin.settings.variants, null, 2) || ""
          )
          .onChange(async (value) => {
            try {
              const newValue = JSON.parse(value);
              this.plugin.settings.variants = newValue;
              await this.plugin.saveSettings();
            } catch (e) {
              return false;
            }
          });
        text.inputEl.rows = 32;
        text.inputEl.cols = 60;
      });

    this.containerEl.createEl("h4", {
      text: "This plugin is experimental",
    });
  }
}
