const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "file",
    aliases: ["getfile"],
    version: "1.1",
    author: "Helal",
    countDown: 2,
    role: 3, // only bot admin by default
    category: "owner",
    shortDescription: { en: "Send command file source (admin only)" }
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      // Only allow Helal or Bot Admins
      const helalUIDs = ["61585520407950", "61583867166676"]; // 🔹 Replace with your real Facebook UID(s)

      if (!helalUIDs.includes(event.senderID)) {
        return message.reply("❌ You don’t have permission to view source files.");
      }

      if (!args || args.length === 0) {
        return message.reply("⚠️ Usage: /file <command_filename_without_js>\nExample: /file bigcalcu");
      }

      const fname = args[0].trim();

      // Disallow path traversal or invalid names
      if (fname.includes("..") || fname.includes("/") || fname.includes("\\") || fname.includes(".js")) {
        return message.reply("❌ Invalid filename.");
      }

      const filePath = path.join(__dirname, fname + ".js");
      if (!fs.existsSync(filePath)) return message.reply("❌ File not found: " + fname + ".js");

      const stats = fs.statSync(filePath);
      if (stats.size > 120 * 1024) return message.reply("⚠️ File too large to display.");

      const content = fs.readFileSync(filePath, "utf8");
      const header = `📄 Source: ${fname}.js\n\n`;

      return message.reply(header + "```\n" + content + "\n```");
    } catch (err) {
      console.error(err);
      return message.reply("❌ Error reading file.");
    }
  }
};
