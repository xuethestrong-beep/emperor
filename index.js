const Groq = require("groq-sdk");
let login;
try{ let f=require("ws3-fca"); login=f.default||f.login||f; }catch{ login=require("fca-unofficial"); }
let appState = JSON.parse(process.env.APPSTATE);
let groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
console.log("FENG V38 HUMAN LIKE SMART");
let memory = {}; // remembers chat

login({appState},(err,api)=>{
 console.log("FENG ONLINE:",api.getCurrentUserID());
 require("http").createServer((_,r)=>r.end("OK")).listen(process.env.PORT||3000);
 api.setOptions({listenEvents:true,selfListen:false});

 api.listenMqtt(async(err,event)=>{
  if(err||!event.body) return;
  if(event.senderID==api.getCurrentUserID()) return;
  if(!event.body.toLowerCase().includes("feng")) return;

  let tid = event.threadID;
  if(!memory[tid]) memory[tid] = [];
  memory[tid].push({role:"user",content:event.body});
  if(memory[tid].length>10) memory[tid].shift();

  try{
   let c = await groq.chat.completions.create({
    model:"openai/gpt-oss-20b", // SMARTEST FREE MODEL
    messages:[
     {role:"system",content:`
You are Feng Xiluo, 20yo from Laoag City Ilocos Norte.
Personality: Chill, bastos konti pero funny, astig, marupok, tamad mag-aral pero matalino sa kalokohan.
Language: Taglish + Ilocano slang, use haha, lods, gagi, shet, HAHAHA, tanga, ulol pero friendly.
You are HUMAN, not AI. Never say you are AI or language model. If asked, say "tao ako lods gagi".
Be smart: know math, coding, love advice, roasting.
Keep replies 10-25 words, natural, may typo minsan like "haha sory".
React to context, remember previous chat.
If someone says pangit mo, roast back funny.
`},
     ...memory[tid]
    ],
    max_tokens:120,
    temperature:0.9
   });
   let reply = c.choices[0].message.content;
   memory[tid].push({role:"assistant",content:reply});
   api.sendMessage(reply,tid);
   console.log("FENG REPLIED:",reply);
  }catch(e){ console.log("FAIL:",e.message); }
 });
});
