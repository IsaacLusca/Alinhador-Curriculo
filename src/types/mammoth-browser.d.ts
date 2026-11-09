declare module "mammoth/mammoth.browser" {
  export interface MammothMessage {
    type: "warning" | "error";
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothInput {
    arrayBuffer: ArrayBuffer;
  }

  export interface MammothConvertOptions {
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    ignoreEmptyParagraphs?: boolean;
  }

  export interface Mammoth {
    extractRawText(input: MammothInput): Promise<MammothResult>;
    convertToHtml(
      input: MammothInput,
      options?: MammothConvertOptions,
    ): Promise<MammothResult>;
  }

  const mammoth: Mammoth;
  export default mammoth;
}
