module.exports.config = {
  name: "help",
  version: "1.0",
  author: "Feng",
  role: 0,
  description: "Show commands"
};

module.exports.onStart = async ({ api, event, args, prefix }) => {
  const allCmds = [];
  const fs = require("fs");
  const path = require("path");
  
  let folder = "./scripts/cmds";
  if(fs.existsSync(folder)){
    fs.readdirSync(folder).forEach(f=>{
      if(f.endsWith(".js")) allCmds.push(f.replace(".js",""));
    });
  }
  
  let p = prefix || "!";
  if(!args[0]){
    return api.sendMessage(
      `📜 COMMANDS (${allCmds.length}):\n\n${allCmds.map(c=>`• ${p}${c}`).join("\n")}\n\nUse: ${p}help [cmd name]`,
      event.threadID,
      event.messageID
    );
  } else {
    let cmdName = args[0].toLowerCase();
    return api.sendMessage(`Command: ${p}${cmdName}\nUse ${p}${cmdName}`, event.threadID, event.messageID);
  }
};
