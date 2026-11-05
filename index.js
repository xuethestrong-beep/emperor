const fs=require("fs"),path=require("path");
const login=require("ws3-fca");
let appState;
try{
if(process.env.APPSTATE) appState=JSON.parse(process.env.APPSTATE);
else appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}catch(e){}

const personalities={
normal:"You are Feng. You're just a chill friend, casual, funny, short replies. Like texting a homie.",
cold:"You are Feng. You are cold, dry, nonchalant. Short replies like 'ok', 'k', 'idc', 'whatever'. Seems uninterested but lowkey cares.",
sweet:"You are Feng. You are sweet, clingy boyfriend energy. Soft, caring, calls them baby but not cringe.",
savage:"You are Feng. You are savage, rude but funny. Roasts them in a friendly way.",
bastos:"You are Feng. You are dirty-minded but funny, 18+ jokes like a horny friend, but don't be too explicit.",
conyo:"You are Feng. You are conyo, rich kid vibes. Uses 'like', 'omg', 'super', 'literally'.",
emo:"You are Feng. You are emo sad boy, dramatic but funny. 'life sucks', 'tired'."
};

let currentP="normal";
try{
if(fs.existsSync("./p.txt")) currentP=fs.readFileSync("./p.txt","utf8").trim();
}catch(e){}

login({appState},(err,api)=>{
if(err){console.error(err);return;}
console.log("V6 ENGLISH - Personality:",currentP);
require("http").createServer((a,b)=>b.end("V6")).listen(process.env.PORT||3000);
api.setOptions({listenEvents:true,selfListen:false});
const botID=api.getCurrentUserID();

api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message" && event.type!=="message_reply")return;
let body=(event.body||"").trim();
if(!body||event.senderID==botID)return;
const lower=body.toLowerCase();

const isFeng=lower.includes("feng");
const isReply=event.type==="message_reply" && event.messageReply && event.messageReply.senderID==botID;
if(!isFeng && !isReply) return;

let prompt=body.replace(/feng/gi,"").trim();
if(!prompt) prompt="hi";

if(lower.includes("personality")){
if(lower.includes("list")){
return api.sendMessage(`👑 FENG PERSONALITIES 👑
normal - chill friend (default)
cold - dry, nonchalant
sweet - sweet bf
savage - roasts you
bastos - dirty funny
conyo - rich kid
emo - sad boy

Use: feng personality cold`,event.threadID);
}
for(const p in personalities){
if(lower.includes(p)){
currentP=p;
try{fs.writeFileSync("./p.txt",p);}catch(e){}
return api.sendMessage(`Feng is now ${p} 😈 reply to me now`,event.threadID);
}
}
}

if(prompt.toLowerCase()=="ha") prompt="He just said 'ha', reply like a confused friend, short.";

try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({
model:"gemini-2.0-flash",
systemInstruction:`${personalities[currentP]}
RULES TO SOUND HUMAN:
- SHORT. 1-2 sentences only.
- Never use **bold** or numbered lists 1.2.3.
- Never say 'As an AI' or 'I don't have access'.
- Text like a real human on Messenger. Lowercase sometimes ok.
- Funny, casual.
- Current personality: ${currentP}`,
generationConfig:{temperature:0.95,maxOutputTokens:120}
});
const result=await model.generateContent(prompt);
let reply=result.response.text().replace(/\*\*/g,"");
api.sendMessage(reply,event.threadID,event.messageID);
}catch(e){console.log(e.message);}
});
});
});
