const fs = require("fs");

module.exports = {
  config: {
    name: "help3",
    aliases: ["menu3"],
    version: "2.5",
    author: "Helal",
    role: 0,
    category: "system",        // ✅ FIXED: Required for command install
    shortDescription: "Show full command list with animation (4 edit only)",
  },

  onStart: async function ({ api, event, args }) {
    const commands = global.GoatBot?.commands || new Map();

    // =============================
    // 🔍 /help3 <command> → details
    // =============================
    if (args[0]) {
      const cmdName = args[0].toLowerCase();

      const cmd =
        commands.get(cmdName) ||
        [...commands.values()].find(c =>
          (c.config?.aliases || []).map(a => a.toLowerCase()).includes(cmdName)
        );

      if (!cmd) {
        return api.sendMessage(`❌ Command '${cmdName}' not found.`, event.threadID);
      }

      const { name, version, author, role, shortDescription, aliases } = cmd.config;

      const info =
        `🧩 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝙽𝙵𝙾\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔹 Name: ${convertFont(name)}\n` +
        `🔹 Aliases: ${aliases?.join(", ") || "None"}\n` +
        `🔹 Version: ${version || "1.0"}\n` +
        `🔹 Role: ${role}\n` +
        `🔹 Author: ${author || "Unknown"}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📝 Description: ${shortDescription || "No description provided."}`;

      return api.sendMessage(info, event.threadID);
    }

    // =============================
    // ⏳ Loading animation
    // =============================
    const sent = await api.sendMessage("⏳ Loading help menu...", event.threadID);

    const frames = [
      "[░░░░░░░░░░] ⚪ 0%",
      "[██░░░░░░░░] 🟠 25%",
      "[████░░░░░░] 🟡 50%",
      "[██████████] 🟢 100%",
    ];

    for (let i = 0; i < frames.length; i++) {
      await sleep(700);

      if (i === frames.length - 1) {
        const menu = buildMenu(commands);
        await api.editMessage(menu, sent.messageID);
      } else {
        await api.editMessage(frames[i], sent.messageID);
      }
    }
  },
};

// 🧩 Build final menu
function buildMenu(commands) {
  const categories = {};

  for (const [name, cmd] of commands.entries()) {
    const cat = cmd.config?.category?.toUpperCase() || "🎲 OTHER";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
  }

  let output =
    "┍━━━━━━━━━━━━━━━━◊\n" +
    "┋ [✦ 𝙲𝚊𝚝 𝙱𝚘𝚝 𝚖𝚎𝚗𝚞 ✦]\n" +
    "┕━━━━━━━━━━━━━━◊\n";

  for (const [cat, cmds] of Object.entries(categories)) {
    const chunks = chunkArray(cmds, 6);

    chunks.forEach((box, idx) => {
      output += `┍━━━[ ${cat}${chunks.length > 1 ? ` ${idx + 1}` : ""} ]\n`;

      for (let i = 0; i < box.length; i += 2) {
        const a = box[i] ? `🔹 ${convertFont(box[i])}` : "";
        const b = box[i + 1] ? `   🔹 ${convertFont(box[i + 1])}` : "";
        output += `┋${a}${b}\n`;
      }

      output += "┕━━━━━━━━━━━━◊\n";
    });
  }

  output +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    `📌 Total Commands: ${commands.size}\n` +
    `🔑 Prefix: /\n` +
    `👑 Owner: 𝙷𝚎𝚕𝚊𝚕\n` +
    `💡 Use: /help3 <command>\n` +
    "━━━━━━━━━━━━━━━━━━";

  return output;
}

// Utility Functions
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function convertFont(text) {
  const normal = "abcdefghijklmnopqrstuvwxyz";
  const fancy = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";

  return text
    .split("")
    .map(ch => {
      const i = normal.indexOf(ch.toLowerCase());
      return i !== -1 ? fancy[i] : ch;
    })
    .join("");
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}