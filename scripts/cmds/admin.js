const fs=require("fs"),path=require("path");

module.exports={
 config:{
  name:"admin",
  aliases:["adminlist","admins","owner"],
  version:"3.0 ADMIN SYSTEM",
  author:"Feng Xiluo",
  role:2,
  category:"admin",
  shortDescription:"Admin list & commands"
 },
 onStart:async function({api,event,args,cmds,config}){
  const ownerID=(config.ownerID||"61593117279214").toString();
  const configPath=path.join(__dirname,"..","..","config.json");
  let cfg=JSON.parse(fs.readFileSync(configPath,"utf8"));
  if(!cfg.adminIDs)cfg.adminIDs=cfg.admin||cfg.admins||[];
  cfg.adminIDs=cfg.adminIDs.map(a=>a.toString());
  const tid=event.threadID;
  const action=(args[1]||"").toLowerCase();
  const senderID=(event.senderID||"").toString();
  const isOwner=senderID===ownerID;
  const isAdmin=cfg.adminIDs.includes(senderID);

  // LIST ADMINS
  if(!action||action==="list"){
   let msg="👑 ADMIN LIST\n\n";
   msg+=`Owner: ${ownerID}\n`;
   if(cfg.adminIDs.length){
    msg+=`Admins (${cfg.adminIDs.length}):\n`;
    for(let i=0;i<cfg.adminIDs.length;i++){
     msg+=`${i+1}. ${cfg.adminIDs[i]}\n`;
    }
   }else{
    msg+=`Admins: none (owner only)\n`;
   }
   msg+=`\nCommands: !admin add, !admin remove, !admin cmds`;
   return api.sendMessage(msg,tid);
  }

  // ADMIN COMMANDS LIST
  if(action==="cmds"||action==="commands"){
   let adminCmds=[];
   for(const [name,cmd] of cmds){
    if(cmd.config&&cmd.config.role>=2)adminCmds.push(name);
   }
   let msg=`🔐 ADMIN COMMANDS (${adminCmds.length})\n\n`;
   msg+=adminCmds.join(", ")||"none";
   msg+=`\n\nUse: !<command>`;
   msg+=`\nEx: !lock on, !disable on sing this`;
   return api.sendMessage(msg,tid);
  }

  // ADD ADMIN - Owner only
  if(action==="add"){
   if(!isOwner)return api.sendMessage("❌ Only OWNER can add admins!",tid);
   let newID=null;
   if(event.mentions&&Object.keys(event.mentions).length>0){
    newID=Object.keys(event.mentions)[0];
   }else if(event.messageReply){
    newID=event.messageReply.senderID;
   }else if(args[2]){
    newID=args[2].replace("@","").toString();
   }
   if(!newID)return api.sendMessage("Reply to user or mention: !admin add @user",tid);
   if(newID===ownerID)return api.sendMessage("That is owner already!",tid);
   if(cfg.adminIDs.includes(newID))return api.sendMessage("Already admin!",tid);
   cfg.adminIDs.push(newID);
   cfg.admin=cfg.adminIDs;
   fs.writeFileSync(configPath,JSON.stringify(cfg,null,2));
   config.adminIDs=cfg.adminIDs;
   return api.sendMessage(`✅ Added admin: ${newID}`,tid);
  }

  // REMOVE ADMIN - Owner only
  if(action==="remove"||action==="rem"||action==="del"){
   if(!isOwner)return api.sendMessage("❌ Only OWNER can remove admins!",tid);
   let remID=null;
   if(event.mentions&&Object.keys(event.mentions).length>0){
    remID=Object.keys(event.mentions)[0];
   }else if(event.messageReply){
    remID=event.messageReply.senderID;
   }else if(args[2]){
    remID=args[2].replace("@","").toString();
   }
   if(!remID)return api.sendMessage("Reply or mention: !admin remove @user",tid);
   if(!cfg.adminIDs.includes(remID))return api.sendMessage("Not an admin!",tid);
   cfg.adminIDs=cfg.adminIDs.filter(id=>id!==remID);
   cfg.admin=cfg.adminIDs;
   fs.writeFileSync(configPath,JSON.stringify(cfg,null,2));
   config.adminIDs=cfg.adminIDs;
   return api.sendMessage(`✅ Removed admin: ${remID}`,tid);
  }

  return api.sendMessage("Use: !admin list, !admin cmds, !admin add @user, !admin remove @user",tid);
 }
};
