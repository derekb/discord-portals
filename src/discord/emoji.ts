import { BaseGuildEmojiManager, Client, GuildEmoji } from 'discord.js';

export interface EmojiProvider {
  getByName(name: string): GuildEmoji | undefined;
}

export class DiscordEmojiProvider implements EmojiProvider {
  private readonly emojiCache: BaseGuildEmojiManager;

  constructor(client: Client) {
    this.emojiCache = client.emojis;
  }

  getByName(name: string): GuildEmoji | undefined {
    return this.emojiCache.cache.find(emoji => emoji.name === name);
  }

  public static from(client: Client): EmojiProvider {
    return new DiscordEmojiProvider(client);
  }
}
