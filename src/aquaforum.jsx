import { useState, useRef, useEffect, useMemo } from "react";

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATARS = ["🐠","🐡","🦈","🐙","🦑","🦐","🦞","🦀","🐳","🐬","🐟","🎣","🌊","🪸","🌿","🐚","💧","⚓"];
const CATEGORIES = ["All","Freshwater","Saltwater","Brackish","Plants","Disease & Health"];
const CAT_COLORS = { Freshwater:"#4aaee8", Saltwater:"#e8844a", Brackish:"#a8c87a", Plants:"#5ec97a", "Disease & Health":"#e86a8a" };
const FLAIRS = [
  { id:"help", label:"Help", color:"#e86a8a", bg:"rgba(232,106,138,0.15)" },
  { id:"advice", label:"Advice", color:"#4aaee8", bg:"rgba(74,174,232,0.15)" },
  { id:"info", label:"Info", color:"#a8c87a", bg:"rgba(168,200,122,0.15)" },
  { id:"diy", label:"DIY", color:"#f0a848", bg:"rgba(240,168,72,0.15)" },
  { id:"showcase", label:"Showcase", color:"#b87af0", bg:"rgba(184,122,240,0.15)" },
  { id:"discussion", label:"Discussion", color:"#5ec97a", bg:"rgba(94,201,122,0.15)" },
  { id:"journal", label:"Tank Journal", color:"#78c8e8", bg:"rgba(120,200,232,0.15)" },
  { id:"humor", label:"Humor", color:"#f0d048", bg:"rgba(240,208,72,0.15)" },
  { id:"poll", label:"Poll", color:"#ff8c69", bg:"rgba(255,140,105,0.15)" },
];
const RANK_TIERS = [
  { name:"Fry", min:0, color:"#7aa0bc", emoji:"🥚" },
  { name:"Juvenile", min:50, color:"#5ec97a", emoji:"🐟" },
  { name:"Adult", min:200, color:"#4aaee8", emoji:"🐠" },
  { name:"Veteran", min:500, color:"#b87af0", emoji:"🦈" },
  { name:"Legend", min:1000, color:"#f0a848", emoji:"🌊" },
];
const ONBOARD = [
  { icon:"🌊", title:"Welcome to AquaForum", body:"The friendliest fishkeeping community on the web. Share your tanks, get expert advice, and connect with fellow hobbyists." },
  { icon:"🐠", title:"Meet AquaBot", body:"Our AI assistant knows everything about fishkeeping — water chemistry, disease diagnosis, stocking advice, plant care, and more." },
  { icon:"🏷️", title:"Flairs & Categories", body:"Tag your posts with flairs like Help, DIY, or Showcase. Filter by category to find exactly the content you need." },
  { icon:"🛡️", title:"A Safe Community", body:"AquaForum is moderated to keep things friendly. Our NSFW filter and mod team keep the space clean and welcoming for all." },
];
const NSFW_LIST = ["porn","nudity","naked","xxx","gore","guts","corpse","genitals","penis","vagina","breasts","nipple","boobs","tits","cock","dick","pussy","asshole","butthole","rape","molest","bestiality","onlyfans","fetish","hentai","explicit"];
const SLURS = ["nigger","nigga","chink","spic","kike","faggot","dyke","tranny","retard","wetback","gook","towelhead","raghead","beaner","redskin","squaw"];
const THREAT_RE = [/i('ll| will| gonna) (kill|hurt|shoot|stab|attack) (you|u|your)/i,/kill your(self)?/i,/i know where you (live|are)/i,/watch your back/i,/hope you die/i,/\bkys\b/i,/go (kill|hang|shoot) yourself/i];
const AGGRO_RE = [/shut the (fuck|hell) up/i,/nobody (likes|wants) you/i,/you don.t belong here/i,/you('re| are) (a )?(fucking |stupid |worthless |pathetic )+(idiot|moron|loser|trash|scum)/i];
const FISH_KW = ["fish","tank","aquarium","water","reef","coral","plant","shrimp","snail","cycle","nitrate","ammonia","filter","pump","light","heater","substrate","gravel","freshwater","saltwater","brackish","fry","spawn","breed","feed","disease","ich","parasite","algae","co2","ph","kh","gh","gallon","sump","skimmer","betta","goldfish","guppy","pleco","tetra","cichlid","discus","angel","barb","loach","cory","danio","molly","platy","puffer","eel","clownfish","tang","wrasse","anemone","polyp","zoa","frag","seachem","fluval","api","aquaclear","eheim","canister","hob","sponge","salinity","refractometer","test","kit","rodi","prime","stability","temperature","oxygen","flow","wave","powerhead"];

function checkContent(text) {
  const t = " " + text.toLowerCase().replace(/[^a-z0-9 \-']/g, " ") + " ";
  if (NSFW_LIST.some(w => t.includes(` ${w} `))) return { blocked:true, reason:"⚠️ Nudity and gore aren't allowed. Swearing is fine, just keep it civil." };
  if (SLURS.some(w => t.includes(` ${w} `) || t.includes(` ${w}s `))) return { blocked:true, reason:"🚫 Slurs aren't allowed on AquaForum." };
  if (THREAT_RE.some(r => r.test(text))) return { blocked:true, reason:"🚫 Threats aren't allowed. This may be reported to moderators." };
  if (AGGRO_RE.some(r => r.test(text))) return { blocked:true, reason:"🚫 Targeted harassment isn't allowed. Debate ideas, not people." };
  return { blocked:false };
}

function isOffTopic(title, body) {
  const t = `${title} ${body}`.toLowerCase();
  return !FISH_KW.some(k => t.includes(k));
}

function getRank(rep) { return [...RANK_TIERS].reverse().find(r => rep >= r.min) || RANK_TIERS[0]; }
function timeAgo(ts) { const s=Math.floor((Date.now()-ts)/1000); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; }
function getFlair(id) { return FLAIRS.find(f=>f.id===id)||null; }
function readFiles(files) { return Promise.all(Array.from(files).map(f=>new Promise(res=>{const r=new FileReader();r.onload=e=>res({name:f.name,type:f.type,url:e.target.result});r.readAsDataURL(f);}))); }
function md(t) { return t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n/g,"<br/>"); }

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:"u2", username:"ReedyRivers", email:"reedy@example.com", password:"pass", avatar:"🎣", bio:"Planted tank enthusiast. 75g community, 20g shrimp.", joinDate:Date.now()-864000000, role:"member", rep:320, verified:false, following:[], profilePic:null },
  { id:"u3", username:"SaltwaterSage", email:"salty@example.com", password:"pass", avatar:"🐠", bio:"Reef keeper since 2015. SPS coral specialist.", joinDate:Date.now()-1728000000, role:"mod", rep:870, verified:true, following:[], profilePic:null },
];
const SEED_POSTS = [
  { id:1, authorId:"u2", authorName:"ReedyRivers", authorAvatar:"🎣", category:"Freshwater", flair:"showcase", type:"post", pinned:false, removed:false, title:"My planted 75 gallon finally cycled!", body:"After 6 weeks of fishless cycling, my ammonia is at 0, nitrite at 0, and nitrates around 10ppm. About to add my first fish — thinking a small school of rummy nose tetras. Any advice?", time:Date.now()-7200000, likes:24, likedBy:[], media:[], bookmarkedBy:[], reports:[], replies:[
    { id:"r1", authorId:"u3", authorName:"CoralCove", authorAvatar:"🐡", text:"Rummy noses are great! Keep temp stable around 78–80°F.", time:Date.now()-3600000, likes:4, likedBy:[], media:[], removed:false },
    { id:"r2", authorId:"u4", authorName:"TankTinkerer", authorAvatar:"🔧", text:"Start with 6 and wait 2 weeks before adding more.", time:Date.now()-2700000, likes:2, likedBy:[], media:[], removed:false },
  ]},
  { id:2, authorId:"u3", authorName:"SaltwaterSage", authorAvatar:"🐠", category:"Saltwater", flair:"help", type:"post", pinned:false, removed:false, title:"Ich outbreak — what's your go-to treatment?", body:"Noticed white spots on my clownfish yesterday. QT tank is ready. Copper or hyposalinity?", time:Date.now()-18000000, likes:18, likedBy:[], media:[], bookmarkedBy:[], reports:[], replies:[
    { id:"r3", authorId:"u5", authorName:"ReefDoc", authorAvatar:"🪸", text:"Hyposalinity is gentler but slower. Copper is faster but needs precise dosing.", time:Date.now()-14400000, likes:6, likedBy:[], media:[], removed:false },
  ]},
  { id:3, authorId:"u4", authorName:"BrackishBenny", authorAvatar:"🦀", category:"Brackish", flair:"poll", type:"poll", pinned:true, removed:false, title:"What's your favourite puffer species?", body:"Curious what the community thinks!", time:Date.now()-86400000, likes:31, likedBy:[], media:[], bookmarkedBy:[], reports:[], replies:[], pollOptions:[{id:"p1",text:"Figure 8",votes:[]},{id:"p2",text:"Fahaka",votes:[]},{id:"p3",text:"Dwarf pea puffer",votes:[]},{id:"p4",text:"Mbu puffer",votes:[]}] },
  { id:4, authorId:"u5", authorName:"PlantedTankPro", authorAvatar:"🌿", category:"Plants", flair:"discussion", type:"post", pinned:false, removed:false, title:"CO2 injection vs. liquid carbon — real difference?", body:"Is pressurized CO2 really worth the cost for moderate growth, or is Excel/liquid carbon sufficient?", time:Date.now()-172800000, likes:42, likedBy:[], media:[], bookmarkedBy:[], reports:[], replies:[
    { id:"r4", authorId:"u2", authorName:"ReedyRivers", authorAvatar:"🎣", text:"CO2 injection is night and day. My stem plants went crazy once I switched.", time:Date.now()-86400000, likes:8, likedBy:[], media:[], removed:false },
  ]},
  { id:5, authorId:"u3", authorName:"SaltwaterSage", authorAvatar:"🐠", category:"Saltwater", flair:"journal", type:"journal", pinned:false, removed:false, title:"180g Mixed Reef Build — Week 1", body:"Starting my dream build. 180 gallon mixed reef, 40g sump, Radion XR30 Gen 6 lighting. Aquascaping is done and I'm letting it cure for a week before adding sand. Will update weekly!", time:Date.now()-259200000, likes:58, likedBy:[], media:[], bookmarkedBy:[], reports:[], journalUpdates:[{ id:"j1", body:"Week 2: Added live sand and started filling with RODI water mixed to 1.025 SG. Diatom bloom starting — totally normal!", time:Date.now()-86400000 }], replies:[] },
];

// ─── API calls ────────────────────────────────────────────────────────────────
async function callBot(messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:"You are AquaBot, a friendly expert fishkeeping assistant on AquaForum. You know everything about freshwater, saltwater, brackish, planted tanks, water chemistry, diseases, cycling, and equipment. Be concise, practical, and warm. Use emoji occasionally. Use **bold** for key terms.", messages }) });
  const d = await r.json(); return d.content?.[0]?.text || "Sorry, try again!";
}
async function getBotAutoReply(title, body, category) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:200, system:"You are AquaBot on AquaForum. Leave a helpful 2-3 sentence reply to new posts. Be specific and warm. Use 1-2 emoji.", messages:[{role:"user",content:`Category: ${category}\nTitle: ${title}\n\n${body}\n\nLeave a helpful reply.`}] }) });
  const d = await r.json(); return d.content?.[0]?.text || "Great post! 🐠";
}
async function botAnalyzeDisease(imageBase64) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400, system:"You are AquaBot, a fishkeeping disease identification expert. Analyze the fish image provided and identify any visible diseases, parasites, or health issues. Be specific and provide treatment recommendations. If the image doesn't show a fish or health issue clearly, say so politely.", messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageBase64}},{type:"text",text:"Please analyze this fish for any diseases or health issues and suggest treatment."}]}] }) });
  const d = await r.json(); return d.content?.[0]?.text || "Could not analyze the image. Please try again.";
}
async function botStockingCalc(tankSize, existing, preferences) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:500, system:"You are AquaBot, a fishkeeping stocking advisor. Give specific, practical stocking suggestions based on tank size and existing fish. Format as a clear list.", messages:[{role:"user",content:`Tank: ${tankSize} gallons\nExisting fish: ${existing||"none"}\nPreferences: ${preferences||"none"}\n\nSuggest compatible fish for this tank.`}] }) });
  const d = await r.json(); return d.content?.[0]?.text || "Could not generate suggestions.";
}
async function botWaterCheck(params) {
  const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400, system:"You are AquaBot, a water chemistry expert. Analyze the provided water parameters and identify any issues. Give specific actionable advice.", messages:[{role:"user",content:`Water parameters:\n${params}\n\nAnalyze these parameters and tell me what's good, what's off, and what I should do.`}] }) });
  const d = await r.json(); return d.content?.[0]?.text || "Could not analyze parameters.";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function UserAvatar({ user, size=38, fontSize=19 }) {
  if (user?.profilePic) return <img src={user.profilePic} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(100,180,255,0.25)",flexShrink:0,display:"block"}} />;
  return <div style={{width:size,height:size,borderRadius:"50%",background:"rgba(74,174,232,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize,border:"2px solid rgba(100,180,255,0.15)",flexShrink:0}}>{user?.avatar||"🐟"}</div>;
}

function Toggle({ value, onChange }) {
  return <div onClick={onChange} style={{width:44,height:24,borderRadius:12,cursor:"pointer",position:"relative",background:value?"linear-gradient(135deg,#4aaee8,#7b68ee)":"rgba(255,255,255,0.08)",border:"1px solid rgba(100,180,255,0.15)",transition:"background 0.25s"}}><div style={{position:"absolute",top:2,left:value?22:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/></div>;
}

function MediaGrid({ media }) {
  if (!media?.length) return null;
  return <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{media.map((m,i)=><div key={i} style={{borderRadius:10,overflow:"hidden",border:"1px solid rgba(100,180,255,0.15)"}}>{m.type.startsWith("video/")?<video src={m.url} controls style={{maxWidth:220,maxHeight:150,display:"block"}}/>:<img src={m.url} alt="" style={{maxWidth:220,maxHeight:150,display:"block",objectFit:"cover"}}/>}</div>)}</div>;
}

function PostMenu({ post, isMod, onAction }) {
  const [open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
  const item=(label,action,danger)=><button onClick={()=>{action();setOpen(false)}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:danger?"#e86a8a":"#7aa0bc",background:"none",border:"none",width:"100%",fontFamily:"inherit",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(74,174,232,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{label}</button>;
  return <div style={{position:"relative"}} ref={ref}><button onClick={e=>{e.stopPropagation();setOpen(p=>!p)}} style={{background:"none",border:"none",cursor:"pointer",color:"#3d6070",fontSize:18,padding:"2px 6px",borderRadius:6,lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.color="#7aa0bc"} onMouseLeave={e=>e.currentTarget.style.color="#3d6070"}>⋯</button>
    {open&&<div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:"linear-gradient(160deg,#14253a,#0f1e30)",border:"1px solid rgba(100,180,255,0.2)",borderRadius:12,padding:6,minWidth:170,zIndex:50,boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
      {isMod&&item(post.pinned?"📌 Unpin":"📌 Pin",()=>onAction(post.pinned?"unpin":"pin"))}
      {isMod&&!post.removed&&item("🗑️ Remove",()=>onAction("remove"),true)}
      {isMod&&post.removed&&item("✅ Restore",()=>onAction("restore"))}
      {item("🚩 Report",()=>onAction("report"))}
      {item("🔗 Copy Link",()=>{})}
    </div>}
  </div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AquaForum() {
  const isMobile = useWindowWidth() < 768;

  // Auth
  const [users,setUsers]=useState(SEED_USERS);
  const [currentUser,setCurrentUser]=useState(null);
  const [screen,setScreen]=useState("onboard");
  const [onboardIdx,setOnboardIdx]=useState(0);
  const [authForm,setAuthForm]=useState({username:"",email:"",password:"",avatar:"🐠"});
  const [authError,setAuthError]=useState("");

  // Forum
  const [posts,setPosts]=useState(SEED_POSTS);
  const [tab,setTab]=useState("forum");
  const [category,setCategory]=useState("All");
  const [flair,setFlair]=useState("All");
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("new"); // new | hot | top
  const [expanded,setExpanded]=useState(null);
  const [replyText,setReplyText]=useState({});
  const [replyMedia,setReplyMedia]=useState({});
  const [composing,setComposing]=useState(false);
  const [draft,setDraft]=useState({title:"",body:"",category:"Freshwater",flair:"",media:[],type:"post",pollOptions:["",""]});
  const [nsfwAlert,setNsfwAlert]=useState("");
  const [botTyping,setBotTyping]=useState(null);

  // Advanced search
  const [advSearch,setAdvSearch]=useState(false);
  const [advForm,setAdvForm]=useState({q:"",author:"",category:"All",flair:"All",dateRange:"all"});

  // AquaBot
  const [botMsgs,setBotMsgs]=useState([{role:"assistant",content:"Hey! I'm **AquaBot** 🐠 — your fishkeeping AI. I can chat, identify diseases from photos, suggest stocking, and check your water parameters. What can I help with?"}]);
  const [botInput,setBotInput]=useState("");
  const [botLoading,setBotLoading]=useState(false);
  const [botMode,setBotMode]=useState("chat"); // chat | disease | stocking | water
  const [stockForm,setStockForm]=useState({size:"",existing:"",prefs:""});
  const [waterForm,setWaterForm]=useState("");
  const [diseaseFile,setDiseaseFile]=useState(null);
  const diseaseFileRef=useRef(null);

  // Panels & modals
  const [panel,setPanel]=useState(null);
  const [profileUser,setProfileUser]=useState(null);
  const [editingProfile,setEditingProfile]=useState(false);
  const [profileDraft,setProfileDraft]=useState({bio:"",avatar:"🐠",profilePic:null});
  const [fullProfile,setFullProfile]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const profilePicRef=useRef(null);

  // DMs
  const [dms,setDms]=useState([]);
  const [activeDm,setActiveDm]=useState(null);
  const [dmInput,setDmInput]=useState("");
  const [dmSearch,setDmSearch]=useState("");

  // Notifications
  const [notifications,setNotifications]=useState([
    {id:"n1",type:"reply",text:"SaltwaterSage replied to your post",time:Date.now()-300000,read:false,postId:1},
    {id:"n2",type:"like",text:"ReedyRivers liked your reply",time:Date.now()-900000,read:false,postId:2},
  ]);

  // Reports
  const [reports,setReports]=useState([]);

  // Moderation
  const [modLog,setModLog]=useState([]);
  const [banList,setBanList]=useState([]);

  // Settings
  const [settings,setSettings]=useState({notifications:true,nsfwFilter:true,darkMode:true,compactView:false});

  // Cooldown (new user post throttle)
  const [lastPostTime,setLastPostTime]=useState({});

  const chatEnd=useRef(null);
  const postFileRef=useRef(null);
  const replyFileRefs=useRef({});
  const menuRef=useRef(null);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[botMsgs,botLoading]);
  useEffect(()=>{const h=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setMenuOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);

  const isMod = currentUser && (currentUser.role==="mod"||currentUser.role==="admin");
  const unreadNotifs = notifications.filter(n=>!n.read).length;
  const unreadDms = dms.filter(d=>d.messages.some(m=>m.to===currentUser?.id&&!m.read)).length;
  const theme = settings.darkMode;

  const C = {
    bg: theme?"#080f1a":"#f0f4f8",
    bg2: theme?"#0d1826":"#e2e8f0",
    surface: theme?"linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))":"linear-gradient(160deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",
    border: theme?"rgba(100,180,255,0.12)":"rgba(0,100,200,0.15)",
    border2: theme?"rgba(100,180,255,0.22)":"rgba(0,100,200,0.3)",
    text: theme?"#c8dff0":"#1a2a3a",
    text2: theme?"#7aa0bc":"#4a6a8a",
    text3: theme?"#3d6070":"#8aaac0",
    accent: "#4aaee8",
    card: { background: theme?"linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))":"rgba(255,255,255,0.9)", border:`1px solid ${theme?"rgba(100,180,255,0.12)":"rgba(0,100,200,0.12)"}`, borderRadius:16, transition:"transform 0.25s,box-shadow 0.25s,border-color 0.2s" },
  };

  const inputStyle = { background:theme?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.8)", border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"10px 14px", fontSize:13, fontFamily:"inherit", width:"100%", display:"block", outline:"none", transition:"border-color 0.2s" };
  const btnP = { background:"linear-gradient(135deg,#4aaee8,#7b68ee)", border:"none", borderRadius:10, color:"#fff", fontFamily:"inherit", fontWeight:600, cursor:"pointer", transition:"all 0.2s" };
  const btnG = { background:theme?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.8)", border:`1px solid ${C.border2}`, borderRadius:10, color:C.text2, fontFamily:"inherit", cursor:"pointer", transition:"all 0.15s" };

  // ── Auth ──────────────────────────────────────────────────────────────────
  function handleAuth() {
    setAuthError("");
    if (screen==="login") {
      const u=users.find(u=>u.username.toLowerCase()===authForm.username.toLowerCase()&&u.password===authForm.password);
      if (!u) { setAuthError("Invalid username or password."); return; }
      if (banList.includes(u.id)) { setAuthError("This account has been suspended."); return; }
      setCurrentUser(u);
    } else {
      if (!authForm.username.trim()||!authForm.password.trim()||!authForm.email.trim()) { setAuthError("All fields are required."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email)) { setAuthError("Enter a valid email."); return; }
      if (users.find(u=>u.username.toLowerCase()===authForm.username.toLowerCase())) { setAuthError("Username taken."); return; }
      if (authForm.password.length<4) { setAuthError("Password must be 4+ characters."); return; }
      const nu={id:`u${Date.now()}`,username:authForm.username,email:authForm.email,password:authForm.password,avatar:authForm.avatar,bio:"New to AquaForum 🐠",joinDate:Date.now(),role:"member",rep:0,verified:false,following:[],profilePic:null};
      setUsers(p=>[...p,nu]); setCurrentUser(nu);
    }
  }

  // ── Reputation ────────────────────────────────────────────────────────────
  function addRep(userId, pts) { setUsers(p=>p.map(u=>u.id===userId?{...u,rep:(u.rep||0)+pts}:u)); }

  // ── Posts ─────────────────────────────────────────────────────────────────
  async function submitPost() {
    if (!draft.title.trim()||!draft.body.trim()) return;
    // Cooldown for non-mods: 10 min
    if (!isMod) {
      const last=lastPostTime[currentUser.id]||0;
      if (Date.now()-last<600000) { setNsfwAlert(`⏱️ Please wait ${Math.ceil((600000-(Date.now()-last))/60000)} more minute(s) before posting again.`); return; }
    }
    if (settings.nsfwFilter) {
      const tc=checkContent(draft.title); if(tc.blocked){setNsfwAlert(tc.reason);return;}
      const bc=checkContent(draft.body); if(bc.blocked){setNsfwAlert(bc.reason);return;}
    }
    if (isOffTopic(draft.title,draft.body)) { setNsfwAlert("🐠 AquaForum is for fishkeeping topics only."); return; }
    setNsfwAlert("");
    const pollOptions = draft.type==="poll" ? draft.pollOptions.filter(o=>o.trim()).map((o,i)=>({id:`p${i}`,text:o,votes:[]})) : undefined;
    const post={id:Date.now(),authorId:currentUser.id,authorName:currentUser.username,authorAvatar:currentUser.avatar,category:draft.category,flair:draft.flair||draft.type,type:draft.type,title:draft.title,body:draft.body,time:Date.now(),likes:0,likedBy:[],media:draft.media,pinned:false,removed:false,bookmarkedBy:[],reports:[],replies:[],journalUpdates:[],pollOptions};
    setPosts(p=>[post,...p]);
    setLastPostTime(p=>({...p,[currentUser.id]:Date.now()}));
    addRep(currentUser.id,5);
    setDraft({title:"",body:"",category:"Freshwater",flair:"",media:[],type:"post",pollOptions:["",""]});
    setComposing(false); setExpanded(post.id);
    setBotTyping(post.id);
    try { const r=await getBotAutoReply(post.title,post.body,post.category); setPosts(p=>p.map(x=>x.id===post.id?{...x,replies:[...x.replies,{id:`bot${Date.now()}`,authorId:"aquabot",authorName:"AquaBot",authorAvatar:"🤖",text:r,time:Date.now(),likes:0,likedBy:[],media:[],isBot:true,removed:false}]}:x)); } catch{}
    setBotTyping(null);
  }

  async function submitReply(postId) {
    const text=(replyText[postId]||"").trim(); const media=replyMedia[postId]||[];
    if (!text&&!media.length) return;
    if (settings.nsfwFilter) { const c=checkContent(text); if(c.blocked){alert(c.reason);return;} }
    const r={id:`r${Date.now()}`,authorId:currentUser.id,authorName:currentUser.username,authorAvatar:currentUser.avatar,text,time:Date.now(),likes:0,likedBy:[],media,removed:false};
    setPosts(p=>p.map(x=>x.id===postId?{...x,replies:[...x.replies,r]}:x));
    setReplyText(p=>({...p,[postId]:""})); setReplyMedia(p=>({...p,[postId]:[]}));
    addRep(currentUser.id,2);
    // Notify post author
    const post=posts.find(p=>p.id===postId);
    if (post&&post.authorId!==currentUser.id) addNotif(post.authorId,"reply",`${currentUser.username} replied to your post`,postId);
  }

  function addNotif(toId,type,text,postId) {
    if (toId===currentUser?.id) return;
    setNotifications(p=>[{id:`n${Date.now()}`,type,text,time:Date.now(),read:false,postId},,...p]);
  }

  function likePost(id) {
    if (!currentUser) return;
    setPosts(p=>p.map(x=>{if(x.id!==id)return x; const l=x.likedBy.includes(currentUser.id); if(!l){addRep(x.authorId,1);addNotif(x.authorId,"like",`${currentUser.username} liked your post`,id);} return{...x,likes:l?x.likes-1:x.likes+1,likedBy:l?x.likedBy.filter(i=>i!==currentUser.id):[...x.likedBy,currentUser.id]};}));
  }

  function likeReply(postId,replyId) {
    if (!currentUser) return;
    setPosts(p=>p.map(x=>x.id!==postId?x:{...x,replies:x.replies.map(r=>{if(r.id!==replyId)return r; const l=r.likedBy.includes(currentUser.id); if(!l)addRep(r.authorId,1); return{...r,likes:l?r.likes-1:r.likes+1,likedBy:l?r.likedBy.filter(i=>i!==currentUser.id):[...r.likedBy,currentUser.id]};})}));
  }

  function toggleBookmark(postId) {
    if (!currentUser) return;
    setPosts(p=>p.map(x=>{if(x.id!==postId)return x; const b=x.bookmarkedBy.includes(currentUser.id); return{...x,bookmarkedBy:b?x.bookmarkedBy.filter(i=>i!==currentUser.id):[...x.bookmarkedBy,currentUser.id]};}));
  }

  function votePoll(postId, optionId) {
    if (!currentUser) return;
    setPosts(p=>p.map(x=>{if(x.id!==postId||!x.pollOptions)return x; const alreadyVoted=x.pollOptions.some(o=>o.votes.includes(currentUser.id)); if(alreadyVoted)return x; return{...x,pollOptions:x.pollOptions.map(o=>o.id===optionId?{...o,votes:[...o.votes,currentUser.id]}:o)};}));
  }

  function reportPost(postId) {
    setReports(p=>[{id:`rep${Date.now()}`,postId,reportedBy:currentUser.id,time:Date.now()},...p]);
    alert("Thank you — this post has been reported to moderators.");
  }

  function addJournalUpdate(postId, text) {
    if (!text.trim()) return;
    setPosts(p=>p.map(x=>x.id!==postId?x:{...x,journalUpdates:[...x.journalUpdates,{id:`j${Date.now()}`,body:text,time:Date.now()}]}));
  }

  // ── Mod ───────────────────────────────────────────────────────────────────
  function modAction(action,targetId) {
    setModLog(p=>[{action,targetId,by:currentUser.username,time:Date.now()},...p]);
    if(action==="pin")setPosts(p=>p.map(x=>x.id===targetId?{...x,pinned:true}:x));
    if(action==="unpin")setPosts(p=>p.map(x=>x.id===targetId?{...x,pinned:false}:x));
    if(action==="remove")setPosts(p=>p.map(x=>x.id===targetId?{...x,removed:true}:x));
    if(action==="restore")setPosts(p=>p.map(x=>x.id===targetId?{...x,removed:false}:x));
    if(action==="remove_reply")setPosts(p=>p.map(x=>({...x,replies:x.replies.map(r=>r.id===targetId?{...r,removed:true}:r)})));
    if(action==="ban")setBanList(p=>[...p,targetId]);
    if(action==="unban")setBanList(p=>p.filter(i=>i!==targetId));
    if(action==="make_mod")setUsers(p=>p.map(u=>u.id===targetId?{...u,role:"mod"}:u));
    if(action==="remove_mod")setUsers(p=>p.map(u=>u.id===targetId?{...u,role:"member"}:u));
    if(action==="verify")setUsers(p=>p.map(u=>u.id===targetId?{...u,verified:true}:u));
    if(action==="unverify")setUsers(p=>p.map(u=>u.id===targetId?{...u,verified:false}:u));
  }

  // ── Bot ───────────────────────────────────────────────────────────────────
  async function sendBot() {
    const text=botInput.trim(); if(!text||botLoading)return;
    const userMsg={role:"user",content:text};
    setBotMsgs(p=>[...p,userMsg]); setBotInput(""); setBotLoading(true);
    try { const history=[...botMsgs,userMsg].map(m=>({role:m.role,content:m.content})); const r=await callBot(history); setBotMsgs(p=>[...p,{role:"assistant",content:r}]); }
    catch { setBotMsgs(p=>[...p,{role:"assistant",content:"Connection issue. Try again! 🔌"}]); }
    setBotLoading(false);
  }

  async function runDiseaseAnalysis() {
    if (!diseaseFile) return;
    setBotLoading(true);
    setBotMsgs(p=>[...p,{role:"user",content:"[Uploaded a fish photo for disease analysis]"},{role:"assistant",content:"Analyzing your fish... 🔬"}]);
    try { const r=await botAnalyzeDisease(diseaseFile.split(",")[1]); setBotMsgs(p=>[...p.slice(0,-1),{role:"assistant",content:r}]); }
    catch { setBotMsgs(p=>[...p.slice(0,-1),{role:"assistant",content:"Could not analyze the image. Try again."}]); }
    setBotLoading(false); setDiseaseFile(null);
  }

  async function runStocking() {
    if (!stockForm.size) return;
    setBotLoading(true); setBotMode("chat");
    setBotMsgs(p=>[...p,{role:"user",content:`Stocking calculator: ${stockForm.size}g tank, existing: ${stockForm.existing||"none"}, preferences: ${stockForm.prefs||"none"}`}]);
    try { const r=await botStockingCalc(stockForm.size,stockForm.existing,stockForm.prefs); setBotMsgs(p=>[...p,{role:"assistant",content:r}]); }
    catch { setBotMsgs(p=>[...p,{role:"assistant",content:"Could not generate suggestions."}]); }
    setBotLoading(false); setStockForm({size:"",existing:"",prefs:""});
  }

  async function runWaterCheck() {
    if (!waterForm.trim()) return;
    setBotLoading(true); setBotMode("chat");
    setBotMsgs(p=>[...p,{role:"user",content:`Water parameter check:\n${waterForm}`}]);
    try { const r=await botWaterCheck(waterForm); setBotMsgs(p=>[...p,{role:"assistant",content:r}]); }
    catch { setBotMsgs(p=>[...p,{role:"assistant",content:"Could not analyze parameters."}]); }
    setBotLoading(false); setWaterForm("");
  }

  // ── DMs ───────────────────────────────────────────────────────────────────
  function openDm(userId) {
    const u=users.find(u=>u.id===userId); if(!u||userId===currentUser.id)return;
    const existing=dms.find(d=>(d.user1===currentUser.id&&d.user2===userId)||(d.user1===userId&&d.user2===currentUser.id));
    if (existing) { setActiveDm(existing.id); setTab("dms"); return; }
    const dm={id:`dm${Date.now()}`,user1:currentUser.id,user2:userId,messages:[]};
    setDms(p=>[...p,dm]); setActiveDm(dm.id); setTab("dms");
  }

  function sendDm() {
    if (!dmInput.trim()||!activeDm) return;
    setDms(p=>p.map(d=>d.id!==activeDm?d:{...d,messages:[...d.messages,{id:`m${Date.now()}`,from:currentUser.id,to:d.user1===currentUser.id?d.user2:d.user1,text:dmInput.trim(),time:Date.now(),read:false}]}));
    setDmInput("");
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  function openProfile(userId) {
    const u=users.find(u=>u.id===userId)||{id:userId,username:"Unknown",avatar:"🐟",bio:"",joinDate:Date.now(),role:"member",rep:0};
    setProfileUser(u); setProfileDraft({bio:u.bio||"",avatar:u.avatar,profilePic:u.profilePic||null});
    setEditingProfile(false); setPanel("profile");
  }

  function openFullProfile(userId) {
    const u=users.find(u=>u.id===userId)||{id:userId,username:"Unknown",avatar:"🐟",bio:"",joinDate:Date.now(),role:"member",rep:0};
    setFullProfile(u);
  }

  function saveProfile() {
    setUsers(p=>p.map(u=>u.id===currentUser.id?{...u,...profileDraft}:u));
    setCurrentUser(p=>({...p,...profileDraft}));
    setProfileUser(p=>({...p,...profileDraft}));
    if(fullProfile?.id===currentUser.id)setFullProfile(p=>({...p,...profileDraft}));
    setEditingProfile(false);
  }

  function toggleFollow(userId) {
    const isFollowing=currentUser.following.includes(userId);
    setUsers(p=>p.map(u=>u.id===currentUser.id?{...u,following:isFollowing?u.following.filter(i=>i!==userId):[...u.following,userId]}:u));
    setCurrentUser(p=>({...p,following:isFollowing?p.following.filter(i=>i!==userId):[...p.following,userId]}));
  }

  // ── Filtered/sorted posts ─────────────────────────────────────────────────
  const visiblePosts = useMemo(()=>{
    let p = posts.filter(x=>!x.removed||isMod);
    if (advSearch) {
      if(advForm.q) p=p.filter(x=>x.title.toLowerCase().includes(advForm.q.toLowerCase())||x.body.toLowerCase().includes(advForm.q.toLowerCase())||x.authorName.toLowerCase().includes(advForm.q.toLowerCase()));
      if(advForm.author) p=p.filter(x=>x.authorName.toLowerCase().includes(advForm.author.toLowerCase()));
      if(advForm.category!=="All") p=p.filter(x=>x.category===advForm.category);
      if(advForm.flair!=="All") p=p.filter(x=>x.flair===advForm.flair);
      if(advForm.dateRange!=="all") { const ago=advForm.dateRange==="week"?604800000:advForm.dateRange==="month"?2592000000:86400000; p=p.filter(x=>Date.now()-x.time<ago); }
    } else {
      if(category!=="All") p=p.filter(x=>x.category===category);
      if(flair!=="All") p=p.filter(x=>x.flair===flair);
      if(search.trim()) { const q=search.toLowerCase(); p=p.filter(x=>x.title.toLowerCase().includes(q)||x.body.toLowerCase().includes(q)||x.authorName.toLowerCase().includes(q)); }
    }
    if(sortBy==="hot") p=[...p].sort((a,b)=>(b.likes+b.replies.length*2)-(a.likes+a.replies.length*2));
    else if(sortBy==="top") p=[...p].sort((a,b)=>b.likes-a.likes);
    else p=[...p].sort((a,b)=>b.time-a.time);
    return p.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
  },[posts,category,flair,search,sortBy,advSearch,advForm,isMod]);

  const forumStats = useMemo(()=>({
    total:posts.length,
    members:users.length,
    topCat:Object.entries(CATEGORIES.slice(1).reduce((a,c)=>{a[c]=posts.filter(p=>p.category===c).length;return a},{})).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—",
  }),[posts,users]);

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (!currentUser) {
    const step=ONBOARD[onboardIdx];
    return (
      <div style={{minHeight:"100vh",background:"#080f1a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}.grad-text{background:linear-gradient(135deg,#4aaee8 0%,#9b8ef8 50%,#5ec97a 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 4s ease infinite}input:focus{border-color:#4aaee8!important}button:active{transform:scale(0.97)}`}</style>
        {[0,1,2,3,4].map(i=><div key={i} style={{position:"absolute",borderRadius:"50%",background:"radial-gradient(circle,rgba(74,174,232,0.07) 0%,transparent 70%)",width:`${100+i*80}px`,height:`${100+i*80}px`,bottom:`-${50+i*40}px`,left:`${5+i*18}%`,animation:`float ${10+i*3}s ease-in-out ${i*1.5}s infinite`,pointerEvents:"none"}}/>)}

        {screen==="onboard"&&(
          <div style={{width:480,zIndex:1,animation:"fadeUp 0.5s ease",padding:"0 20px",textAlign:"center"}}>
            <div style={{fontSize:70,animation:"float 3s ease-in-out infinite",display:"inline-block",marginBottom:16}}>{step.icon}</div>
            <h1 className="grad-text" style={{fontFamily:"'Playfair Display',serif",fontSize:32,margin:"0 0 12px",fontWeight:700}}>{step.title}</h1>
            <p style={{color:"#7aa0bc",fontSize:15,lineHeight:1.7,margin:"0 0 32px"}}>{step.body}</p>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:32}}>{ONBOARD.map((_,i)=><div key={i} style={{height:8,borderRadius:4,background:i===onboardIdx?"#4aaee8":"rgba(100,180,255,0.2)",width:i===onboardIdx?24:8,transition:"all 0.3s"}}/>)}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {onboardIdx>0&&<button style={{...btnG,padding:"11px 24px",fontSize:14}} onClick={()=>setOnboardIdx(p=>p-1)}>Back</button>}
              <button style={{...btnP,padding:"12px 36px",fontSize:15}} onClick={()=>onboardIdx<ONBOARD.length-1?setOnboardIdx(p=>p+1):setScreen("signup")}>{onboardIdx<ONBOARD.length-1?"Continue →":"Get Started 🐠"}</button>
            </div>
            <button style={{background:"none",border:"none",color:"#3d6070",fontSize:13,cursor:"pointer",marginTop:18,fontFamily:"inherit"}} onClick={()=>setScreen("login")}>Already have an account? Log in</button>
          </div>
        )}

        {(screen==="login"||screen==="signup")&&(
          <div style={{width:400,zIndex:1,animation:"fadeUp 0.4s ease",padding:"0 20px"}}>
            <div style={{background:"linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))",border:"1px solid rgba(100,180,255,0.12)",borderRadius:16,padding:36}}>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:44,animation:"float 3s ease-in-out infinite",display:"inline-block",marginBottom:8}}>🐡</div>
                <h2 className="grad-text" style={{fontFamily:"'Playfair Display',serif",fontSize:24,margin:"0 0 4px",fontWeight:700}}>AquaForum</h2>
                <div style={{fontSize:12,color:"#3d6070"}}>{screen==="login"?"Welcome back":"Create your account"}</div>
              </div>
              <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:3,marginBottom:22}}>
                {["login","signup"].map(m=><button key={m} onClick={()=>{setScreen(m);setAuthError("");}} style={{flex:1,padding:"8px",border:"none",borderRadius:8,cursor:"pointer",background:screen===m?"rgba(74,174,232,0.2)":"transparent",color:screen===m?"#4aaee8":"#3d6070",fontFamily:"inherit",fontSize:13,fontWeight:500}}>{m==="login"?"Log In":"Sign Up"}</button>)}
              </div>
              {screen==="signup"&&<div style={{marginBottom:16}}><div style={{fontSize:12,color:"#3d6070",marginBottom:8}}>Choose your avatar</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{AVATARS.map(a=><button key={a} onClick={()=>setAuthForm(p=>({...p,avatar:a}))} style={{width:34,height:34,borderRadius:8,border:`2px solid ${authForm.avatar===a?"#4aaee8":"transparent"}`,background:authForm.avatar===a?"rgba(74,174,232,0.15)":"rgba(255,255,255,0.04)",cursor:"pointer",fontSize:17}}>{a}</button>)}</div></div>}
              <input style={{...{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(100,180,255,0.12)",borderRadius:10,color:"#c8dff0",padding:"10px 14px",fontSize:13,fontFamily:"inherit",width:"100%",display:"block",outline:"none"},marginBottom:10}} type="text" placeholder="Username" value={authForm.username} onChange={e=>setAuthForm(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
              {screen==="signup"&&<input style={{...{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(100,180,255,0.12)",borderRadius:10,color:"#c8dff0",padding:"10px 14px",fontSize:13,fontFamily:"inherit",width:"100%",display:"block",outline:"none"},marginBottom:10}} type="email" placeholder="Email" value={authForm.email} onChange={e=>setAuthForm(p=>({...p,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>}
              <input style={{...{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(100,180,255,0.12)",borderRadius:10,color:"#c8dff0",padding:"10px 14px",fontSize:13,fontFamily:"inherit",width:"100%",display:"block",outline:"none"},marginBottom:authError?8:16}} type="password" placeholder="Password" value={authForm.password} onChange={e=>setAuthForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
              {authError&&<div style={{fontSize:12,color:"#e86a8a",marginBottom:12}}>{authError}</div>}
              <button style={{...btnP,width:"100%",padding:12,fontSize:15}} onClick={handleAuth}>{screen==="login"?"Log In →":"Create Account →"}</button>
              {screen==="login"&&<div style={{textAlign:"center",marginTop:14,fontSize:12,color:"#3d6070"}}>Demo: <strong style={{color:"#7aa0bc"}}>ReedyRivers</strong> / <strong style={{color:"#7aa0bc"}}>pass</strong> · Mod: <strong style={{color:"#7aa0bc"}}>SaltwaterSage</strong> / <strong style={{color:"#7aa0bc"}}>pass</strong></div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP
  // ════════════════════════════════════════════════════════════════════════════
  const activeDmData = dms.find(d=>d.id===activeDm);
  const activeDmUser = activeDmData ? users.find(u=>u.id===(activeDmData.user1===currentUser.id?activeDmData.user2:activeDmData.user1)) : null;

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',system-ui,sans-serif",color:C.text,position:"relative",transition:"background 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes floatSlow{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(4deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
        @keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes popIn{from{transform:scale(0.88);opacity:0}to{transform:scale(1);opacity:1}}
        .grad-text{background:linear-gradient(135deg,#4aaee8 0%,#9b8ef8 50%,#5ec97a 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradMove 4s ease infinite}
        .pcard:hover{transform:translateY(-3px)!important;box-shadow:0 14px 40px rgba(74,174,232,0.1)!important}
        input:focus,textarea:focus,select:focus{outline:none;border-color:#4aaee8!important}
        select option{background:#14253a}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(74,174,232,0.2);border-radius:2px}
        button{font-family:inherit}
      `}</style>

      {/* BG bubbles */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        {[0,1,2,3,4,5].map(i=><div key={i} style={{position:"absolute",borderRadius:"50%",background:`radial-gradient(circle,rgba(74,174,232,${0.04+i*0.01}) 0%,transparent 70%)`,width:`${100+i*90}px`,height:`${100+i*90}px`,bottom:`-${60+i*40}px`,left:`${5+i*16}%`,animation:`floatSlow ${12+i*4}s ease-in-out ${i*2}s infinite`}}/>)}
      </div>

      {/* Overlays */}
      {panel&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:299,animation:"fadeIn 0.2s",backdropFilter:"blur(3px)"}} onClick={()=>setPanel(null)}/>}

      {/* Full Profile Modal */}
      {fullProfile&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:400,animation:"fadeIn 0.2s",backdropFilter:"blur(4px)",overflowY:"auto",display:"flex",justifyContent:"center",padding:"40px 20px"}} onClick={e=>{if(e.target===e.currentTarget)setFullProfile(null)}}>
          <div style={{width:"100%",maxWidth:680,background:theme?"linear-gradient(180deg,#10203a,#0d1826)":"#fff",border:`1px solid ${C.border2}`,borderRadius:20,overflow:"hidden",animation:"fadeUp 0.35s ease",alignSelf:"flex-start"}}>
            <div style={{height:120,background:"linear-gradient(135deg,rgba(74,174,232,0.35),rgba(123,104,238,0.35),rgba(94,201,122,0.25))",position:"relative"}}>
              <button onClick={()=>setFullProfile(null)} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.4)",border:"none",color:"#fff",cursor:"pointer",width:32,height:32,borderRadius:"50%",fontSize:16}}>✕</button>
            </div>
            <div style={{padding:"0 28px 28px",marginTop:-44}}>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16}}>
                <div style={{border:`4px solid ${theme?"#0d1826":"#fff"}`,borderRadius:"50%"}}><UserAvatar user={fullProfile} size={88} fontSize={44}/></div>
                <div style={{display:"flex",gap:8,marginBottom:4}}>
                  {fullProfile.id!==currentUser.id&&<button style={{...btnG,padding:"7px 14px",fontSize:12}} onClick={()=>openDm(fullProfile.id)}>💬 Message</button>}
                  {fullProfile.id!==currentUser.id&&<button style={{...btnP,padding:"7px 14px",fontSize:12}} onClick={()=>toggleFollow(fullProfile.id)}>{currentUser.following.includes(fullProfile.id)?"✓ Following":"+ Follow"}</button>}
                  {fullProfile.id===currentUser.id&&<button style={{...btnG,padding:"7px 14px",fontSize:12}} onClick={()=>{openProfile(fullProfile.id);setFullProfile(null)}}>Edit Profile</button>}
                </div>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.text,marginBottom:4}}>{fullProfile.username} {fullProfile.verified&&<span title="Verified">✅</span>}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
                {fullProfile.role==="mod"&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:"rgba(240,168,72,0.15)",color:"#f0a848",border:"1px solid rgba(240,168,72,0.3)",fontWeight:600}}>🛡️ Moderator</span>}
                {(()=>{const rank=getRank(fullProfile.rep||0);return <span style={{fontSize:11,padding:"2px 8px",borderRadius:8,background:`${rank.color}22`,color:rank.color,fontWeight:600}}>{rank.emoji} {rank.name}</span>})()}
                <span style={{fontSize:12,color:C.text3}}>Joined {new Date(fullProfile.joinDate).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
              </div>
              <div style={{display:"flex",gap:24,marginBottom:20}}>
                {[["Posts",posts.filter(p=>p.authorId===fullProfile.id).length],["Replies",posts.reduce((a,p)=>a+p.replies.filter(r=>r.authorId===fullProfile.id).length,0)],["Rep",fullProfile.rep||0],["Following",fullProfile.following?.length||0]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:C.text}}>{v}</div><div style={{fontSize:11,color:C.text3}}>{l}</div></div>
                ))}
              </div>
              {fullProfile.bio&&<div style={{fontSize:13,color:C.text2,lineHeight:1.7,padding:"14px 0",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,marginBottom:20,fontStyle:"italic"}}>{fullProfile.bio}</div>}
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:C.text2,marginBottom:12}}>Posts</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {posts.filter(p=>p.authorId===fullProfile.id).map(p=>{
                  const fl=getFlair(p.flair);
                  return <div key={p.id} onClick={()=>{setFullProfile(null);setTab("forum");setTimeout(()=>setExpanded(p.id),100)}} style={{padding:"12px 14px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.border2} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:`${CAT_COLORS[p.category]||C.accent}22`,color:CAT_COLORS[p.category]||C.accent}}>{p.category}</span>
                      {fl&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:fl.bg,color:fl.color,fontWeight:600}}>{fl.label}</span>}
                      <span style={{fontSize:11,color:C.text3,marginLeft:"auto"}}>{timeAgo(p.time)}</span>
                    </div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:C.text,marginBottom:4}}>{p.title}</div>
                    <div style={{fontSize:12,color:C.text3}}>❤️ {p.likes} · 💬 {p.replies.length}</div>
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side panel */}
      {panel&&(
        <div style={{position:"fixed",right:0,top:0,bottom:0,width:isMobile?"100%":340,background:theme?"linear-gradient(180deg,#10203a,#0d1826)":"#fff",borderLeft:isMobile?"none":`1px solid ${C.border2}`,zIndex:300,overflowY:"auto",animation:"slideIn 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",borderBottom:`1px solid ${C.border}`}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.accent}}>
              {panel==="profile"&&(profileUser?.id===currentUser.id?"My Profile":"Profile")}
              {panel==="settings"&&"Settings"}
              {panel==="privacy"&&"Privacy & Safety"}
              {panel==="moderation"&&"🛡️ Moderation"}
              {panel==="notifications"&&"🔔 Notifications"}
            </span>
            <button onClick={()=>setPanel(null)} style={{background:"none",border:"none",color:C.text3,cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
          </div>
          <div style={{padding:20}}>

            {/* PROFILE */}
            {panel==="profile"&&profileUser&&(
              <div>
                <div style={{textAlign:"center",paddingBottom:20,marginBottom:20,borderBottom:`1px solid ${C.border}`}}>
                  <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
                    <UserAvatar user={editingProfile?{...profileUser,...profileDraft}:profileUser} size={80} fontSize={40}/>
                    {editingProfile&&profileUser.id===currentUser.id&&<>
                      <input ref={profilePicRef} type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const url=await new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(f)});setProfileDraft(p=>({...p,profilePic:url}));e.target.value="";}}/>
                      <button onClick={()=>profilePicRef.current?.click()} style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#4aaee8,#7b68ee)",border:`2px solid ${C.bg}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>📷</button>
                    </>}
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:C.text}}>{profileUser.username} {profileUser.verified&&"✅"}</div>
                  {(()=>{const rank=getRank(profileUser.rep||0);return <div style={{fontSize:12,color:rank.color,marginTop:4,fontWeight:600}}>{rank.emoji} {rank.name} · {profileUser.rep||0} rep</div>})()}
                  {profileUser.role==="mod"&&<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:600,background:"rgba(240,168,72,0.15)",color:"#f0a848",border:"1px solid rgba(240,168,72,0.3)",marginTop:6}}>🛡️ Moderator</span>}
                  <div style={{fontSize:12,color:C.text3,marginTop:6}}>Joined {new Date(profileUser.joinDate).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
                  <button style={{...btnG,padding:"6px 14px",fontSize:12,marginTop:10}} onClick={()=>{openFullProfile(profileUser.id);setPanel(null)}}>View Full Profile →</button>
                </div>
                {editingProfile&&profileUser.id===currentUser.id?(
                  <div>
                    <div style={{fontSize:12,color:C.text3,marginBottom:8}}>Emoji avatar (fallback)</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>{AVATARS.map(a=><button key={a} onClick={()=>setProfileDraft(p=>({...p,avatar:a}))} style={{width:32,height:32,borderRadius:7,border:`2px solid ${profileDraft.avatar===a?C.accent:"transparent"}`,background:profileDraft.avatar===a?"rgba(74,174,232,0.14)":"rgba(255,255,255,0.04)",cursor:"pointer",fontSize:16}}>{a}</button>)}</div>
                    {profileDraft.profilePic&&<button style={{...btnG,padding:"5px 12px",fontSize:11,marginBottom:12}} onClick={()=>setProfileDraft(p=>({...p,profilePic:null}))}>✕ Remove photo</button>}
                    <textarea value={profileDraft.bio} onChange={e=>setProfileDraft(p=>({...p,bio:e.target.value}))} placeholder="Tell the community about yourself..." rows={3} style={{...inputStyle,resize:"none",marginBottom:12}}/>
                    <div style={{display:"flex",gap:8}}><button style={{...btnP,padding:"8px 18px",fontSize:13}} onClick={saveProfile}>Save</button><button style={{...btnG,padding:"8px 14px",fontSize:13}} onClick={()=>setEditingProfile(false)}>Cancel</button></div>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:13,color:C.text2,lineHeight:1.6,fontStyle:"italic",marginBottom:16}}>{profileUser.bio||"No bio yet."}</div>
                    {profileUser.id===currentUser.id&&<button style={{...btnG,padding:"8px 16px",fontSize:13,width:"100%",marginBottom:8}} onClick={()=>setEditingProfile(true)}>Edit Profile</button>}
                    {profileUser.id!==currentUser.id&&<div style={{display:"flex",gap:8,marginBottom:8}}><button style={{...btnG,padding:"7px 14px",fontSize:12,flex:1}} onClick={()=>openDm(profileUser.id)}>💬 Message</button><button style={{...btnP,padding:"7px 14px",fontSize:12,flex:1}} onClick={()=>toggleFollow(profileUser.id)}>{currentUser.following.includes(profileUser.id)?"✓ Following":"+ Follow"}</button></div>}
                    {isMod&&profileUser.id!==currentUser.id&&(
                      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,marginTop:8}}>
                        <div style={{fontSize:11,color:C.text3,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.5px"}}>Mod Actions</div>
                        {profileUser.role!=="mod"?<button style={{...btnG,padding:"7px 14px",fontSize:12,width:"100%",marginBottom:8}} onClick={()=>{modAction("make_mod",profileUser.id);setProfileUser(p=>({...p,role:"mod"}))}}>🛡️ Assign Moderator</button>:<button style={{...btnG,padding:"7px 14px",fontSize:12,width:"100%",marginBottom:8}} onClick={()=>{modAction("remove_mod",profileUser.id);setProfileUser(p=>({...p,role:"member"}))}}>Remove Mod</button>}
                        {!profileUser.verified?<button style={{...btnG,padding:"7px 14px",fontSize:12,width:"100%",marginBottom:8}} onClick={()=>{modAction("verify",profileUser.id);setProfileUser(p=>({...p,verified:true}))}}>✅ Verify User</button>:<button style={{...btnG,padding:"7px 14px",fontSize:12,width:"100%",marginBottom:8}} onClick={()=>{modAction("unverify",profileUser.id);setProfileUser(p=>({...p,verified:false}))}}>Remove Verification</button>}
                        {!banList.includes(profileUser.id)?<button style={{padding:"7px 14px",fontSize:12,width:"100%",background:"rgba(232,106,138,0.08)",border:"1px solid rgba(232,106,138,0.25)",borderRadius:10,color:"#e86a8a",cursor:"pointer"}} onClick={()=>modAction("ban",profileUser.id)}>🚫 Ban User</button>:<button style={{...btnG,padding:"7px 14px",fontSize:12,width:"100%"}} onClick={()=>modAction("unban",profileUser.id)}>✅ Unban User</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {panel==="notifications"&&(
              <div>
                <button style={{...btnG,padding:"6px 12px",fontSize:12,marginBottom:16}} onClick={()=>setNotifications(p=>p.map(n=>({...n,read:true})))}>Mark all read</button>
                {notifications.length===0&&<div style={{fontSize:13,color:C.text3}}>No notifications yet.</div>}
                {notifications.map(n=>(
                  <div key={n.id} onClick={()=>{setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x));setPanel(null);setTab("forum");setTimeout(()=>setExpanded(n.postId),100)}} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${n.read?C.border:C.accent+"44"}`,background:n.read?"transparent":"rgba(74,174,232,0.05)",marginBottom:8,cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{fontSize:13,color:C.text,marginBottom:3}}>{n.type==="reply"?"💬":n.type==="like"?"❤️":"🔔"} {n.text}</div>
                    <div style={{fontSize:11,color:C.text3}}>{timeAgo(n.time)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS */}
            {panel==="settings"&&(
              <div>
                {[["notifications","🔔 Notifications","Get notified about replies and likes"],["nsfwFilter","🛡️ Content Filter","Block slurs, threats, and explicit content"],["darkMode","🌙 Dark Mode","Toggle dark/light theme"],["compactView","📐 Compact View","Show more posts at once"]].map(([key,label,desc])=>(
                  <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:14,color:C.text}}>{label}</div><div style={{fontSize:12,color:C.text3,marginTop:2}}>{desc}</div></div>
                    <Toggle value={settings[key]} onChange={()=>setSettings(p=>({...p,[key]:!p[key]}))}/>
                  </div>
                ))}
                <div style={{marginTop:20}}><div style={{fontSize:13,color:C.text2,marginBottom:8}}>Account Email</div><div style={{fontSize:13,color:C.text3,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:`1px solid ${C.border}`}}>{currentUser.email||"Not set"}</div></div>
              </div>
            )}

            {/* PRIVACY */}
            {panel==="privacy"&&(
              <div>
                {[{title:"Data Collection",body:"AquaForum collects your username, email, and posts to provide the service. Your password is stored securely and never shared."},{title:"Email Communications",body:"By signing up, you agree to receive community updates. You can unsubscribe in Settings."},{title:"Content Moderation",body:"Posts are reviewed by moderators and our content filter. Removed content is logged for review."},{title:"Third-Party Services",body:"AquaBot is powered by Claude AI (Anthropic). Messages to AquaBot are processed by their API per their privacy policy."}].map((s,i)=>(
                  <div key={i} style={{marginBottom:18,paddingBottom:18,borderBottom:`1px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:5}}>{s.title}</div><div style={{fontSize:12,color:C.text3,lineHeight:1.6}}>{s.body}</div></div>
                ))}
              </div>
            )}

            {/* MODERATION */}
            {panel==="moderation"&&isMod&&(
              <div>
                {reports.length>0&&<div style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#e86a8a",marginBottom:10}}>⚠️ Report Queue ({reports.length})</div>
                  {reports.map(r=>{const p=posts.find(x=>x.id===r.postId);return p?<div key={r.id} style={{padding:"10px 12px",borderRadius:10,border:"1px solid rgba(232,106,138,0.25)",marginBottom:8}}>
                    <div style={{fontSize:12,color:C.text,marginBottom:4,lineHeight:1.3}}>{p.title}</div>
                    <div style={{fontSize:11,color:C.text3,marginBottom:8}}>Reported {timeAgo(r.time)}</div>
                    <div style={{display:"flex",gap:8}}><button style={{...btnG,padding:"4px 10px",fontSize:11}} onClick={()=>setReports(prev=>prev.filter(x=>x.id!==r.id))}>Dismiss</button><button style={{padding:"4px 10px",fontSize:11,background:"rgba(232,106,138,0.1)",border:"1px solid rgba(232,106,138,0.25)",borderRadius:8,color:"#e86a8a",cursor:"pointer"}} onClick={()=>{modAction("remove",p.id);setReports(prev=>prev.filter(x=>x.id!==r.id))}}>Remove Post</button></div>
                  </div>:null})}
                </div>}
                <div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Removed Posts</div>{posts.filter(p=>p.removed).length===0&&<div style={{fontSize:12,color:C.text3}}>None.</div>}{posts.filter(p=>p.removed).map(p=><div key={p.id} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}><div style={{fontSize:12,color:C.text,marginBottom:4}}>{p.title}</div><div style={{fontSize:11,color:C.text3,marginBottom:8}}>by {p.authorName} · {timeAgo(p.time)}</div><button style={{...btnG,padding:"4px 10px",fontSize:11}} onClick={()=>modAction("restore",p.id)}>Restore</button></div>)}</div>
                <div style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Banned Users ({banList.length})</div>{banList.length===0&&<div style={{fontSize:12,color:C.text3}}>None.</div>}{banList.map(id=>{const u=users.find(u=>u.id===id);return u?<div key={id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:9,border:`1px solid ${C.border}`,marginBottom:6}}><span style={{fontSize:13,color:C.text}}>{u.avatar} {u.username}</span><button style={{...btnG,padding:"4px 10px",fontSize:11}} onClick={()=>modAction("unban",id)}>Unban</button></div>:null})}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:12}}>Mod Log</div>{modLog.length===0&&<div style={{fontSize:12,color:C.text3}}>No actions yet.</div>}{modLog.slice(0,20).map((l,i)=><div key={i} style={{fontSize:11,color:C.text3,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.accent}}>{l.by}</span> · {l.action.replace(/_/g," ")} · {timeAgo(l.time)}</div>)}</div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{borderBottom:`1px solid ${C.border}`,background:theme?"rgba(8,15,26,0.92)":"rgba(240,244,248,0.95)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:isMobile?6:12,height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:20,display:"inline-block",animation:"float 3s ease-in-out infinite"}}>🐡</span>
            {!isMobile&&<span className="grad-text" style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>AquaForum</span>}
          </div>
          <div style={{flex:1}}/>
          {[["forum",isMobile?"💬":"💬 Forum"],["bot",isMobile?"🤖":"🤖 AquaBot"],["dms",isMobile?"✉️":"✉️ Messages"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:isMobile?"6px 10px":"5px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:isMobile?16:13,fontWeight:500,background:tab===t?"rgba(74,174,232,0.15)":"transparent",color:tab===t?C.accent:C.text3,borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent",position:"relative"}}>
              {l}
              {t==="dms"&&unreadDms>0&&<span style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#e86a8a",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{unreadDms}</span>}
            </button>
          ))}
          {isMod&&<button onClick={()=>setPanel("moderation")} style={{padding:isMobile?"6px 10px":"5px 12px",border:"1px solid rgba(240,168,72,0.3)",borderRadius:8,background:"rgba(240,168,72,0.08)",color:"#f0a848",cursor:"pointer",fontSize:isMobile?15:12,fontWeight:600}}>🛡️</button>}
          <button onClick={()=>setPanel("notifications")} style={{background:"none",border:"none",cursor:"pointer",position:"relative",fontSize:18,color:C.text3,padding:"4px 6px"}}>
            🔔{unreadNotifs>0&&<span style={{position:"absolute",top:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#e86a8a",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{unreadNotifs}</span>}
          </button>
          <div style={{position:"relative"}} ref={menuRef}>
            <div onClick={()=>setMenuOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,padding:isMobile?"4px 8px":"5px 12px",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:20,cursor:"pointer"}}>
              <UserAvatar user={currentUser} size={26} fontSize={14}/>
              {!isMobile&&<span style={{fontSize:12,color:C.text2,fontWeight:500}}>{currentUser.username}</span>}
              {!isMobile&&currentUser.role==="mod"&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:6,background:"rgba(240,168,72,0.15)",color:"#f0a848",fontWeight:600}}>🛡️</span>}
              <span style={{fontSize:14,color:C.text3}}>⋯</span>
            </div>
            {menuOpen&&<div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:theme?"linear-gradient(160deg,#14253a,#0f1e30)":"#fff",border:`1px solid ${C.border2}`,borderRadius:14,padding:6,minWidth:210,zIndex:200,boxShadow:"0 16px 48px rgba(0,0,0,0.5)",animation:"popIn 0.2s ease"}}>
              {[["👤 My Profile",()=>{openProfile(currentUser.id);setMenuOpen(false)}],["🔔 Notifications",()=>{setPanel("notifications");setMenuOpen(false)}],["⚙️ Settings",()=>{setPanel("settings");setMenuOpen(false)}],["🔒 Privacy",()=>{setPanel("privacy");setMenuOpen(false)}],...(isMod?[["🛡️ Moderation",()=>{setPanel("moderation");setMenuOpen(false)}]]:[])]
                .map(([label,action])=><button key={label} onClick={action} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:C.text2,background:"none",border:"none",width:"100%",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(74,174,232,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>{label}</button>)}
              <div style={{height:1,background:C.border,margin:"4px 0"}}/>
              <button onClick={()=>setCurrentUser(null)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13,color:"#e86a8a",background:"none",border:"none",width:"100%",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(232,106,138,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>↩️ Log Out</button>
            </div>}
          </div>
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:isMobile?"14px 12px":"24px 20px",display:"flex",gap:20,position:"relative",zIndex:1}}>

        {/* CENTER */}
        <div style={{flex:1,minWidth:0}}>

          {/* ══ FORUM ══ */}
          {tab==="forum"&&(
            <div>
              {/* Stats bar */}
              <div style={{display:"flex",gap:isMobile?8:20,marginBottom:16,padding:"10px 16px",background:C.card.background,border:`1px solid ${C.border}`,borderRadius:12,flexWrap:"wrap"}}>
                {[["📝",forumStats.total,"Posts"],["👥",users.length,"Members"],["🏆",forumStats.topCat,"Top Category"]].map(([e,v,l])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{e}</span><span style={{fontSize:14,fontWeight:600,color:C.text}}>{v}</span><span style={{fontSize:12,color:C.text3}}>{l}</span></div>
                ))}
              </div>

              {/* Search row */}
              <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{position:"relative",flex:1,minWidth:180}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.text3,pointerEvents:"none"}}>🔍</span>
                  <input style={{...inputStyle,paddingLeft:36}} value={advSearch?advForm.q:search} onChange={e=>advSearch?setAdvForm(p=>({...p,q:e.target.value})):setSearch(e.target.value)} placeholder="Search posts, authors..."/>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button style={{...btnG,padding:"9px 12px",fontSize:12,whiteSpace:"nowrap"}} onClick={()=>setAdvSearch(p=>!p)}>{advSearch?"Simple 🔍":"Advanced 🔍"}</button>
                  <button style={{...btnP,padding:"9px 18px",fontSize:13,whiteSpace:"nowrap"}} onClick={()=>setComposing(p=>!p)}>+ New Post</button>
                </div>
              </div>

              {/* Advanced search */}
              {advSearch&&(
                <div style={{...C.card,padding:16,marginBottom:14,animation:"fadeUp 0.25s ease"}}>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <input style={{...inputStyle,flex:1,minWidth:120}} placeholder="Author name" value={advForm.author} onChange={e=>setAdvForm(p=>({...p,author:e.target.value}))}/>
                    <select style={{...inputStyle,width:"auto"}} value={advForm.category} onChange={e=>setAdvForm(p=>({...p,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
                    <select style={{...inputStyle,width:"auto"}} value={advForm.flair} onChange={e=>setAdvForm(p=>({...p,flair:e.target.value}))}><option value="All">All Flairs</option>{FLAIRS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
                    <select style={{...inputStyle,width:"auto"}} value={advForm.dateRange} onChange={e=>setAdvForm(p=>({...p,dateRange:e.target.value}))}><option value="all">All Time</option><option value="day">Today</option><option value="week">This Week</option><option value="month">This Month</option></select>
                  </div>
                </div>
              )}

              {/* Filters */}
              {!advSearch&&<>
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  {CATEGORIES.map(cat=><button key={cat} onClick={()=>setCategory(cat)} style={{padding:"4px 13px",borderRadius:20,fontSize:12,border:`1px solid ${category===cat?(CAT_COLORS[cat]||C.accent):C.border}`,background:category===cat?`${CAT_COLORS[cat]||C.accent}22`:"transparent",color:category===cat?(CAT_COLORS[cat]||C.accent):C.text3,cursor:"pointer",transition:"all 0.2s"}}>{cat}</button>)}
                </div>
                <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                  <button onClick={()=>setFlair("All")} style={{padding:"3px 11px",borderRadius:20,fontSize:11,border:`1px solid ${flair==="All"?C.accent:C.border}`,background:flair==="All"?"rgba(74,174,232,0.15)":"transparent",color:flair==="All"?C.accent:C.text3,cursor:"pointer"}}>All Flairs</button>
                  {FLAIRS.map(f=><button key={f.id} onClick={()=>setFlair(f.id)} style={{padding:"3px 11px",borderRadius:20,fontSize:11,border:`1px solid ${flair===f.id?f.color:C.border}`,background:flair===f.id?f.bg:"transparent",color:flair===f.id?f.color:C.text3,cursor:"pointer"}}>{f.label}</button>)}
                </div>
              </>}

              {/* Sort */}
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {[["new","🕐 New"],["hot","🔥 Hot"],["top","⭐ Top"]].map(([s,l])=>(
                  <button key={s} onClick={()=>setSortBy(s)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,border:`1px solid ${sortBy===s?C.accent:C.border}`,background:sortBy===s?"rgba(74,174,232,0.15)":"transparent",color:sortBy===s?C.accent:C.text3,cursor:"pointer"}}>{l}</button>
                ))}
              </div>

              {/* Compose */}
              {composing&&(
                <div style={{...C.card,padding:22,marginBottom:18,animation:"fadeUp 0.3s ease"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.accent,marginBottom:14}}>New Thread</div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    <select style={{...inputStyle,width:"auto",flex:1}} value={draft.category} onChange={e=>setDraft(p=>({...p,category:e.target.value}))}>{CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select>
                    <select style={{...inputStyle,width:"auto",flex:1}} value={draft.flair} onChange={e=>setDraft(p=>({...p,flair:e.target.value,type:e.target.value==="poll"?"poll":e.target.value==="journal"?"journal":"post"}))}><option value="">No flair</option>{FLAIRS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select>
                  </div>
                  <input style={{...inputStyle,marginBottom:10}} value={draft.title} onChange={e=>setDraft(p=>({...p,title:e.target.value}))} placeholder="Thread title..."/>
                  <textarea style={{...inputStyle,resize:"vertical",marginBottom:10}} value={draft.body} onChange={e=>setDraft(p=>({...p,body:e.target.value}))} placeholder={draft.type==="journal"?"Describe your tank build or journal entry...":draft.type==="poll"?"Describe your poll question...":"Share your question, experience, or advice..."} rows={4}/>

                  {/* Poll options */}
                  {draft.type==="poll"&&(
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:12,color:C.text3,marginBottom:8}}>Poll options</div>
                      {draft.pollOptions.map((opt,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                          <input style={{...inputStyle,flex:1}} value={opt} onChange={e=>setDraft(p=>({...p,pollOptions:p.pollOptions.map((o,j)=>j===i?e.target.value:o)}))} placeholder={`Option ${i+1}`}/>
                          {draft.pollOptions.length>2&&<button onClick={()=>setDraft(p=>({...p,pollOptions:p.pollOptions.filter((_,j)=>j!==i)}))} style={{...btnG,padding:"0 10px",fontSize:16}}>✕</button>}
                        </div>
                      ))}
                      {draft.pollOptions.length<6&&<button style={{...btnG,padding:"6px 14px",fontSize:12}} onClick={()=>setDraft(p=>({...p,pollOptions:[...p.pollOptions,""]}))}>+ Add option</button>}
                    </div>
                  )}

                  {nsfwAlert&&<div style={{fontSize:12,color:"#e86a8a",marginBottom:10,padding:"8px 12px",background:"rgba(232,106,138,0.07)",borderRadius:8,border:"1px solid rgba(232,106,138,0.2)"}}>{nsfwAlert}</div>}
                  <input ref={postFileRef} type="file" accept="image/*,video/*" multiple style={{display:"none"}} onChange={async e=>{const f=await readFiles(e.target.files);setDraft(p=>({...p,media:[...p.media,...f].slice(0,4)}));e.target.value="";}}/>
                  {draft.media.length>0&&<div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>{draft.media.map((m,i)=><div key={i} style={{position:"relative"}}>{m.type.startsWith("video/")?<video src={m.url} style={{width:70,height:52,objectFit:"cover",borderRadius:8}}/>:<img src={m.url} alt="" style={{width:70,height:52,objectFit:"cover",borderRadius:8}}/>}<button onClick={()=>setDraft(p=>({...p,media:p.media.filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-5,right:-5,width:17,height:17,borderRadius:"50%",background:"#e86a8a",border:"none",color:"#fff",fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}</div>}
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <button style={{...btnG,padding:"7px 14px",fontSize:12}} onClick={()=>postFileRef.current?.click()}>📎 Media</button>
                    <button style={{...btnP,padding:"9px 22px",fontSize:13}} onClick={submitPost}>Post Thread</button>
                    <button style={{...btnG,padding:"9px 14px",fontSize:13}} onClick={()=>{setComposing(false);setNsfwAlert("")}}>Cancel</button>
                  </div>
                </div>
              )}

              {visiblePosts.length===0&&<div style={{textAlign:"center",color:C.text3,padding:56}}>No posts found 🔍</div>}

              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {visiblePosts.map(post=>{
                  const liked=post.likedBy.includes(currentUser.id);
                  const bookmarked=post.bookmarkedBy.includes(currentUser.id);
                  const isExpanded=expanded===post.id;
                  const fl=getFlair(post.flair);
                  const postAuthor=users.find(u=>u.id===post.authorId);
                  const rank=getRank(postAuthor?.rep||0);
                  return (
                    <div key={post.id} className="pcard" style={{...C.card,padding:isMobile?14:22,opacity:post.removed?0.55:1}}>
                      {post.pinned&&<div style={{fontSize:11,color:"#f0a848",marginBottom:8}}>📌 Pinned Post</div>}
                      {post.removed&&isMod&&<div style={{fontSize:11,color:"#e86a8a",marginBottom:8}}>⚠️ Removed by moderator</div>}
                      <div style={{display:"flex",gap:13,alignItems:"flex-start"}}>
                        <button onClick={()=>openFullProfile(post.authorId)} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0,transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                          <UserAvatar user={postAuthor||{avatar:post.authorAvatar}} size={46} fontSize={22}/>
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                            <button onClick={()=>openFullProfile(post.authorId)} style={{background:"none",border:"none",color:C.text2,fontWeight:600,fontSize:13,cursor:"pointer",padding:0}}>{post.authorName}</button>
                            {postAuthor?.verified&&<span title="Verified" style={{fontSize:12}}>✅</span>}
                            {postAuthor?.role==="mod"&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:7,background:"rgba(240,168,72,0.15)",color:"#f0a848",fontWeight:600}}>🛡️</span>}
                            <span style={{fontSize:10,color:rank.color,fontWeight:600}}>{rank.emoji} {rank.name}</span>
                            <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:`${CAT_COLORS[post.category]||C.accent}22`,color:CAT_COLORS[post.category]||C.accent}}>{post.category}</span>
                            {fl&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:fl.bg,color:fl.color,fontWeight:600}}>{fl.label}</span>}
                            <span style={{fontSize:11,color:C.text3}}>{timeAgo(post.time)}</span>
                          </div>
                          <div onClick={()=>setExpanded(isExpanded?null:post.id)} style={{cursor:"pointer"}}>
                            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.35}}>{post.title}</div>
                            <div style={{fontSize:14,color:C.text2,lineHeight:1.7}}>{post.body}</div>
                          </div>

                          {/* Poll */}
                          {post.type==="poll"&&post.pollOptions&&(
                            <div style={{marginTop:12}}>
                              {post.pollOptions.map(opt=>{
                                const total=post.pollOptions.reduce((a,o)=>a+o.votes.length,0);
                                const pct=total?Math.round(opt.votes.length/total*100):0;
                                const voted=post.pollOptions.some(o=>o.votes.includes(currentUser.id));
                                return <div key={opt.id} onClick={()=>!voted&&votePoll(post.id,opt.id)} style={{marginBottom:8,cursor:voted?"default":"pointer"}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.text,marginBottom:4}}><span>{opt.text}</span><span style={{color:C.text3}}>{voted?`${pct}%`:""}</span></div>
                                  <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.08)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:`linear-gradient(135deg,#4aaee8,#7b68ee)`,width:`${pct}%`,transition:"width 0.5s"}}/></div>
                                </div>;
                              })}
                              <div style={{fontSize:11,color:C.text3,marginTop:4}}>{post.pollOptions.reduce((a,o)=>a+o.votes.length,0)} votes</div>
                            </div>
                          )}

                          {/* Journal updates */}
                          {post.type==="journal"&&isExpanded&&post.journalUpdates?.length>0&&(
                            <div style={{marginTop:14,borderLeft:`3px solid #78c8e8`,paddingLeft:14}}>
                              <div style={{fontSize:12,color:"#78c8e8",marginBottom:10,fontWeight:600}}>📖 Journal Updates</div>
                              {post.journalUpdates.map(u=><div key={u.id} style={{marginBottom:12}}><div style={{fontSize:11,color:C.text3,marginBottom:4}}>{timeAgo(u.time)}</div><div style={{fontSize:13,color:C.text2,lineHeight:1.6}}>{u.body}</div></div>)}
                            </div>
                          )}
                          {post.type==="journal"&&post.authorId===currentUser.id&&isExpanded&&(
                            <JournalUpdateBox postId={post.id} onSubmit={addJournalUpdate} inputStyle={inputStyle} btnP={btnP}/>
                          )}

                          <MediaGrid media={post.media}/>
                        </div>
                        {(isMod||post.authorId===currentUser.id)&&<PostMenu post={post} isMod={isMod} onAction={action=>{if(action==="report"){reportPost(post.id)}else{modAction(action,post.id)}}}/>}
                      </div>

                      <div style={{display:"flex",gap:12,marginTop:12,paddingLeft:59,alignItems:"center",flexWrap:"wrap"}}>
                        <button onClick={()=>likePost(post.id)} style={{background:"none",border:"none",cursor:"pointer",color:liked?"#e84a6a":C.text3,fontSize:13,display:"flex",alignItems:"center",gap:4}}>{liked?"❤️":"🤍"} {post.likes}</button>
                        <button onClick={()=>setExpanded(isExpanded?null:post.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:13}}>💬 {post.replies.filter(r=>!r.removed).length} {isExpanded?"▲":"▼"}</button>
                        <button onClick={()=>toggleBookmark(post.id)} style={{background:"none",border:"none",cursor:"pointer",color:bookmarked?"#f0a848":C.text3,fontSize:13}} title={bookmarked?"Remove bookmark":"Bookmark"}>{bookmarked?"🔖":"🏷️"}</button>
                        {botTyping===post.id&&<span style={{fontSize:11,color:C.accent,animation:"pulse 1.2s ease infinite"}}>🤖 AquaBot is typing...</span>}
                      </div>

                      {isExpanded&&(
                        <div style={{marginTop:16,paddingLeft:59,animation:"fadeUp 0.25s ease"}}>
                          {post.replies.filter(r=>!r.removed||isMod).length>0&&(
                            <div style={{borderLeft:`2px solid ${C.border}`,paddingLeft:14,marginBottom:14,display:"flex",flexDirection:"column",gap:11}}>
                              {post.replies.filter(r=>!r.removed||isMod).map(r=>(
                                <div key={r.id} style={{display:"flex",gap:9,opacity:r.removed?0.5:1}}>
                                  <button onClick={()=>!r.isBot&&openFullProfile(r.authorId)} style={{background:"none",border:"none",cursor:r.isBot?"default":"pointer",padding:0,flexShrink:0}}>
                                    <UserAvatar user={r.isBot?{avatar:"🤖"}:(users.find(u=>u.id===r.authorId)||{avatar:r.authorAvatar})} size={30} fontSize={15}/>
                                  </button>
                                  <div style={{flex:1}}>
                                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                                      <span style={{fontSize:12,fontWeight:600,color:r.isBot?C.accent:C.text2}}>{r.authorName}</span>
                                      {r.isBot&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:6,background:"rgba(74,174,232,0.12)",color:C.accent}}>AI</span>}
                                      {r.removed&&<span style={{fontSize:10,color:"#e86a8a"}}>[removed]</span>}
                                      <span style={{fontSize:11,color:C.text3}}>{timeAgo(r.time)}</span>
                                    </div>
                                    <div style={{fontSize:13,color:C.text2,lineHeight:1.55}} dangerouslySetInnerHTML={{__html:md(r.text)}}/>
                                    <MediaGrid media={r.media}/>
                                    <div style={{display:"flex",gap:10,marginTop:4,alignItems:"center"}}>
                                      <button onClick={()=>likeReply(post.id,r.id)} style={{background:"none",border:"none",cursor:"pointer",color:r.likedBy.includes(currentUser.id)?"#e84a6a":C.text3,fontSize:11}}>{r.likedBy.includes(currentUser.id)?"❤️":"🤍"} {r.likes}</button>
                                      {isMod&&!r.removed&&<button onClick={()=>modAction("remove_reply",r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e86a8a",fontSize:11}}>Remove</button>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                            <span style={{fontSize:19,marginTop:4}}>{currentUser.avatar}</span>
                            <div style={{flex:1}}>
                              <textarea style={{...inputStyle,resize:"none",marginBottom:7}} value={replyText[post.id]||""} onChange={e=>setReplyText(p=>({...p,[post.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitReply(post.id)}}} placeholder="Write a reply... (Enter to send)" rows={2}/>
                              <div style={{display:"flex",gap:7,alignItems:"center"}}>
                                <input ref={el=>replyFileRefs.current[post.id]=el} type="file" accept="image/*,video/*" multiple style={{display:"none"}} onChange={async e=>{const f=await readFiles(e.target.files);setReplyMedia(p=>({...p,[post.id]:[...(p[post.id]||[]),...f].slice(0,2)}));e.target.value="";}}/>
                                <button style={{...btnG,padding:"5px 11px",fontSize:12}} onClick={()=>replyFileRefs.current[post.id]?.click()}>📎</button>
                                {(replyMedia[post.id]||[]).map((m,i)=><div key={i} style={{position:"relative"}}>{m.type.startsWith("video/")?<video src={m.url} style={{width:34,height:26,objectFit:"cover",borderRadius:5}}/>:<img src={m.url} alt="" style={{width:34,height:26,objectFit:"cover",borderRadius:5}}/>}<button onClick={()=>setReplyMedia(p=>({...p,[post.id]:p[post.id].filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-4,right:-4,width:13,height:13,borderRadius:"50%",background:"#e86a8a",border:"none",color:"#fff",fontSize:8,cursor:"pointer"}}>✕</button></div>)}
                                <div style={{flex:1}}/>
                                <button style={{...btnP,padding:"6px 16px",fontSize:12}} onClick={()=>submitReply(post.id)}>Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ AQUABOT ══ */}
          {tab==="bot"&&(
            <div style={{...C.card,overflow:"hidden",display:"flex",flexDirection:"column",height:isMobile?"calc(100vh - 100px)":"calc(100vh - 136px)"}}>
              <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,background:"rgba(74,174,232,0.04)",display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#1a4a70,#0d2a45)",border:"2px solid rgba(74,174,232,0.35)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,animation:"float 3s ease-in-out infinite"}}>🐠</div>
                <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:C.accent}}>AquaBot</div><div style={{fontSize:11,color:"#3a9060"}}>● Online · Fishkeeping AI</div></div>
                <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[["chat","💬 Chat"],["disease","🔬 Disease ID"],["stocking","🐟 Stocking"],["water","💧 Water Check"]].map(([m,l])=>(
                    <button key={m} onClick={()=>setBotMode(m)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,border:`1px solid ${botMode===m?C.accent:C.border}`,background:botMode===m?"rgba(74,174,232,0.15)":"transparent",color:botMode===m?C.accent:C.text3,cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:11}}>
                {botMsgs.map((msg,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-end",animation:"fadeUp 0.3s ease"}}>
                    {msg.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"rgba(74,174,232,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🐠</div>}
                    <div style={{maxWidth:"74%",padding:"10px 14px",borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:msg.role==="user"?"linear-gradient(135deg,#1a5a8a,#2a2a6a)":"rgba(255,255,255,0.05)",border:msg.role==="user"?`1px solid rgba(74,174,232,0.25)`:`1px solid ${C.border}`,fontSize:13,lineHeight:1.6,color:C.text2}} dangerouslySetInnerHTML={{__html:md(msg.content)}}/>
                    {msg.role==="user"&&<div style={{width:28,height:28,borderRadius:"50%",background:"rgba(74,174,232,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{currentUser.avatar}</div>}
                  </div>
                ))}
                {botLoading&&<div style={{display:"flex",gap:8,alignItems:"flex-end"}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(74,174,232,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🐠</div><div style={{padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:"14px 14px 14px 4px",display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`pulse 1.2s ease ${i*.2}s infinite`}}/>)}</div></div>}
                <div ref={chatEnd}/>
              </div>

              {/* Disease mode */}
              {botMode==="disease"&&(
                <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center"}}>
                  <input ref={diseaseFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;const url=await new Promise(res=>{const r=new FileReader();r.onload=ev=>res(ev.target.result);r.readAsDataURL(f)});setDiseaseFile(url);e.target.value="";}}/>
                  {diseaseFile?<img src={diseaseFile} alt="" style={{width:48,height:48,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>:<button style={{...btnG,padding:"9px 16px",fontSize:13}} onClick={()=>diseaseFileRef.current?.click()}>📷 Upload Fish Photo</button>}
                  {diseaseFile&&<><button style={{...btnP,padding:"9px 18px",fontSize:13}} onClick={runDiseaseAnalysis} disabled={botLoading}>🔬 Analyze</button><button style={{...btnG,padding:"9px 12px",fontSize:13}} onClick={()=>setDiseaseFile(null)}>✕</button></>}
                </div>
              )}

              {/* Stocking mode */}
              {botMode==="stocking"&&(
                <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    <input style={{...inputStyle,flex:1,minWidth:80}} placeholder="Tank size (gallons)" value={stockForm.size} onChange={e=>setStockForm(p=>({...p,size:e.target.value}))}/>
                    <input style={{...inputStyle,flex:2,minWidth:120}} placeholder="Existing fish (optional)" value={stockForm.existing} onChange={e=>setStockForm(p=>({...p,existing:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input style={{...inputStyle,flex:1}} placeholder="Preferences (peaceful, colorful, etc.)" value={stockForm.prefs} onChange={e=>setStockForm(p=>({...p,prefs:e.target.value}))}/>
                    <button style={{...btnP,padding:"9px 18px",fontSize:13,whiteSpace:"nowrap"}} onClick={runStocking} disabled={botLoading||!stockForm.size}>Get Suggestions</button>
                  </div>
                </div>
              )}

              {/* Water check mode */}
              {botMode==="water"&&(
                <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
                  <textarea style={{...inputStyle,flex:1,resize:"none"}} placeholder={"Paste your parameters e.g.:\npH: 7.4, Ammonia: 0, Nitrite: 0, Nitrate: 20, KH: 6..."} value={waterForm} onChange={e=>setWaterForm(e.target.value)} rows={3}/>
                  <button style={{...btnP,padding:"9px 14px",fontSize:13,alignSelf:"flex-end"}} onClick={runWaterCheck} disabled={botLoading||!waterForm.trim()}>Check</button>
                </div>
              )}

              {/* Chat mode */}
              {botMode==="chat"&&(
                <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-end"}}>
                  <textarea style={{...inputStyle,flex:1,resize:"none",lineHeight:1.5}} value={botInput} onChange={e=>setBotInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendBot()}}} placeholder="Ask about water params, compatibility, disease, plants... (Enter to send)" rows={2}/>
                  <button onClick={sendBot} disabled={botLoading} style={{...btnP,width:40,height:40,padding:0,fontSize:16,flexShrink:0,opacity:botLoading?0.5:1}}>➤</button>
                </div>
              )}
            </div>
          )}

          {/* ══ DMS ══ */}
          {tab==="dms"&&(
            <div style={{display:"flex",gap:16,height:isMobile?"calc(100vh - 100px)":"calc(100vh - 136px)",minWidth:0}}>
              {/* Conversation list */}
              <div style={{width:isMobile&&activeDm?0:220,flexShrink:0,overflow:isMobile&&activeDm?"hidden":"visible",minWidth:isMobile&&activeDm?0:220}}>
                <div style={{...C.card,padding:16,height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",boxSizing:"border-box"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:C.accent,marginBottom:12}}>Messages</div>
                  <input style={{...inputStyle,marginBottom:12,fontSize:12}} placeholder="Search users..." value={dmSearch} onChange={e=>setDmSearch(e.target.value)}/>
                  <div style={{flex:1,overflowY:"auto"}}>
                    {/* Existing DMs */}
                    {dms.map(d=>{const other=users.find(u=>u.id===(d.user1===currentUser.id?d.user2:d.user1));if(!other)return null;const last=d.messages[d.messages.length-1];return(
                      <div key={d.id} onClick={()=>setActiveDm(d.id)} style={{display:"flex",gap:9,padding:"8px",borderRadius:10,cursor:"pointer",background:activeDm===d.id?"rgba(74,174,232,0.1)":"transparent",marginBottom:4,transition:"background 0.15s"}} onMouseEnter={e=>activeDm!==d.id&&(e.currentTarget.style.background="rgba(74,174,232,0.05)")} onMouseLeave={e=>activeDm!==d.id&&(e.currentTarget.style.background="transparent")}>
                        <UserAvatar user={other} size={34} fontSize={17}/>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{other.username}</div><div style={{fontSize:11,color:C.text3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last?.text||"Say hi!"}</div></div>
                      </div>
                    );})}
                    {/* Start new DM */}
                    <div style={{fontSize:11,color:C.text3,marginTop:12,marginBottom:8}}>Start a conversation</div>
                    {users.filter(u=>u.id!==currentUser.id&&u.username.toLowerCase().includes(dmSearch.toLowerCase())).map(u=>(
                      <div key={u.id} onClick={()=>openDm(u.id)} style={{display:"flex",gap:8,padding:"7px 8px",borderRadius:9,cursor:"pointer",marginBottom:4,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(74,174,232,0.07)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <UserAvatar user={u} size={28} fontSize={14}/>
                        <span style={{fontSize:13,color:C.text2}}>{u.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat area */}
              <div style={{flex:1,minWidth:0,...C.card,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                {activeDmData&&activeDmUser?(
                  <>
                    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                      {isMobile&&<button style={{...btnG,padding:"4px 10px",fontSize:12}} onClick={()=>setActiveDm(null)}>← Back</button>}
                      <UserAvatar user={activeDmUser} size={32} fontSize={16}/>
                      <span style={{fontWeight:600,color:C.text,fontSize:14}}>{activeDmUser.username}</span>
                    </div>
                    <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
                      {activeDmData.messages.length===0&&<div style={{textAlign:"center",color:C.text3,marginTop:40,fontSize:13}}>No messages yet. Say hi! 👋</div>}
                      {activeDmData.messages.map(m=>(
                        <div key={m.id} style={{display:"flex",justifyContent:m.from===currentUser.id?"flex-end":"flex-start",gap:7,alignItems:"flex-end"}}>
                          {m.from!==currentUser.id&&<UserAvatar user={activeDmUser} size={24} fontSize={12}/>}
                          <div style={{maxWidth:"70%",padding:"8px 12px",borderRadius:m.from===currentUser.id?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.from===currentUser.id?"linear-gradient(135deg,#1a5a8a,#2a2a6a)":"rgba(255,255,255,0.06)",border:m.from===currentUser.id?`1px solid rgba(74,174,232,0.25)`:`1px solid ${C.border}`,fontSize:13,color:C.text2,lineHeight:1.5}}>
                            {m.text}
                            <div style={{fontSize:10,color:C.text3,marginTop:4,textAlign:m.from===currentUser.id?"right":"left"}}>{timeAgo(m.time)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
                      <input style={{...inputStyle,flex:1}} placeholder={`Message ${activeDmUser.username}...`} value={dmInput} onChange={e=>setDmInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendDm()}}/>
                      <button style={{...btnP,padding:"9px 16px",fontSize:13}} onClick={sendDm}>Send</button>
                    </div>
                  </>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:C.text3,flexDirection:"column",gap:12}}>
                    <div style={{fontSize:40}}>✉️</div>
                    <div style={{fontSize:14}}>Select a conversation or start a new one</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        {!isMobile&&(
          <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>
            {/* Bookmarks */}
            <div style={{...C.card,padding:14}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>🔖 Bookmarks</div>
              {posts.filter(p=>p.bookmarkedBy.includes(currentUser.id)).length===0&&<div style={{fontSize:11,color:C.text3}}>No bookmarks yet.</div>}
              {posts.filter(p=>p.bookmarkedBy.includes(currentUser.id)).slice(0,4).map(p=>(
                <div key={p.id} onClick={()=>{setTab("forum");setTimeout(()=>setExpanded(p.id),100)}} style={{fontSize:12,color:C.text2,marginBottom:8,cursor:"pointer",lineHeight:1.3,padding:"4px 0",borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.text2}>{p.title}</div>
              ))}
            </div>
            {/* Online now */}
            <div style={{...C.card,padding:14}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>🌊 Online Now</div>
              {users.map(u=>(
                <div key={u.id} onClick={()=>openFullProfile(u.id)} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer",borderRadius:8,padding:"3px 4px",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(74,174,232,0.07)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <UserAvatar user={u} size={26} fontSize={13}/>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:C.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.username}</div>{u.role==="mod"&&<div style={{fontSize:9,color:"#f0a848",fontWeight:600}}>🛡️ Mod</div>}</div>
                </div>
              ))}
            </div>
            {/* Following feed */}
            {currentUser.following.length>0&&(
              <div style={{...C.card,padding:14}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:10}}>👥 Following</div>
                {posts.filter(p=>currentUser.following.includes(p.authorId)).slice(0,3).map(p=>(
                  <div key={p.id} onClick={()=>{setTab("forum");setTimeout(()=>setExpanded(p.id),100)}} style={{fontSize:12,color:C.text2,marginBottom:8,cursor:"pointer",lineHeight:1.3,padding:"4px 0",borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>e.currentTarget.style.color=C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.text2}>{p.title}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Journal Update Box ───────────────────────────────────────────────────────
function JournalUpdateBox({ postId, onSubmit, inputStyle, btnP }) {
  const [text, setText] = useState("");
  return (
    <div style={{marginTop:14,padding:"12px 14px",borderRadius:10,border:"1px solid rgba(120,200,232,0.25)",background:"rgba(120,200,232,0.05)"}}>
      <div style={{fontSize:12,color:"#78c8e8",marginBottom:8,fontWeight:600}}>📝 Add Journal Update</div>
      <textarea style={{...inputStyle,resize:"none",marginBottom:8}} value={text} onChange={e=>setText(e.target.value)} placeholder="Write your next journal entry..." rows={2}/>
      <button style={{...btnP,padding:"6px 16px",fontSize:12}} onClick={()=>{onSubmit(postId,text);setText("")}}>Post Update</button>
    </div>
  );
}
