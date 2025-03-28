

export interface MessageConfig{
  channel: string;
  text: string;
}

export interface MessagesConfig {
  [title: string]: MessageConfig;
}