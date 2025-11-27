const axios = require("axios");

module.exports = {
  config: {
    name: "webcode",
    version: "2.0",
    author: "Helal",
    role: 0,
    category: "web",
    shortDescription: "Fetch full website source (supports very large HTML)",
    longDescription: "Fetch HTML/CSS/JS code from any website link safely, even large files"
  },

  onStart: async function ({ api, event, args }) {
    const link = args[0];
    const threadID = event.threadID;

    if (!link) {
      return api.sendMessage("❌ Use: /webcode <website-link>", threadID);
    }

    try {
      api.sendMessage("⏳ Fetching large text... Please wait...", threadID);

      const { data } = await axios.get(link, {
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0 (WebCodeBot)"
        }
      });

      const text = String(data);

      // 15k–20k per chunk for Messenger safety
      const chunkSize = 16000;
      const totalParts = Math.ceil(text.length / chunkSize);

      for (let i = 0; i < totalParts; i++) {
        const chunk = text.slice(i * chunkSize, (i + 1) * chunkSize);

        await api.sendMessage(
          `📄 PART ${i + 1} / ${totalParts}\n\n${chunk}`,
          threadID
        );
      }

    } catch (err) {
      return api.sendMessage(
        "❌ Error fetching website! Security or Unavailable",
        threadID
      );
    }
  }
};