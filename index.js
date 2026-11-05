const Groq = require("groq-sdk");
let login;
try{ let f=require("ws3-fca"); login=f.default||f.login||f; }catch{ login=require("fca-unofficial"); }
let appState = JSON.parse(process.env.APPSTATE);
let groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log("FENG V36 DEBUG MODE");

login({appState},(err,api)=>{
 if(err){ console.log(err); return; }
 console.log("FENG ONLINE ID:",api.getCurrentUserID());
 require("http").createServer((_,r)=>r.end("OK")).listen(process.env.PORT||3000);
 api.setOptions({listenEvents:true,selfListen:false,updatePresence:true});

 api.listenMqtt(async(err,event)=>{
  console.log("EVENT RECEIVED:", event ? event.type + " " + (event.body||"").slice(0,30) : "no event");
  if(err||!event.body) return;
  if(event.senderID==api.getCurrentUserID()) return;
  
  if(!event.body.toLowerCase().includes("feng")) return;
  
  console.log("FENG TRIGGERED BY:",event.body);
  
  // INSTANT REPLY TO PROVE IT WORKS
  api.sendMessage("Got your msg lods! Thinking...",event.threadID);

  try{
   let c = await groq.chat.completions.create({
    model:"openai/gpt-oss-20b",
    messages:[{role:"user",content:event.body}],
    max_tokens:60
   });
   api.sendMessage(c.choices[0].message.content,event.threadID);
  }catch(e){
   console.log("GROQ FAIL:",e.message);
   api.sendMessage("Groq fail: "+e.message.slice(0,80),event.threadID);
  }
 });
});
