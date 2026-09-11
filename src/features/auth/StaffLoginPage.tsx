"use client";
import {useEffect,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {AuthBanner} from './components/AuthBanner';
import {AuthField} from './components/AuthDesign';
import {StaffAuthPanel} from './components/StaffAuthPanel';
import styles from './components/StaffAuth.module.css';
import {signInStaff} from './staff-actions';
function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M20 10a10 10 0 10-11.563 9.879v-6.99H5.898V10h2.539V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.889h-2.33v6.99A10.002 10.002 0 0020 10z" fill="#1877F2"/>
    </svg>
  );
}


export function StaffLoginPageContent(){
 const router=useRouter(),params=useSearchParams();
 useEffect(()=>{sessionStorage.setItem("mobi-auth-presentation","staff")},[]);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false);
 const [banner,setBanner]=useState<{type:'error'|'success';title:string;message:string}|null>(params.get('error')?{type:'error',title:'No pudimos iniciar sesión',message:params.get('error')==='inactive'?'Tu cuenta está inactiva. Comunicate con un administrador.':'Tu cuenta todavía no está configurada. Comunicate con un administrador.'}:null);
 async function submit(){if(busy)return;setBusy(true);try{const result=await signInStaff({email,password});if(!result.ok){setBanner({type:'error',title:'No pudimos iniciar sesión',message:result.error});return;}const next=params.get('redirect');router.push(next?.startsWith('/dashboard')&&!next.startsWith('//')?next:'/dashboard');}catch{setBanner({type:'error',title:'No se pudo conectar',message:'Revisá tu conexión e intentá nuevamente.'});}finally{setBusy(false);}}
 return <div className={styles.shell}>
 {banner&&<AuthBanner {...banner} onClose={()=>setBanner(null)}/>}
 <Link href="/" className={styles.logo} aria-label="Inicio de Mobi Prop"><img src="/auth/logo.svg" alt="" width={30} height={30}/><div>Mobi <span>Prop</span></div></Link>
 <main className={styles.left}><form className={styles.form} onSubmit={e=>{e.preventDefault();void submit();}}>
 <header className={styles.heading}><h1>Te damos la bienvenida</h1><p>Qué bueno verte de nuevo. Iniciá sesión en tu cuenta.</p></header>
 <div className={styles.fields}><AuthField label="Correo electrónico" icon="email" type="email" required autoComplete="username" placeholder="Ingresá tu correo" value={email} onChange={e=>setEmail(e.target.value)}/><AuthField label="Contraseña" icon="lock" required autoComplete="current-password" type={show?'text':'password'} placeholder="Ingresá tu contraseña" value={password} onChange={e=>setPassword(e.target.value)} reveal={show} onReveal={()=>setShow(!show)}/><div className={styles.options}><label><input type="checkbox" name="remember"/>Mantene mi sesión</label><Link href="/reset-password?view=staff">¿Olvidaste tu contraseña?</Link></div></div>
 <div className={styles.divider}>O</div><div className={styles.socials}>{['apple','google','facebook'].map(name=><button key={name} type="button" disabled title={`El acceso con ${name} todavía no está habilitado para el equipo`} aria-label={`Acceso con ${name} no disponible`}>{name === "facebook" ? <FacebookLogo/> : <img src={`/auth/${name}.svg`} alt="" width={20} height={20}/>}</button>)}</div>
 <button className={styles.submit} disabled={busy}>{busy?'Ingresando…':'Log In'}</button><p className={styles.note}>¿Necesitás una cuenta? Pedile una invitación a un administrador.</p>
 </form></main><StaffAuthPanel/><footer className={styles.footer}><span>© 2026 Mobi Prop</span><Link href="/privacy-policy">Privacidad</Link><Link href="/terms-conditions">Términos</Link></footer></div>
}
