const crypto=require("crypto");
const {db}=require("./_db");
const {createSession}=require("./_auth");

function json(res,status,data){res.statusCode=status;res.setHeader("Content-Type","application/json");res.end(JSON.stringify(data))}
function hashPassword(password){
  const salt=crypto.randomBytes(16).toString("hex");
  const hash=crypto.scryptSync(password,salt,64).toString("hex");
  return `${salt}:${hash}`;
}
module.exports=async(req,res)=>{
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  try{
    const {email,password,username,displayName}=req.body||{};
    if(!email||!password||!username||!displayName) return json(res,400,{error:"كل البيانات مطلوبة"});
    if(password.length<8) return json(res,400,{error:"كلمة المرور لازم تكون 8 أحرف على الأقل"});
    if(!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return json(res,400,{error:"اسم المستخدم: إنجليزي/أرقام/_ من 3 إلى 30 حرف"});
    const sql=db();
    const emailNorm=String(email).trim().toLowerCase();
    const exists=await sql`select id from users where email=${emailNorm} or username=${username.toLowerCase()} limit 1`;
    if(exists.length) return json(res,409,{error:"البريد أو اسم المستخدم مستخدم بالفعل"});
    const rows=await sql`
      insert into users(username,email,password_hash,display_name)
      values(${username.toLowerCase()},${emailNorm},${hashPassword(password)},${String(displayName).trim()})
      returning id,username,email,display_name as "displayName",bio,avatar_url as "avatarUrl"`;
    await createSession(rows[0].id,res);
    return json(res,201,{user:rows[0]});
  }catch(e){console.error(e);return json(res,500,{error:"تعذر إنشاء الحساب"})}
};