import { Notice } from "obsidian";
import { t } from "src/lang/helpers";

export class PrefixNotice extends Notice {
  constructor(message: string) {
    super(`${t("CodeRunner")}: ${message}`);
  }
}
