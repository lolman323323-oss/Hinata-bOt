module.exports = {
  config: {
    name: "gcon",
    version: "1.1",
    author: "Helal",
    countDown: 5,
    role: 1,
    shortDescription: "Remove fixed user from group (only admin)",
    category: "admin",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, senderID, body, messageID } = event;
    const fixedUserID = "100067158230673";

    // যদি মেসেজ না থাকে বা অন্য কিছু হয় (unsend/react etc) তাহলে কিছুই করবে না
    if (!body || !body.toLowerCase().startsWith("/gcon")) return;

    // থ্রেড ইনফো চেক
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch {
      return api.sendMessage("❌ Failed to get group info.", threadID, messageID);
    }

    const botID = api.getCurrentUserID?.() || "";
    const admins = threadInfo.adminIDs.map(a => a.id);

    if (!admins.includes(botID)) {
      return api.sendMessage("❌ I must be group admin to remove user.", threadID, messageID);
    }

    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Only group admins can use this command.", threadID, messageID);
    }

    try {
      await api.removeUserFromGroup(fixedUserID, threadID);
      return api.sendMessage("✅ Successfully Group Unlock", threadID, messageID);
    } catch (err) {
      return api.sendMessage(`❌ Failed to remove user: ${err.message}`, threadID, messageID);
    }
  },
};