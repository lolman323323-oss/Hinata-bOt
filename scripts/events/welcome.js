const { getTime } = global.utils;

if (!global.temp) global.temp = {};
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Helal",
    category: "events",
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      welcomeMessage:
        "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, type: %1help",
      multiple1: "you",
      multiple2: "you guys",
      defaultWelcomeMessage: `
•🦋𓂃🦋𓂃🦋𓂃🦋𓂃🦋•     
    •❥❥❥❥❥♥❥❥❥❥❥•
      ✮•°𝑾𝒆𝒍𝒄𝒐𝒎𝒆°•✮•        
 ✫     {userName}       ༂         
…...…,•’\`\`’•,•’\`\`’•,
…...…’•,\`’🌹’\` ,•’
...……...\`’•, ,•’,•’\`\`’•,•’\`\`’•,
,•’\`\`’•,•’\`\`’•,’•…’•,\`’🌹’\` ,•’
’•,\`’🌹’\` ,•’….....\`’•, ,•’
....\`’•, ,•’ ...
…...…,•’\`\`’•,•’\`\`’•, 
…...…’•,\`’🌹’\` ,•’
...……...\`’•, ,•’
Welcome to {boxName} 💖
Have a nice {session}! 🍁`
    }
  },

  onStart: async function ({ threadsData, message, event, api, getLang }) {
    // শুধু সাবস্ক্রাইব ইভেন্টের জন্য চেক
    if (event.logMessageType !== "log:subscribe") return;

    const hours = parseInt(getTime("HH"));
    const threadID = event.threadID;
    const prefix = global.utils.getPrefix(threadID) || "/";

    // নতুন যেইরা যোগ দিয়েছে
    const addedParticipants = event.logMessageData.addedParticipants || [];

    // যদি বট নিজেই যোগ দেয়, তাহলে স্বাগত বার্তা দেখাও
    if (addedParticipants.some(user => user.userFbId == api.getCurrentUserID())) {
      const nickNameBot = global.GoatBot?.config?.nickNameBot || "";
      if (nickNameBot) {
        await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
      }
      return message.send(getLang("welcomeMessage", prefix));
    }

    // global.temp.welcomeEvent[threadID] তে ডাটা init করা
    if (!global.temp.welcomeEvent[threadID]) {
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };
    }

    // নতুন যোগ দাতাদের সংরক্ষণ করা
    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...addedParticipants);

    // পুরানো timeout কেটে ফেলা
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    // 1.5 সেকেন্ড অপেক্ষা করে মেসেজ পাঠানো (একাধিক যোগ হলে একবারে)
    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
      try {
        const threadData = await threadsData.get(threadID);
        if (!threadData) return;

        if (threadData.settings?.sendWelcomeMessage === false) return;

        const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;

        // যদি কেউ ব্যান্ড থাকে তবে তাকে বাদ দেওয়া হবে
        const bannedUsers = threadData.data?.banned_ban || [];
        const validUsers = dataAddedParticipants.filter(u => !bannedUsers.some(b => b.id == u.userFbId));

        if (validUsers.length === 0) return;

        // নাম ও mentions তৈরি
        const userNames = validUsers.map(u => u.fullName);
        const mentions = validUsers.map(u => ({ tag: u.fullName, id: u.userFbId }));

        // একাধিক হলে আলাদা শব্দ
        const multiple = userNames.length > 1;

        let welcomeMessage = threadData.data?.welcomeMessage || getLang("defaultWelcomeMessage");

        // placeholder replace
        welcomeMessage = welcomeMessage
          .replace(/\{userName\}|\{userNameTag\}/g, userNames.join(", "))
          .replace(/\{boxName\}|\{threadName\}/g, threadData.threadName)
          .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{session\}/g,
            hours <= 10
              ? getLang("session1")
              : hours <= 12
                ? getLang("session2")
                : hours <= 18
                  ? getLang("session3")
                  : getLang("session4")
          );

        // মেন্টশন যোগ করো যদি টেমপ্লেটে থাকে
        const form = {
          body: welcomeMessage,
          mentions: welcomeMessage.includes("{userNameTag}") ? mentions : null
        };

        // যদি অ্যাটাচমেন্ট থাকে, সেটাও পাঠানো (optional)
        if (threadData.data?.welcomeAttachment?.length) {
          const attachments = threadData.data.welcomeAttachment.map(file =>
            global.utils.drive.getFile(file, "stream")
          );

          const results = await Promise.allSettled(attachments);
          form.attachment = results
            .filter(res => res.status === "fulfilled")
            .map(res => res.value);
        }

        // মেসেজ পাঠাও
        await message.send(form);

        // ক্লিয়ার করো temp data
        delete global.temp.welcomeEvent[threadID];
      } catch (err) {
        console.error("Welcome command error:", err);
      }
    }, 1500);
  }
};