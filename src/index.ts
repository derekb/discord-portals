import {
  Client,
  Message,
  GuildMember,
  TextChannel,
  Channel,
  MessageEmbedOptions,
} from 'discord.js';
import { DiscordEmojiProvider, EmojiProvider } from './discord/emoji';

export interface Portal {
  invoker: GuildMember;
  to: TextChannel;
  from: TextChannel;
}

export function createPortal(msg: Message, client: Client): Portal | null {
  const content = msg.content;
  const invoker = msg.member!;

  let originChan = msg.channel;
  let tag = content.split('!portal')[1];
  let matches = tag.match(/<#(.+?)>/) ?? [];

  if (matches.length !== 2) {
    console.log(`Got ${matches.length} matches: ${matches}`);
    return null;
  }

  let destId = matches[1];
  let destChan: TextChannel = client.channels.resolve(destId) as TextChannel;

  if (!destChan || !(destChan as Channel).isText()) {
    console.log(`Destination ${destChan.name} is not a text channel.`);
    return null;
  }

  if (destChan.name === (originChan as TextChannel).name) {
    console.log("Can't portal to the origin channel.");
    return null;
  }

  const portal: Portal = {
    to: destChan,
    from: originChan as TextChannel,
    invoker: invoker!,
  };

  return portal;
}

export interface PortalOpener {
  open(portal: Portal): Promise<void>;
}

export class SimplePortalOpener implements PortalOpener {
  private readonly emojis: EmojiProvider;

  async open(portal: Portal): Promise<void> {
    let portalIn = this.emojis.getByName('portalin')!;
    let portalOut = this.emojis.getByName('portalout')!;

    portal.to.send({
      content: `${portalIn.toString()} <= ${portal.to.toString()}`,
    });
    portal.from.send({
      content: `${portalOut.toString()} => ${portal.from.toString()}`,
    });

    return;
  }

  constructor(client: Client) {
    this.emojis = DiscordEmojiProvider.from(client);
  }
}

export class CardPortalOpener implements PortalOpener {
  private readonly emojis: EmojiProvider;

  async open(portal: Portal): Promise<void> {
    let outEmbed = this.getPortalEmbed(portal, 'out');
    let inEmbed = this.getPortalEmbed(portal, 'in');

    let portalToMessage = await portal.to.send({ embeds: [inEmbed] });
    let portalFromMessage = await portal.from.send({ embeds: [outEmbed] });

    let linkedInEmbed = this.updatePortalEmbed(portalFromMessage, inEmbed);
    let linkedOutEmbed = this.updatePortalEmbed(portalToMessage, outEmbed);

    portalToMessage.edit({ embeds: [linkedInEmbed] });
    portalFromMessage.edit({ embeds: [linkedOutEmbed] });

    return;
  }

  getPortalEmbed(
    portal: Portal,
    direction: 'in' | 'out' = 'in'
  ): MessageEmbedOptions {
    const values = {
      in: {
        title: 'A portal has opened from... somewhere!',
        description: ` ${portal.from.toString()} 💨 ${this.emojis
          .getByName('portalin')
          ?.toString()}`,
        // Blue-ish
        color: 3911167,
      },

      out: {
        title: 'A portal has opened to... somewhere!',
        description: `${this.emojis
          .getByName('portalout')
          ?.toString()} ${portal.to.toString()} 💨 `,
        // Orange-ish
        color: 16756795,
      },
    };

    const embed: MessageEmbedOptions = {
      title: values[direction].title,
      description: values[direction].description,
      color: values[direction].color,
      timestamp: new Date(),
      footer: {
        icon_url: portal.invoker.user.avatarURL({ dynamic: true })!,
        text: `Portal opened by ${portal.invoker.displayName}`,
      },
      // thumbnail: {
      //   url: 'https://onlyportals.com/hotportalsinyourarea/portal.jpg'
      // }
    };

    return embed;
  }

  private updatePortalEmbed(
    pointTo: Message,
    originalEmbed: MessageEmbedOptions
  ): MessageEmbedOptions {
    originalEmbed.url = pointTo.url;
    return originalEmbed;
  }

  constructor(client: Client) {
    this.emojis = DiscordEmojiProvider.from(client);
  }
}