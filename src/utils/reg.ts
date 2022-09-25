export const codeBlockReg = /```(.*)\s((.|\s)*)\s```/;
export const includePlaceholderReg =
  /{{\[\[(([^\[{}\]]*)(#[^\[{}\]]*))\]\] ?\|?([^\[{}\]]*)}}/;
export const includeOptionsReg = /([^ ]*)( ((-.*)|(--.*))*)?/;
