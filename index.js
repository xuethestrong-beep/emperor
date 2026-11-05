const fs=require("fs"),path=require("path");
const login=require("ws3-fca");

let appState;
if(process.env.APPSTATE){
try{
appState=JSON.parse(process.env.APPSTATE);
console.log("Using APPSTATE from Railway - 3.8 Flash!");
}catch(e){
appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}
}else{
appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}

login({appState},(err,api)=>{
if(err){console.error("LOGIN FAILED:",err);return;}
console.log("Emperor Started with Gemini 3.8 Flash!");

require("http").createServer((a,b)=>b.end("Alive 3.8")).listen(process.env.PORT||3000);
api.setOptions({listenEvents:true,selfListen:false});

api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message"&&event.type!=="message_reply")return;
const body=(event.body||"").trim();
if(!body)return;

try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// SPECIFIC - NEW MODEL FOR NEW KEYS
const model=genAI.getGenerativeModel({model:"gemini-3.8-flash"});
const result=await model.generateContent(body);
api.sendMessage(result.response.text(),event.threadID,event.messageID);
}catch(e){
console.log("Error:",e.message);
// FALLBACK if 3.8 is full
if(e.message.includes("404")||e.message.includes("3.8")){
try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI2=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model2=genAI2.getGenerativeModel({model:"gemini-3.5-flash"});
const result2=await model2.generateContent(event.body);
api.sendMessage(result2.response.text(),event.threadID,event.messageID);
return;
}catch(e2){}
}
api.sendMessage("Error: "+e.message,event.threadID);
}
});
});
