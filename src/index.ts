import { Client, Message, GuildMember, TextChannel, Channel, MessageEmbedOptions } from "discord.js"
import { EmojiProvider } from "./discord/emoji";

export interface Portal {
    invoker: GuildMember;
    to: TextChannel;
    from: TextChannel;
}

export function createPortal(msg: Message, client: Client) : Portal | null {
    const content = msg.content;
    const invoker = msg.member!;

    let originChan = msg.channel;
    let tag = content.split("!portal")[1]
    let matches = tag.match(/<#(.+?)>/) ?? []
    
    if (matches.length != 2) {
        console.log(`Got ${matches.length} matches: ${matches}`)
        return null
    }

    let destId = matches[1]
    let destChan : TextChannel = client.channels.resolve(destId) as TextChannel 
    
    if (!destChan || !(destChan as Channel).isText()) {
        console.log(`Destination ${destChan.name} is not a text channel.`)
        return null
    }

    if (destChan.name == (originChan as TextChannel).name) {
        console.log("Can't portal to the origin channel.")
        return null
    }

    const portal : Portal = {
        to: destChan,
        from: originChan as TextChannel,
        invoker: invoker!
    };

    return portal;
}

export interface PortalOpener { 
  open(portal: Portal) : Promise<void>
}

export class SimplePortalOpener implements PortalOpener {
  private readonly emojis: EmojiProvider;

  async open(portal: Portal): Promise<void> {
      let portalIn = this.emojis.getByName("portalin")!
      let portalOut = this.emojis.getByName("portalout")!

      portal.to.send({content: `${portalIn.toString()} <= ${portal.to.toString()}` });
      portal.from.send({content: `${portalOut.toString()} => ${portal.from.toString()}`});

      return
  }

  constructor(emojis: EmojiProvider) {
      this.emojis = emojis;
  }
}