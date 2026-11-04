const fs=require("fs"),path=require("path");
const disablePath=path.join(__dirname,"..","..","disabled.json");

function getDisabled(){
 if(!fs.existsSync(disablePath))return [];
 try{return JSON.parse(fs.readFileSync(disablePath,"utf8")).disabled||[];}catch(e){return [];}
}
function saveDisabled(list){
 fs.writeFileSync(disablePath,JSON.stringify({disabled:list},null,2));
}

module.exports={
 config:{
  name:"disable",
  aliases:["cmd","command"],
  version:"1.0",
  author:"Feng Xiluo",
  role:2,
  category:"admin",
  shortDescription:"Disable/enable commands"
 },
 onStart:async function({api,event,args,config,cmds}){
  const type=(args[1]||"").toLowerCase();
  const cmdName=(args[2]||"").toLowerCase();
  let disabled=getDisabled();

  if(!type){
   return api.sendMessage(
`DISABLE COMMAND

Usage:
!disable on sing - disable sing
!disable off sing - enable sing
!disable list - show disabled
!disable on all - disable all (except this)
!disable off all - enable all

Disabled: ${disabled.length?disabled.join(", "):"none"}`,
   event.threadID);
  }

  if(type==="list"){
   return api.sendMessage(`Disabled commands: ${disabled.length?disabled.join(", "):"none"}`,event.threadID);
  }

  if(type==="on"){
   if(cmdName==="all"){
    const all=[...cmds.keys()];
    const filtered=all.filter(c=>c!=="disable"&&c!=="lock");
    saveDisabled([...new Set(filtered)]);
    return api.sendMessage(`All commands disabled! (${filtered.length})`,event.threadID);
   }
   if(!cmdName)return api.sendMessage("Provide command name: !disable on sing",event.threadID);
   if(!cmds.has(cmdName))return api.sendMessage(`Command ${cmdName} not found!`,event.threadID);
   if(disabled.includes(cmdName))return api.sendMessage(`${cmdName} already disabled!`,event.threadID);
   disabled.push(cmdName);
   saveDisabled(disabled);
   return api.sendMessage(`Command ${cmdName} is now DISABLED!`,event.threadID);
  }

  if(type==="off"){
   if(cmdName==="all"){
    saveDisabled([]);
    return api.sendMessage("All commands enabled!",event.threadID);
   }
   if(!cmdName)return api.sendMessage("Provide command name: !disable off sing",event.threadID);
   if(!disabled.includes(cmdName))return api.sendMessage(`${cmdName} is not disabled!`,event.threadID);
   disabled=disabled.filter(c=>c!==cmdName);
   saveDisabled(disabled);
   return api.sendMessage(`Command ${cmdName} is now ENABLED!`,event.threadID);
  }

  api.sendMessage("Use: !disable on/off <name> or !disable list",event.threadID);
 }
};
