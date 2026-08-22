const crypto = require("crypto");
const { db } = require("./_db");

const COOKIE = "sohby_session";
const DAYS = 30;

function hashToken(token){
  return crypto.createHash("sha256").update(token).digest("hex");
}
function parseCookies(req){
  const raw=req.headers.cookie||"";
  return Object.fromEntries(raw.split(";").map(v=>v.trim()).filter(Boolean).map(v=>{
    const i=v.indexOf("="); return [v.slice(0,i),decodeURIComponent(v.slice(i+1))];
  }));
}
async function currentUser(req){
  const token=parseCookies(req)[COOKIE];
  if(!token) return null;
  const sql=db();
  const rows=await sql`
    select u.id,u.username,u.email,u.display_name as "displayName",u.bio,u.avatar_url as "avatarUrl"
    from sessions s join users u on u.id=s.user_id
    where s.token_hash=${hashToken(token)} and s.expires_at > now()
    limit 1`;
  return rows[0]||null;
}
function setSessionCookie(res, token){
  res.setHeader("Set-Cookie",`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAYS*86400}`);
}
function clearSessionCookie(res){
  res.setHeader("Set-Cookie",`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
async function createSession(userId,res){
  const token=crypto.randomBytes(32).toString("hex");
  const sql=db();
  await sql`insert into sessions(user_id,token_hash,expires_at) values(${userId},${hashToken(token)},now()+interval '30 days')`;
  setSessionCookie(res,token);
}
async function deleteSession(req,res){
  const token=parseCookies(req)[COOKIE];
  if(token) await db()`delete from sessions where token_hash=${hashToken(token)}`;
  clearSessionCookie(res);
}
module.exports={currentUser,createSession,deleteSession};
