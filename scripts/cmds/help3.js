const fs = require("fs");

module.exports = {
  config: {
    name: "help3",
    aliases: ["menu3"],
    version: "2.5",
    author: "Helal",
    role: 0,
    shortDescription: "Show full command list with animation (4 edit only)",
  },

  onStart: async function ({ api, event, args }) {
    const commands = global.GoatBot?.commands || new Map();

    // 🧩 /help <command> → details
    if (args[0]) {
      const cmdName = args[0].toLowerCase();
      const cmd =
        commands.get(cmdName) ||
        Array.from(commands.values()).find(c => c.config?.aliases?.includes(cmdName));
      if (!cmd) return api.sendMessage(`❌ Command '${cmdName}' not found.`, event.threadID);

      const { name, version, author, role, shortDescription, aliases } = cmd.config;
      const info =
        `🧩 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝙽𝙵𝙾\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔹 𝙽𝚊𝚖𝚎: ${convertFont(name)}\n` +
        `🔹 𝙰𝚕𝚒𝚊𝚜𝚎𝚜: ${aliases?.join(", ") || "None"}\n` +
        `🔹 𝚅𝚎𝚛𝚜𝚒𝚘𝚗: ${version || "1.0"}\n` +
        `🔹 𝚁𝚘𝚕𝚎: ${role}\n` +
        `🔹 𝙰𝚞𝚝𝚑𝚘𝚛: ${author || "Unknown"}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📝 𝙳𝚎𝚜𝚌: ${shortDescription || "No description provided."}`;
      return api.sendMessage(info, event.threadID);
    }

    // 🌀 Start loading animation
    const sent = await api.sendMessage("⏳ Loading help menu...", event.threadID);
    const frames = [
      "[░░░░░░░░░░] ⚪ 0%",
      "[██░░░░░░░░] 🟠 25%",
      "[████░░░░░░] 🟡 50%",
      "[██████████] 🟢 100%",
    ];

    // Wait and animate
    for (let i = 0; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, 700));

      // Final (4th) frame = show help menu instead of bar
      if (i === frames.length - 1) {
        const menu = buildMenu(commands);
        await api.editMessage(menu, sent.messageID);
      } else {
        await api.editMessage(frames[i], sent.messageID);
      }
    }
  },
};

// 🧩 Build final help menu
function buildMenu(commands) {
  const categories = {};
  for (const [name, cmd] of commands.entries()) {
    const cat = cmd.config?.category?.toUpperCase() || "🎲 OTHER";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
  }

  let output = "┍━━━━━━━━━━━━━━━━◊\n┋ [✦𝙲𝚊𝚝 𝙱𝚘𝚝 𝚖𝚎𝚗𝚞 ✦]\n┕━━━━━━━━━━━━━━◊\n";

  for (const [cat, cmds] of Object.entries(categories)) {
    const boxChunks = chunkArray(cmds, 6);
    boxChunks.forEach((box, idx) => {
      output += `┍━━━[ ${cat}${boxChunks.length > 1 ? ` ${idx + 1}` : ""} ]\n`;
      for (let i = 0; i < box.length; i += 2) {
        const c1 = box[i] ? `🔹 ${convertFont(box[i])}` : "";
        const c2 = box[i + 1] ? `   🔹 ${convertFont(box[i + 1])}` : "";
        output += `┋${c1}${c2}\n`;
      }
      output += "┕━━━━━━━━━━━━◊\n";
    });
  }

  output +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    `📌 ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ: ${commands.size}\n` +
    "🔑 ᴘʀᴇꜰɪx: /\n" +
    "👑 ᴏᴡɴᴇʀ: 𝙷𝚎𝚕𝚊𝚕\n" +
    "💡 𝚄𝚜𝚎: /help <command>\n" +
    "━━━━━━━━━━━━━━━━━━";

  return output;
}

// 🧩 Split array into chunks
function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

// ✨ Fancy Font Converter
function convertFont(text) {
  const normal = "abcdefghijklmnopqrstuvwxyz";
  const fancy = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
  return text
    .split("")
    .map(ch => {
      const idx = normal.indexOf(ch.toLowerCase());
      return idx !== -1 ? fancy[idx] : ch;
    })
    .join("");
}
