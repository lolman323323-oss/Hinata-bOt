const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "itachi",
    version: "1.0",
    author: "Helal",
    countDown: 5,
    role: 0,
    description: { en: "Get 6 random Itachi Uchiha images from Google Images." },
    category: "naruto",
    guide: { en: "/itachi - Get 6 Itachi Uchiha images" },
  },

  onStart: async function ({ api, event }) {
    try {
      const query = "Itachi Uchiha"; // Fixed search query
      const count = 6;

      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/googleimage?query=${encodeURIComponent(query)}`;
      const res = await axios.get(apiUrl);
      const images = res.data?.images || [];

      if (!images.length)
        return api.sendMessage(`❌ No images found for "${query}"`, event.threadID, event.messageID);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // Shuffle images for randomness
      const shuffled = images.sort(() => 0.5 - Math.random());
      const attachments = [];

      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        const url = shuffled[i];
        try {
          const imgRes = await axios.get(url, { responseType: "arraybuffer" });
          const imgPath = path.join(cacheDir, `itachi_${i + 1}.jpg`);
          await fs.writeFile(imgPath, imgRes.data);
          attachments.push(fs.createReadStream(imgPath));
        } catch (e) {
          continue;
        }
      }

      if (!attachments.length)
        return api.sendMessage(`❌ Couldn't download any valid images for "${query}"`, event.threadID, event.messageID);

      await api.sendMessage(
        { body: `⭕ Here are 6 random Itachi Uchiha images!`, attachment: attachments },
        event.threadID,
        event.messageID
      );

      // Cleanup
      if (fs.existsSync(cacheDir)) await fs.remove(cacheDir);

    } catch (err) {
      console.error("Itachi Img Error:", err.message);
      return api.sendMessage("❌ Something went wrong. Try again later.", event.threadID, event.messageID);
    }
  },
};