const fs=require("fs"),path=require("path");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
console.log("FENG UNIVERSAL INDEX - ALL CMDS WORK");
const OWNER=process.env.OWNER_UID||"61570228081320";

try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG UNIVERSAL");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

// ==== GLOBAL FIX FOR GOATBOT CMDS ====
global.config = { prefix: "!", adminBot: [OWNER] };
global.GoatBot = { config: global.config };
global.utils = { getPrefix: ()=> "!" };
global.client = { allCommands: new Map() };

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
     let name=(cmd.config?.name||cmd.name||file.replace(".js","")).toLowerCase();
     cmds.set(name,cmd);
     global.client.allCommands.set(name,cmd);
     // also aliases
     if(cmd.config?.aliases){
       cmd.config.aliases.forEach(a=>cmds.set(a.toLowerCase(),cmd));
     }
     console.log(`✅ ${name}`);
    }catch(e){console.log(`❌ ${file}: ${e.message}`);}
   });
  }
 }
 console.log(`LOADED ${cmds.size} CMDS`);
}
loadCmds();

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED",err);return;}
  let botID=api.getCurrentUserID();
  console.log(`FENG ONLINE ${botID}`);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  api.listenMqtt(async(e,event)=>{
   try{
    if(e){console.log("LISTEN ERR",e);return;}
    if(!event.body) return;
    if(event.senderID==botID) return;
    let body=event.body.trim();
    if(!body.startsWith("!")) return;
    
    let args=body.slice(1).split(/ +/);
    let name=args[0].toLowerCase();
    let restArgs=args.slice(1);
    
    if(!cmds.has(name)){
      console.log(`CMD NOT FOUND: ${name}`);
      return;
    }

    let cmd=cmds.get(name);
    console.log(`RUNNING !${name} from ${event.senderID}`);

    // ==== UNIVERSAL OBJECT - WORKS FOR ALL CMD TYPES ====
    let message = {
      reply: (t,cb) => api.sendMessage(t,event.threadID,event.messageID,cb),
      send: (t,cb) => api.sendMessage(t,event.threadID,cb||event.messageID),
      unsend: ()=>{}
    };

    let threadsData = {
      get: async()=>({data:{}, settings:{}}),
      set: async()=>{},
      getAll: async()=>[]
    };
    let usersData = {
      get: async()=>({data:{}, name:"User"}),
      set: async()=>{},
      getAll: async()=>[]
    };

    let obj = {
      api, event, args: restArgs, message,
      threadsData, usersData,
      threadModel: { findOne: async()=>null },
      userModel: { findOne: async()=>null },
      dashBoardData: {},
      globalData: {},
      threadData: {},
      userData: {},
      role: String(event.senderID)==String(OWNER)?2:0,
      prefix: "!",
      ownerID: OWNER,
      botID: botID,
      getLang: (t)=>t,
      getPrefix: ()=> "!",
      commandName: name,
      config: cmd.config || {},
      // for goatbot style
      messageID: event.messageID,
      threadID: event.threadID,
      senderID: event.senderID
    };

    // Try all possible function names
    if(cmd.onStart) await cmd.onStart(obj);
    else if(cmd.onChat) await cmd.onChat(obj);
    else if(cmd.run) await cmd.run(obj);
    else if(cmd.execute) await cmd.execute(obj);
    else if(typeof cmd === "function") await cmd(obj);
    else console.log(`NO RUN FUNCTION FOR ${name}`);

    console.log(`✅ DONE !${name}`);
   }catch(err){
    console.log(`ERR !${args?.[0]}: ${err.message}`);
    console.log(err.stack);
    try{
      api.sendMessage(`❌ Error in !${args?.[0]}: ${err.message}`, event.threadID, event.messageID);
    }catch{}
   }
  });
 });
}
startBot();
