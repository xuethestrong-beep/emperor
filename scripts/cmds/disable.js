const fs=require("fs"),path=require("path");
const p=path.join(__dirname,"..","..","disabled.json");
function load(){
 if(!fs.existsSync(p))return {global:[],threads:{}};
 try{return JSON.parse(fs.readFileSync(p,"utf8"));}catch(e){return {global:[],threads:{}};}
}
function save(d){fs.writeFileSync(p,JSON.stringify(d,null,2));}
module.exports={
 config:{name:"disable",aliases:["offcmd"],version:"3.0 ADMIN",author:"Feng Xiluo",role:2,category:"admin"},
 onStart:async function({api,event,args,cmds,config}){
  const ownerID=(config.ownerID||"61593117279214").toString();
  const admins=config.adminIDs||config.admin||config.admins||[];
  const senderID=(event.senderID||"").toString();
  const isAdmin=admins.map(a=>a.toString()).includes(senderID);
  if(senderID!==ownerID&&!isAdmin){
   return api.sendMessage("❌ ONLY ADMIN CAN USE DISABLE COMMAND!",event.threadID);
  }
  const action=(args[1]||"").toLowerCase();
  const cmdName=(args[2]||"").toLowerCase();
  const where=(args[3]||"").toLowerCase();
  let data=load();
  if(!data.global)data.global=[];
  if(!data.threads)data.threads={};
  const tid=event.threadID;
  if(!action){
   let m="DISABLE (ADMIN ONLY)\n\n";
   m+="!disable on <cmd> - global\n";
   m+="!disable on <cmd> this - this group only\n";
   m+="!disable off <cmd> - enable global\n";
   m+="!disable off <cmd> this - enable this group\n";
   m+="!disable list\n";
   m+="!disable list this\n\n";
   m+=`Global: ${data.global.length?data.global.join(", "):"none"}\n`;
   const tl=data.threads[tid]||[];
   m+=`This group: ${tl.length?tl.join(", "):"none"}`;
   return api.sendMessage(m,tid);
  }
  if(action==="list"){
   if(where==="this"){
    const l=data.threads[tid]||[];
    return api.sendMessage(`Disabled in THIS group: ${l.length?l.join(", "):"none"}`,tid);
   }
   let m=`Global: ${data.global.length?data.global.join(", "):"none"}\n`;
   for(const id in data.threads){m+=`Thread ${id}: ${data.threads[id].join(", ")}\n`;}
   return api.sendMessage(m||"none",tid);
  }
  if(!cmdName)return api.sendMessage("Ex: !disable on sing this",tid);
  if(cmdName!=="all"&&!cmds.has(cmdName))return api.sendMessage(`${cmdName} not found!`,tid);
  if(cmdName==="disable"||cmdName==="lock")return api.sendMessage("Cannot disable admin commands!",tid);
  const isThis=where==="this"||where==="here"||where==="group";
  if(action==="on"){
   if(isThis){
    if(!data.threads[tid])data.threads[tid]=[];
    if(cmdName==="all"){data.threads[tid]=[...cmds.keys()].filter(c=>c!=="disable"&&c!=="lock");}
    else{if(data.threads[tid].includes(cmdName))return api.sendMessage(`${cmdName} already disabled here!`,tid);data.threads[tid].push(cmdName);}
    save(data);return api.sendMessage(`🔒 ${cmdName} disabled in THIS GROUP! (Admin only)`,tid);
   }else{
    if(cmdName==="all"){data.global=[...cmds.keys()].filter(c=>c!=="disable"&&c!=="lock");}
    else{if(data.global.includes(cmdName))return api.sendMessage(`${cmdName} already disabled globally!`,tid);data.global.push(cmdName);}
    save(data);return api.sendMessage(`🔒 ${cmdName} disabled GLOBALLY! (Admin only)`,tid);
   }
  }
  if(action==="off"){
   if(isThis){
    if(!data.threads[tid])return api.sendMessage("Nothing disabled here!",tid);
    if(cmdName==="all")data.threads[tid]=[];else data.threads[tid]=data.threads[tid].filter(c=>c!==cmdName);
    save(data);return api.sendMessage(`🔓 ${cmdName} enabled in THIS GROUP!`,tid);
   }else{
    if(cmdName==="all")data.global=[];else data.global=data.global.filter(c=>c!==cmdName);
    save(data);return api.sendMessage(`🔓 ${cmdName} enabled GLOBALLY!`,tid);
   }
  }
 }
};
