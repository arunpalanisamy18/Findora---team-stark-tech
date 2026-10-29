import {Router} from 'express';
import {randomInt,createHash,scrypt as scryptCb,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {User} from '../models/User.js';
import {AppError} from '../middleware/errorHandler.js';
import {signToken,requireAuth} from '../middleware/auth.js';
import {audit} from '../services/audit.js';
const scrypt=promisify(scryptCb); export const authRouter=Router();
const hashCode=(v:string)=>createHash('sha256').update(v).digest('hex');
async function hashPassword(p:string){const salt=randomInt(0,0x7fffffff).toString(16)+randomInt(0,0x7fffffff).toString(16);const key=await scrypt(p,salt,64) as Buffer;return `${salt}:${key.toString('hex')}`}
async function checkPassword(p:string,stored:string){const [salt,keyHex]=stored.split(':');if(!salt||!keyHex)return false;const key=await scrypt(p,salt,64) as Buffer;const expected=Buffer.from(keyHex,'hex');return key.length===expected.length&&timingSafeEqual(key,expected)}
function validatePassword(p:unknown){return typeof p==='string'&&p.length>=12&&p.length<=128&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/\d/.test(p)&&/[^A-Za-z0-9]/.test(p)}
function deliverCode(email:string,code:string,purpose:string){
  if(process.env.NODE_ENV!=='production'&&process.env.AUTH_DEV_SHOW_OTP==='true'){
    const banner = [
      '',
      '======================================================',
      `[FINDORA SECURITY OTP] ${purpose.toUpperCase()}`,
      `Recipient: ${email}`,
      `One-Time Passcode (OTP): >>> ${code} <<<`,
      `Valid for: 10 minutes`,
      `Generated At: ${new Date().toLocaleTimeString()}`,
      '======================================================',
      ''
    ].join('\n');
    console.log(banner);
    return;
  }
  if(!process.env.EMAIL_PROVIDER_URL||!process.env.EMAIL_PROVIDER_TOKEN){
    console.warn(`[${purpose}] email provider not configured; delivery unavailable for ${email}`);
    return;
  }
  console.info(`[${purpose}] provider configured; delivery adapter must be implemented for configured provider`);
}
authRouter.post('/register',async(req,res,next)=>{try{const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=req.body.password,phone=req.body.phone?String(req.body.phone).trim():undefined;if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!validatePassword(password))throw new AppError('Provide a valid name and email. Password must be 12–128 characters with upper/lowercase, number, and symbol.',400);if(await User.exists({email}))throw new AppError('Unable to register with these details',409);const code=String(randomInt(100000,1000000));const user=await User.create({name,email,phone,passwordHash:await hashPassword(password),verificationCodeHash:hashCode(code),verificationExpiresAt:new Date(Date.now()+10*60*1000)});deliverCode(email,code,'email-verification');await audit('user.register','user',String(user._id),req);res.status(201).json({success:true,message:'Account created. Enter the 6-digit verification code.',data:{id:user.id,email:user.email,emailVerified:false}})}catch(e){next(e)}});
authRouter.post('/verify-email',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim(),code=String(req.body.code||'');const user=await User.findOne({email}).select('+verificationCodeHash');if(!user||!user.verificationCodeHash||!user.verificationExpiresAt||user.verificationExpiresAt<new Date()||!timingSafeEqual(Buffer.from(hashCode(code)),Buffer.from(user.verificationCodeHash)))throw new AppError('Invalid or expired verification code',400);await User.updateOne({_id:user._id},{$set:{emailVerified:true},$unset:{verificationCodeHash:1,verificationExpiresAt:1}});res.json({success:true,message:'Email verified. You can now sign in.'})}catch(e){next(e)}});
authRouter.post('/login',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim(),password=String(req.body.password||'');const user=await User.findOne({email}).select('+passwordHash');if(!user||!(await checkPassword(password,user.passwordHash)))throw new AppError('Invalid email or password',401);if(!user.emailVerified)throw new AppError('Verify your email before signing in',403);const token=signToken({id:String(user._id),role:user.role,email:user.email});await audit('user.login','user',String(user._id),req);res.json({success:true,data:{token,user:{id:user.id,name:user.name,email:user.email,role:user.role,emailVerified:user.emailVerified}}})}catch(e){next(e)}});
authRouter.post('/password-reset/request',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim();const user=await User.findOne({email});if(user){const code=String(randomInt(100000,1000000));await User.updateOne({_id:user._id},{$set:{resetCodeHash:hashCode(code),resetExpiresAt:new Date(Date.now()+10*60*1000)}});deliverCode(email,code,'password-reset');}else{console.log(`\n[FINDORA NOTICE] Password reset requested for unregistered email: ${email}\n`);}res.json({success:true,message:user?'Reset code sent. Please check your console or inbox.':'If the account exists, reset instructions will be sent.'})}catch(e){next(e)}});
authRouter.post('/password-reset/confirm',async(req,res,next)=>{try{const email=String(req.body.email||'').toLowerCase().trim(),code=String(req.body.code||''),password=req.body.password;if(!validatePassword(password))throw new AppError('Password must be 12–128 characters with upper/lowercase, number, and symbol',400);const user=await User.findOne({email}).select('+resetCodeHash');if(!user||!user.resetCodeHash||!user.resetExpiresAt||user.resetExpiresAt<new Date()||!timingSafeEqual(Buffer.from(hashCode(code)),Buffer.from(user.resetCodeHash)))throw new AppError('Invalid or expired reset code',400);await User.updateOne({_id:user._id},{$set:{passwordHash:await hashPassword(password),emailVerified:true},$unset:{resetCodeHash:1,resetExpiresAt:1}});await audit('user.password_reset','user',String(user._id),req);res.json({success:true,message:'Password reset. Please sign in again.'})}catch(e){next(e)}});
authRouter.get('/me',requireAuth,async(req,res,next)=>{try{const user=await User.findById(req.authUser!.id).select('name email phone role emailVerified phoneVerified createdAt');if(!user)throw new AppError('Account not found',404);res.json({success:true,data:user})}catch(e){next(e)}});
