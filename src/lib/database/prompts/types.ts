export const PromptsDBName = 'promptsDatabase';

export enum AspectRatio {
  square = '1:1',
  portrait = '3:4',
  desktop = '16:9',
  mobile = '9:16'
}

export type PromptPart = {
  id?: number;
  promptId?: Prompt['id'];
  text: string;
  weight: number;
};

export type PromptSettings = {
  ar?: AspectRatio;
  parts: Array<PromptPart['id']>;
};

export type Prompt = {
  id?: number;
  name: string;
  settings: PromptSettings;
};

export type PromptsDB = Prompt;
