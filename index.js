const fs=require("fs"),path=require("path");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
console.log("FENG - PURE CUSTOM + GOAT SHIM");
const OWNER=process.env.OWNER_UID||"61570228081320";

try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

let cmds=new Map();
function loadCmds(){
 cmds.clear();
 let folders=["./scripts/cmds","./cmds"];
 for(let folder of folders){
  if(fs.existsSync(folder)){
   fs.readdirSync(folder).filter(f=>f.endsWith(".js")).forEach(file=>{
    try{
     delete require.cache[require.resolve(path.join(process.cwd(),folder,file))];
     let cmd=require(path.join(process.cwd(),folder,file));
     let name=(cmd.config?.name||file.replace(".js","")).toLowerCase();
     cmds.set(name,cmd);
     console.log(`✅ Loaded ${name}`);
    }catch(e){console.log(`❌ ${file} ${e.message}`);}
   });
  }
 }
}
loadCmds();

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED");return;}
  console.log(`FENG ONLINE ${api.getCurrentUserID()} - ${cmds.size} CMDS`);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  api.listenMqtt(async(e,event)=>{
   if(e){setTimeout(startBot,5000);return;}
   if(!event.body||event.senderID==api.getCurrentUserID()) return;
   let body=event.body.trim();
   let tid=event.threadID;
   if(!body.startsWith("!")) return;
   let args=body.slice(1).split(/ +/);
   let name=args[0].toLowerCase();
   let restArgs=args.slice(1);
   if(!cmds.has(name)) return;

   try{
    let cmd=cmds.get(name);
    
    // === GOATBOT / MIRAI COMPATIBILITY SHIM ===
    const fakeAPI = api;
    const fakeEvent = event;
    
    // Mock objects so your old cmds don't crash
    const message = {
      reply: (txt, cb) => api.sendMessage(txt, tid, event.messageID, cb),
      send: (txt, cb) => api.sendMessage(txt, tid, cb),
      react: (emoji) => api.setMessageReaction(emoji, event.messageID, ()=>{}, true)
    };
    
    const threadsData = { get: async()=>({}), set: async()=>{} };
    const usersData = { get: async()=>({}), set: async()=>{} };
    const globalData = { get: async()=>({}), set: async()=>{} };
    
    const argsObj = {
      api: fakeAPI,
      event: fakeEvent,
      args: restArgs,
      message,
      threadsData,
      usersData,
      globalData,
      threadID: tid,
      messageID: event.messageID,
      senderID: event.senderID,
      // These fix your ERR prefix / ownerID
      role: String(event.senderID)==String(OWNER)?2:0,
      commandName: name,
      config: cmd.config || {},
      prefix: "!",
      ownerID: OWNER,
      botID: api.getCurrentUserID(),
      getLang: (t)=>t,
      lang: {}
    };

    if(cmd.onStart) await cmd.onStart(argsObj);
    else if(cmd.onChat) await cmd.onChat(argsObj);
    else if(cmd.run) await cmd.run(argsObj);
    else if(cmd.execute) await cmd.execute(api, event, restArgs);
    else if(typeof cmd=="function") await cmd(api, event, restArgs);
    
    console.log(`✅ Ran !${name}`);
   }catch(err){
    console.log(`ERR ${name}: ${err.message}`);
    console.log(err.stack);
   }
  });
 });
}
startBot();
