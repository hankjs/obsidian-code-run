export interface CodeParsed {
  lang: string;
  code: string;
}

export function getCodeByPreviewMode(el: HTMLElement): CodeParsed {
  let code = "";
  // HyperMD-codeblock
  let preEl = el.previousElementSibling as HTMLElement;
  while (
    preEl?.classList.contains("HyperMD-codeblock") &&
    !preEl?.classList.contains("HyperMD-codeblock-begin")
  ) {
    // HyperMD-codeblock
    code = preEl.innerText + "\n" + code;
    preEl = preEl.previousElementSibling as HTMLElement;
  }
  // HyperMD-codeblock-begin
  const lang = preEl.innerText;

  return {
    lang: lang.replace(/^```/, ""),
    code: code.replace(/```$/, "").replaceAll(String.fromCharCode(8203), ""),
  };
}

export function getCodeByReadMode(el: HTMLElement): CodeParsed {
  const codeEl = el.firstElementChild as HTMLElement;
  let code = codeEl.innerText;
  const matches = /language-(\w*)/.exec(el.className);
  if (!matches) {
    return {
      lang: "",
      code,
    };
  }

  const [, lang] = matches;

  return {
    lang,
    code,
  };
}
