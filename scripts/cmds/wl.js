const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// 🔥 Developer UID Slots (3 Slot)
// Slot-1 already set with your UID
config.developers = [
  "61583867166676", // Developer Slot-1 (Your UID)
  "61584053562107",               // Developer Slot-2 (Empty)
  ""                // Developer Slot-3 (Empty)
];

module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "1.0",
    author: "Helal",
    countDown: 5,
    role: 2,
    description: {
      en: "Add, remove, edit admin role"
    },
    category: "permission",
    guide: {
      en: '   {pn} [add | -a] <uid | @tag>: Add admin role for user' +
        '\n   {pn} [remove | -r] <uid | @tag>: Remove admin role of user' +
        '\n   {pn} [list | -l]: List all admins' +
        '\n   {pn} [enable | on]: Enable whitelist mode' +
        '\n   {pn} [disable | off]: Disable whitelist mode'
    }
  },

  langs: {
    en: {
      added: "✅ | Added whitelist role for %1 user(s):\n%2",
      alreadyAdmin: "⚠ | %1 user(s) already have whitelist role:\n%2",
      missingIdAdd: "⚠ | Please enter a user ID or tag someone to add.",
      removed: "✅ | Removed whitelist role from %1 user(s):\n%2",
      notAdmin: "⚠ | %1 user(s) don't have whitelist role:\n%2",
      missingIdRemove: "⚠ | Please enter a user ID or tag someone to remove.",
      listAdmin: "👑 | List of whitelisted users:\n%1",
      whiteListModeEnable: "✅ | Whitelist mode has been enabled.",
      whiteListModeDisable: "✅ | Whitelist mode has been disabled.",
      noPermission: "❗ Only developer can use this feature."
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang, role }) {

    // 🔥 Developer Check (3 UID Slot supported)
    const isDev = config.developers.includes(event.senderID);

    if (!isDev && ["add","-a","remove","-r","enable","on","disable","off"].includes(args[0]))
      return message.reply(getLang("noPermission"));

    switch (args[0]) {

      case "add":
      case "-a": {
        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply)
          uids.push(event.messageReply.senderID);
        else
          uids = args.slice(1).filter(arg => !isNaN(arg));

        if (uids.length === 0)
          return message.reply(getLang("missingIdAdd"));

        const notWhitelisted = [];
        const alreadyWhitelisted = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            alreadyWhitelisted.push(uid);
          else
            notWhitelisted.push(uid);
        }

        if (notWhitelisted.length > 0)
          config.whiteListMode.whiteListIds.push(...notWhitelisted);

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const userNames = await Promise.all(
          uids.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`))
        );

        return message.reply(
          (notWhitelisted.length > 0
            ? getLang("added", notWhitelisted.length,
                userNames.filter(n => notWhitelisted.includes(n.match(/\d+/)[0])).join("\n"))
            : "") +
          (alreadyWhitelisted.length > 0
            ? "\n" + getLang("alreadyAdmin", alreadyWhitelisted.length,
                userNames.filter(n => alreadyWhitelisted.includes(n.match(/\d+/)[0])).join("\n"))
            : "")
        );
      }

      case "remove":
      case "-r": {
        let uids = [];

        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else
          uids = args.slice(1).filter(arg => !isNaN(arg));

        if (uids.length === 0)
          return message.reply(getLang("missingIdRemove"));

        const notWhitelisted = [];
        const whitelisted = [];

        for (const uid of uids) {
          if (config.whiteListMode.whiteListIds.includes(uid))
            whitelisted.push(uid);
          else
            notWhitelisted.push(uid);
        }

        config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds.filter(uid => !whitelisted.includes(uid));

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        const userNames = await Promise.all(
          uids.map(uid => usersData.getName(uid).then(name => `• ${name} (${uid})`))
        );

        return message.reply(
          (whitelisted.length > 0
            ? getLang("removed", whitelisted.length,
                userNames.filter(n => whitelisted.includes(n.match(/\d+/)[0])).join("\n"))
            : "") +
          (notWhitelisted.length > 0
            ? "\n" + getLang("notAdmin", notWhitelisted.length,
                userNames.filter(n => notWhitelisted.includes(n.match(/\d+/)[0])).join("\n"))
            : "")
        );
      }

      case "list":
      case "-l": {
        if (config.whiteListMode.whiteListIds.length === 0)
          return message.reply("⚠ | No users are currently whitelisted.");

        const userNames = await Promise.all(
          config.whiteListMode.whiteListIds.map(uid =>
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          )
        );

        return message.reply(getLang("listAdmin", userNames.join("\n")));
      }

      case "enable":
      case "on": {
        config.whiteListMode.enable = true;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeEnable"));
      }

      case "disable":
      case "off": {
        config.whiteListMode.enable = false;
        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        return message.reply(getLang("whiteListModeDisable"));
      }

      default:
        return message.SyntaxError();
    }
  }
};