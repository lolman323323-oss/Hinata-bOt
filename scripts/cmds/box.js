const axios = require('axios');   
const request = require('request');   
const fs = require("fs");   

module.exports = {   
  config: {   
    name: "box",   
    aliases: ["box"],   
    version: "1.0",   
    author: "Helal",   
    countDown: 5,   
    role: 1,   
    shortDescription: "Set admin / change group photo, emoji, name",   
    longDescription: "",   
    category: "admin",   
    guide:  {   
      en: "{pn} name <name> to change group name\n{pn} emoji <emoji> to change group emoji\n{pn} image <reply to image> to change group image\n{pn} add [@tag] to add group admin\n{pn} del [@tag] to remove group admin\n{pn} info to see group info"   
    }   
  },   

  onStart: async function ({ message, api, event, args, getText }) {   
    if (args.length == 0) return api.sendMessage(
      `You can use:\n\n[PREFIX]box emoji [your emoji]\n[PREFIX]box name [group name]\n[PREFIX]box image [reply to an image]\n[PREFIX]box admin [@tag]\n[PREFIX]box del [@tag]\n[PREFIX]box info to see group info`, 
      event.threadID, 
      event.messageID
    );     

    if (args[0] == "name") {   
      var content = args.join(" ");   
      var c = content.slice(4, 99) || event.messageReply.body;   
      api.setTitle(`${c}`, event.threadID);   
    }   

    if (args[0] == "emoji") {   
      const name = args[1] || event.messageReply.body;   
      api.changeThreadEmoji(name, event.threadID);     
    }   

    if (args[0] == "add") {   
      if (Object.keys(event.mentions).length == 0) return api.changeAdminStatus(event.threadID, args.join(" "), true);   
      else {   
        for (var i = 0; i < Object.keys(event.mentions).length; i++) {
          api.changeAdminStatus(event.threadID, `${Object.keys(event.mentions)[i]}`, true);
        }
        return;    
      }   
    }   
    else if (args[0] == "del") {   
      if (Object.keys(event.mentions).length == 0) return api.changeAdminStatus(event.threadID, args.join(" "), false);   
      else {   
        for (var i = 0; i < Object.keys(event.mentions).length; i++) {
          api.changeAdminStatus(event.threadID, `${Object.keys(event.mentions)[i]}`, false);
        }
        return;    
      }   
    }   

    if (args[0] == "image") {     
      if (event.type !== "message_reply") return api.sendMessage("❌ You must reply to an image", event.threadID, event.messageID);   
      if (!event.messageReply.attachments || event.messageReply.attachments.length == 0) return api.sendMessage("❌ You must reply to an image", event.threadID, event.messageID);   
      if (event.messageReply.attachments.length > 1) return api.sendMessage("❌ Reply to only one image", event.threadID, event.messageID);   

      var callback = () => api.changeGroupImage(fs.createReadStream(__dirname + "/assets/any.png"), event.threadID, () => fs.unlinkSync(__dirname + "/assets/any.png"));           
      return request(encodeURI(event.messageReply.attachments[0].url))
        .pipe(fs.createWriteStream(__dirname+'/assets/any.png'))
        .on('close', () => callback());   
    };   

    if (args[0] == "info") {   
      var threadInfo = await api.getThreadInfo(event.threadID);   
      let threadMem = threadInfo.participantIDs.length;   
      var genderMale = [];   
      var genderFemale = [];   
      var unknown = [];   

      for (let z in threadInfo.userInfo) {   
        var gender = threadInfo.userInfo[z].gender;   
        var name = threadInfo.userInfo[z].name;   

        if (gender == 'MALE') genderMale.push(z + gender);   
        else if (gender == 'FEMALE') genderFemale.push(gender);   
        else unknown.push(name);   
      }   

      var maleCount = genderMale.length;   
      var femaleCount = genderFemale.length;   
      let adminCount = threadInfo.adminIDs.length;   
      let msgCount = threadInfo.messageCount;   
      let icon = threadInfo.emoji;   
      let threadName = threadInfo.threadName;   
      let id = threadInfo.threadID;   

      var listAdmin = '';   
      for (let i = 0; i < threadInfo.adminIDs.length; i++) {   
        const userInfo = await api.getUserInfo(threadInfo.adminIDs[i].id);   
        const name = userInfo[threadInfo.adminIDs[i].id].name;   
        listAdmin += '• ' + name + '\n│';   
      }   

      var approval = threadInfo.approvalMode;   
      var approvalText = approval == false ? 'Turn off' : approval == true ? 'Turn on' : 'Unknown';   
      var approvalIcon = approval == false ? '❎' : approval == true ? '✅' : '⭕';   

      var callback = () => api.sendMessage(   
        {   
          body: `├━━━━━━━━━━━◆
│GROUP NAME
│${threadName}
├━━━━━━━━━━━◆
│GROUP ID
│${id}
├━━━━━━━━━━━◆
│APPROVAL
│ADMIN MODE: ${approvalText}
├━━━━━━━━━━━◆
│Quick reaction emoji: ${icon}
╰━━━━━━━━━━━◆
╭━━━━━━━━━━━◆
│「INFORMATION」
├───────────
│Total members: ${threadMem}
│Total male: ${maleCount}
│Total female: ${femaleCount}
│Total admins: ${adminCount}
│Admin list:
├───────────
│${listAdmin}
╰━━━━━━━━━━━◆
╭━━━━━━━━━━━◆
│Total messages sent: ${msgCount}
╰━━━━━━━━━━━◆
🔥🎀𓆩♡𓆪𝚈𝚘𝚞𝚛 𝙷𝚒𝚗𝚊𝚝𝚊𓆩♡𓆪🎀🔥
Made by Helal`,   
          attachment: fs.createReadStream(__dirname + '/assets/any.png')   
        },   
        event.threadID,   
        () => fs.unlinkSync(__dirname + '/assets/any.png'),   
        event.messageID   
      );   

      return request(encodeURI(`${threadInfo.imageSrc}`))   
        .pipe(fs.createWriteStream(__dirname + '/assets/any.png'))   
        .on('close', () => callback());   
    }             
  }   
};