const fs=require("fs"),path=require("path");
let fcaModule; try{ fcaModule=require("ws3-fca"); }catch{ fcaModule=require("fca-unofficial"); }
let login=fcaModule.default||fcaModule.login||fcaModule;
let appState=JSON.parse(process.env.APPSTATE);
let Groq=require("groq-sdk"); let groq=new Groq({apiKey:process.env.GROQ_API_KEY});
console.log("FENG REAL COMMANDS");
let memory={},isPaused=false,cmds=new Map();
const OWNER_UID=process.env.OWNER_UID||"61570228081320";

try{
  const http=require("http");
  const s=http.createServer((_,r)=>{ r.writeHead(200); r.end("FENG"); });
  s.on('error',()=>{}); s.listen(process.env.PORT||8080);
}catch{}

function loadCmds(){ for(let f of ["./scripts/cmds","./cmds"]){ if(fs.existsSync(f)){ fs.readdirSync(f).filter(x=>x.endsWith(".js")).forEach(file=>{ try{ let c=require(path.join(process.cwd(),f,file)); cmds.set((c.config?.name||file.replace(".js","")).toLowerCase(),c); }catch{} }); } } } loadCmds();

function getHelp(p=1){
 if(p==1) return `FENG BOT - 70 CMDS PAGE 1/3
!help !ping !uid !tid !info !time !say
!joke !quote !8ball !pair !ship !love
!gay !kiss !hug !slap !toxic !sim !ai
Next: !help 2`;
 if(p==2) return `FENG BOT - PAGE 2/3
!advice !fact !qotd !rizz !roast !meme
!gif !flip !dice !slot !bank !bal
!rank !top !math !calc !wiki !dict
Next: !help 3`;
 return `FENG BOT - PAGE 3/3
!news !img !yt !tiktok !fb !insta
!lyrics !anime !waifu !sticker
!kick !ban !add !group !owner
!clear !pause !resume !reload
Chat: feng [message]`;
}

const jokes=["Why did chicken cross road? To get to other side 😆","I told my wife she was drawing eyebrows too high. She looked surprised.","I'm so good at sleeping, I can do it with my eyes closed!"];
const quotes=["Life is what happens when you're busy making other plans.","Be yourself; everyone else is already taken.","The only way to do great work is to love what you do."];
const facts=["Octopuses have 3 hearts!","Bananas are berries but strawberries aren't!","Honey never spoils!"];
const roasts=["You're not dumb, you just have bad luck thinking 😆","I'd agree with you but then we'd both be wrong"];

function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function startBot(){
 login({appState, forceLogin:true, listenEvents:true, logLevel:"silent"},(err,api)=>{
  if(err){ console.log("APPSTATE EXPIRED"); return; }
  console.log("FENG ONLINE",api.getCurrentUserID(),"OWNER:",OWNER_UID);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});
  function reply(t,e){ try{ api.sendMessage(t,e.threadID,e.messageID); }catch{} }

  api.listenMqtt(async(err,event)=>{
    if(err){ setTimeout(startBot,5000); return; }
    if(!event.body||event.senderID==api.getCurrentUserID()) return;
    let body=event.body.trim(), low=body.toLowerCase(), tid=event.threadID;

    if(String(event.senderID)==String(OWNER_UID)){
      try{ api.setMessageReaction("😆", event.messageID, ()=>{}, true); }catch{}
    }

    if(low.startsWith("!")){
      let args=body.slice(1).trim().split(/ +/), name=args[0]?.toLowerCase(), rest=args.slice(1), fullRest=body.slice(name.length+2).trim();
      
      // CUSTOM CMDS FROM FILES
      if(cmds.has(name)){ try{ let c=cmds.get(name); if(c.onStart) await c.onStart({api,event,args:rest,threadID:tid, message:{reply:(txt)=>reply(txt,event)}}); }catch{} return; }

      // === REAL BUILT-IN LOGIC ===
      if(name=="help") return reply(getHelp(parseInt(rest[0])||1),event);
      if(name=="ping") return reply(`⚡ Pong! ${Date.now()-event.timestamp}ms\nFENG ONLINE`,event);
      if(name=="uid") return reply(`👤 Your UID: ${event.senderID}\n💬 Thread: ${tid}`,event);
      if(name=="tid") return reply(`Thread ID: ${tid}`,event);
      if(name=="info") return reply(`🤖 FENG BOT\nOwner: ${OWNER_UID}\n70 cmds + Groq AI\nPrefix: !\nChat: feng + message`,event);
      if(name=="time") return reply(`⏰ ${new Date().toLocaleString("en-PH",{timeZone:"Asia/Manila"})}\nLaoag, PH`,event);
      if(name=="say") return reply(fullRest||"What should I say? Usage: !say hello",event);
      if(name=="joke") return reply(`😂 ${random(jokes)}`,event);
      if(name=="quote") return reply(`💭 "${random(quotes)}"`,event);
      if(name=="fact") return reply(`🧠 Fact: ${random(facts)}`,event);
      if(name=="qotd") return reply(`💬 QOTD: What makes you happy today?`,event);
      if(name=="advice") return reply(`💡 Advice: Take a break, drink water, and keep going! You got this!`,event);
      if(name=="rizz") return reply(`😏 Your rizz: ${Math.floor(Math.random()*100)}% - ${Math.floor(Math.random()*100)>50?"W rizz!":"L rizz 😆"}`,event);
      if(name=="roast") return reply(`🔥 ${random(roasts)}`,event);
      if(name=="toxic") return reply(`☠️ ${random(roasts)}`,event);
      
      if(name=="8ball"){
        let ans=["Yes!","Nope","Maybe","Definitely","Ask again","100%!","Never","Absolutely!"];
        return reply(`🎱 Question: ${fullRest||"??"}\nAnswer: ${random(ans)}`,event);
      }
      if(name=="gay"||name=="love"||name=="ship"||name=="pair"){
        let percent=Math.floor(Math.random()*101);
        let user=event.senderID;
        let target=Object.keys(event.mentions||{})[0]||event.senderID;
        let targetName=event.mentions&&Object.values(event.mentions)[0]||"You";
        if(name=="gay") return reply(`🌈 Gay Check: ${targetName} is ${percent}% gay! ${percent>50?"Slay!":"Straight 😆"}`,event);
        if(name=="love") return reply(`❤️ Love meter for ${targetName}: ${percent}% ${percent>80?"True love!":percent>50?"Maybe?":"Nope 😆"}`,event);
        if(name=="ship"||name=="pair"){
          let names=Object.values(event.mentions||{});
          let pairText=names.length>=2?`${names[0]} + ${names[1]}`:names[0]?`${names[0]} + You`: `You + Someone`;
          return reply(`💞 Ship: ${pairText} = ${percent}% compatible! ${percent>80?"Perfect match! ❤️":percent>50?"Good!":"Bruh 😆"}`,event);
        }
      }
      if(name=="kiss"||name=="hug"||name=="slap"){
        let target=Object.values(event.mentions||{})[0]||"someone";
        let action=name=="kiss"?"kissed":name=="hug"?"hugged":"slapped";
        return reply(`💋 You ${action} ${target}! ${name=="kiss"?"Mwah! 😘":name=="hug"?"Aww! 🤗":"Ouch! 😆"}`,event);
      }
      if(name=="flip") return reply(`🪙 Coin: ${Math.random()>0.5?"Heads!":"Tails!"}`,event);
      if(name=="dice") return reply(`🎲 You rolled: ${Math.floor(Math.random()*6)+1}`,event);
      if(name=="slot"){
        let emojis=["🍒","🍋","🔔","💎","7️⃣"];
        let s=[random(emojis),random(emojis),random(emojis)];
        let win=s[0]==s[1]&&s[1]==s[2]?"JACKPOT! 🎉":"Try again!";
        return reply(`🎰 [ ${s.join(" | ")} ]\n${win}`,event);
      }
      if(name=="math"||name=="calc"){
        try{ let res=eval(fullRest); return reply(`🧮 ${fullRest} = ${res}`,event); }catch{ return reply("❌ Invalid math! Ex: !math 2+2",event); }
      }
      if(name=="sim"){
