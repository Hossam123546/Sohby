const crypto=require("crypto");
const {db}=require("./_db");
const {createSession}=require("./_auth");

function json(res,status,data){res.statusCode=status;res.setHeader("Content-Type","application/json");res.end(JSON.stringify(data))}
function verifyPassword(password,stored){
  const [salt,hex]=String(stored).split(":");
  if(!salt||!hex) return false;
  const actual=crypto.scryptSync(password,salt,64);
  const expected=Buffer.from(hex,"hex");
  return actual.length===expected.length && crypto.timingSafeEqual(actual,expected);
}
module.exports=async(req,res)=>{
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  try{
    const {email,password}=req.body||{};
    const sql=db();
    const rows=await sql`select id,username,email,password_hash,display_name as "displayName",bio,avatar_url as "avatarUrl" from users where email=${String(email||"").trim().toLowerCase()} limit 1`;
    if(!rows[0]||!verifyPassword(password||"",rows[0].password_hash)) return json(res,401,{error:"البريد الإلكتروني أو كلمة المرور غير صحيحة"});
    delete rows[0].password_hash;
    await createSession(rows[0].id,res);
    return json(res,200,{user:rows[0]});
  }catch(e){console.error(e);return json(res,500,{error:"تعذر تسجيل الدخول"})}
};