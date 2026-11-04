const fs=require("fs"),path=require("path");
module.exports={
 config:{
  name:"autoreact",
  aliases:["adminreact","react","areact"],
  version:"1.0 AUTO ADMIN REACT",
  author:"Feng Xiluo",
  role:2,
  category:"admin"
 },
 onStart:async function({api,event,args,config}){
  const cfgPath=path.join(__dirname,"..","..","config.json");
  let cfg=JSON.parse(fs.readFileSync(cfgPath,"utf8"));
  const tid=event.threadID;
  const action=(args[1]||"").toLowerCase();
  const emoji=args[2];

  if(!action){
   let m="👑 AUTO ADMIN REACT\n\n";
   m+=`Status: ${cfg.autoReact?"ON ✅":"OFF ❌"}\n`;
   m+=`Emoji: ${cfg.autoReactEmoji||"👑"}\n`;
   m+=`React to: Owner + Admins\n\n`;
   m+=`!autoreact on - enable\n`;
   m+=`!autoreact off - disable\n`;
   m+=`!autoreact emoji 👑 - change emoji\n`;
   m+=`!autoreact test - test`;
   return api.sendMessage(m,tid);
  }

  if(action==="on"){
   cfg.autoReact=true;
   fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));
   config.autoReact=true;
   return api.sendMessage(`✅ Auto React ON! Emoji: ${cfg.autoReactEmoji||"👑"}`,tid);
  }

  if(action==="off"){
   cfg.autoReact=false;
   fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));
   config.autoReact=false;
   return api.sendMessage("❌ Auto React OFF!",tid);
  }

  if(action==="emoji"){
   if(!emoji)return api.sendMessage("Use: !autoreact emoji 👑",tid);
   cfg.autoReactEmoji=emoji;
   fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));
   config.autoReactEmoji=emoji;
   return api.sendMessage(`✅ Emoji set to: ${emoji}`,tid);
  }

  if(action==="test"){
   api.setMessageReaction(cfg.autoReactEmoji||"👑",event.messageID,()=>{},true);
   return api.sendMessage(`Tested: ${cfg.autoReactEmoji||"👑"}`,tid);
  }
 }
};
