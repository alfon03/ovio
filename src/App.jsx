import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines, Home, Search, Library, Compass, Users, UserRound, ListMusic,
  Settings, LogOut, Heart, Play, Pause, SkipBack, SkipForward, Volume2,
  Plus, Music2, Disc3, UploadCloud, ShieldCheck, Radio, Link2,
  X, Check, Clock3, ArrowLeft, BadgeCheck, Flag, Sparkles, LockKeyhole, Bell, BellRing,
  Globe2, Menu, Trash2, AlertCircle, Eye, Headphones, RefreshCcw, Share2, ImagePlus, Bookmark, Send, Newspaper, Trophy, CalendarDays, TrendingUp, Shuffle, Repeat, Repeat1, ListPlus, ListOrdered, ChevronUp, ChevronDown
} from 'lucide-react';
import { supabase, configured, assetUrl, safeError } from './supabase';
import { recommendTracks, latestFromFollowed } from './discovery';
import { buildPersonalizedMixes, recommendAlbums } from './mixes';
import { listenedDelta } from './analytics';
import ArtistInsights from './ArtistInsights';
import {createQueue, nextPosition, toggleShuffle, cycleRepeat, enqueueNext, removeUpcoming, moveUpcoming, resumePosition} from './player-queue';
import { normalizeUsername, validateUsername, normalizeArtistName, validateArtistName, validateEmail } from './identity';
import { passwordIssue, isRecoveryRoute, recoveryRedirectUrl } from './auth-security';

const genres = ['Todos', 'Rap', 'Trap', 'Reguetón', 'Pop', 'Indie', 'Electrónica', 'Rock', 'R&B', 'Otro'];
const uuid = () => crypto.randomUUID();
const photoStyles = [
  ['#7958eb', '#10bcd3', '#171338'], ['#ec599e', '#7844c9', '#251029'],
  ['#3c79df', '#942cc0', '#0e1a37'], ['#18a4ad', '#8853f5', '#151525'],
  ['#cd6537', '#8c3ceb', '#291a28'], ['#1c8a72', '#3f3eaa', '#10172c']
];

function Logo({ small = false }) {
  return <span className="brand"><svg className="brand-symbol" viewBox="0 0 102 72" aria-hidden="true">
    <defs><linearGradient id="ovio-gradient" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#9146f8"/><stop offset=".48" stopColor="#7764fc"/><stop offset="1" stopColor="#2ce2f7"/></linearGradient></defs>
    <path d="M46 36C46 20 36 12 25 12 13 12 7 22 7 35S13 59 27 59C39 59 46 48 50 37" fill="none" stroke="url(#ovio-gradient)" strokeWidth="16" strokeLinecap="round"/>
    <path d="M50 37c5-13 13-24 26-24 12 0 20 11 20 23 0 14-9 23-21 23-12 0-22-10-25-22" fill="none" stroke="url(#ovio-gradient)" strokeWidth="16" strokeLinecap="round"/>
  </svg>{!small && <span>OVIO</span>}</span>;
}
function Cover({ title='', genre='', n=0, compact=false, coverPath='' }) {
  const [a,b,c] = photoStyles[Math.abs(n)%photoStyles.length];
  const coverUrl = assetUrl('covers',coverPath);
  return <div className={'cover-art '+(compact?'compact':'')} style={{background:coverUrl?`linear-gradient(0deg,rgba(4,4,9,.60),transparent),url("${coverUrl}") center/cover`:`radial-gradient(circle at 75% 21%,${a},transparent 49%),radial-gradient(circle at 16% 82%,${b},transparent 49%),${c}`}}>
    {!coverUrl&&<div className="cover-orbit"/>}<span className="cover-name">{title}</span>{!compact&&genre&&<span className="cover-tag">{genre}</span>}
  </div>;
}
function Avatar({ profile, size='regular' }) {
  const url = assetUrl('avatars', profile?.avatar_path);
  return <span className={'avatar '+size} style={url?{backgroundImage:`url("${url}")`,backgroundSize:'cover',backgroundPosition:'center'}:{}}>{!url&&(profile?.display_name?.[0]||'O').toUpperCase()}</span>;
}
function ImagePicker({name, label, maxMb=5, defaultUrl=''}) {
  const [preview,setPreview] = useState('');
  const [warning,setWarning] = useState('');
  useEffect(()=>()=>{ if(preview)URL.revokeObjectURL(preview); },[preview]);
  function changed(e) {
    const f=e.target.files?.[0];
    setPreview(''); setWarning('');
    if(!f)return;
    if(!['image/jpeg','image/png','image/webp'].includes(f.type) || f.size>maxMb*1024*1024) {
      setWarning(`Usa JPG, PNG o WebP, máximo ${maxMb} MB.`); e.target.value='';return;
    }
    setPreview(URL.createObjectURL(f));
  }
  return <label className="image-picker">{label}<input type="file" name={name} accept="image/jpeg,image/png,image/webp" onChange={changed}/>
    {(preview||defaultUrl)&&<img className="image-preview" src={preview||defaultUrl} alt="Vista previa de la imagen seleccionada"/>}
    {warning&&<span className="field-error">{warning}</span>}
  </label>;
}
async function audioDuration(file) {
  return new Promise(resolve=>{
    const url=URL.createObjectURL(file), audio=document.createElement('audio');
    let done=false;
    const finish=(seconds)=>{if(done)return;done=true;window.clearTimeout(timer);audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);resolve(Number.isFinite(seconds)&&seconds>0?Math.min(36000,Math.round(seconds)):0);};
    const timer=window.setTimeout(()=>finish(0),6000);
    audio.preload='metadata';audio.onloadedmetadata=()=>finish(audio.duration);audio.onerror=()=>finish(0);audio.src=url;
  });
}
function Toast({value}) { return value?<div role="status" className="toast">{value}</div>:null; }
function Loader(){return <div className="loading"><Logo/><div className="spinner"/>Cargando OVIO...</div>}

function Setup() {
  return <main className="setup-page"><div className="setup-card"><Logo/><span className="pill muted-pill">Código real · pendiente de configuración</span>
    <h1>OVIO ya tiene una base programada.</h1><p>Para activar usuarios reales y guardar canciones necesitamos conectar tu proyecto Supabase. La demo anterior sigue disponible mientras tanto.</p>
    <div className="setup-steps"><div><b>01</b> Crea un proyecto en Supabase.</div><div><b>02</b> Ejecuta <code>sql/001_initial.sql</code> en SQL Editor.</div><div><b>03</b> Copia <code>.env.example</code> a <code>.env</code> y añade la URL y clave pública.</div><div><b>04</b> Reinicia <code>npm run dev</code>.</div></div>
    <div className="row wrap"><a className="button primary" href="/demo.html">Abrir demo anterior</a><a className="button ghost" href="/landing.html">Ver landing</a></div>
    <p className="small">Nunca coloques la clave <code>service_role</code> o claves secretas en archivos <code>VITE_*</code>.</p>
  </div></main>;
}

// Previsualización: comprobar no reserva nombres. UNIQUE en Postgres resuelve la carrera.
function AvailabilityField({kind='username',name,value,onChange,excludeOwn=false,allowEmpty=false}) {
  const [status,setStatus]=useState({mode:'idle',message:''});
  const cleaned=kind==='artist'?normalizeArtistName(value):normalizeUsername(value);
  const invalid=kind==='artist'?validateArtistName(cleaned):validateUsername(cleaned);
  useEffect(()=>{
    if(!cleaned){setStatus({mode:'idle',message:allowEmpty?'Puedes elegir tu nombre de usuario cuando quieras.':''});return;}
    if(invalid){setStatus({mode:'error',message:invalid});return;}
    if(excludeOwn){setStatus({mode:'idle',message:'Tu identificador actual.'});return;}
    let active=true;
    setStatus({mode:'checking',message:'Comprobando disponibilidad…'});
    const id=setTimeout(async()=>{
      const {data,error}=await supabase.rpc(kind==='artist'?'ovio_artist_name_available':'ovio_username_available',{candidate:cleaned});
      if(!active)return;
      if(error){setStatus({mode:'error',message:'No se pudo comprobar. ¿Has aplicado la migración 009?'});return;}
      setStatus(data?{mode:'ok',message:'Disponible ✓'}:{mode:'error',message:'Ya está en uso. Prueba otro nombre.'});
    },420);
    return()=>{active=false;clearTimeout(id);};
  },[kind,cleaned,invalid,excludeOwn,allowEmpty]);
  return <label>{kind==='artist'?'Nombre artístico':'Nombre de usuario'}
    <input name={name} value={value} onChange={e=>onChange(e.target.value)} required={!allowEmpty} minLength={kind==='artist'?2:3} maxLength={kind==='artist'?70:24} autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" placeholder={kind==='artist'?'Tu nombre en los escenarios':'ejemplo_music'}/>
    <small aria-live="polite" className={'availability-status '+status.mode}>{status.message}</small>
  </label>;
}

function Auth({notify,initialMessage=''}){
  const [mode,setMode] = useState('login');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState(initialMessage);
  const [username,setUsername] = useState('');
  function changeMode(next){setMode(next);setMessage('');}
  async function submit(e){
    e.preventDefault(); if(busy)return;
    setBusy(true);setMessage('');
    const fd = new FormData(e.currentTarget);
    const email=String(fd.get('email')||'').trim();
    const emailError=validateEmail(email);
    if(emailError){setMessage(emailError);setBusy(false);return;}
    try{
      if(mode==='recover'){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{
          redirectTo:recoveryRedirectUrl(window.location.origin,window.location.pathname)
        });
        if(error){
          setMessage('No hemos podido procesar la solicitud en este momento. Espera unos minutos y vuelve a intentarlo.');
        } else {
          // No revelar si la dirección está registrada.
          setMessage('Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa también spam.');
        }
        return;
      }
      const password=String(fd.get('password')||'');
      let res;
      if(mode==='register'){
        const userName=normalizeUsername(fd.get('username'));
        const nameError=validateUsername(userName);
        if(nameError){setMessage(nameError);return;}
        const pwdError=passwordIssue(password);
        if(pwdError){setMessage(pwdError);return;}
        const availability=await supabase.rpc('ovio_username_available',{candidate:userName});
        if(availability.error){setMessage('No podemos verificar el nombre. Comprueba que hayas ejecutado la migración 009.');return;}
        if(!availability.data){setMessage('Este nombre de usuario ya está en uso. Prueba otro.');return;}
        res = await supabase.auth.signUp({email,password,options:{
          emailRedirectTo: window.location.origin + window.location.pathname,
          data:{display_name:String(fd.get('name')||'').trim(),username:userName}
        }});
      } else res = await supabase.auth.signInWithPassword({email,password});
      if(res.error){
        setMessage(mode==='register'?'No se ha podido crear la cuenta. Comprueba los datos o intenta de nuevo.':safeError(res.error));
        notify('No se ha podido acceder.');
      } else if(mode==='register'){
        setMode('login');
        setMessage('Si se ha aceptado el registro, recibirás un correo para confirmar tu cuenta. Comprueba también spam.');
        setUsername('');
      }
    } catch {
      setMessage('No se pudo conectar con el servicio. Inténtalo de nuevo más tarde.');
    } finally {setBusy(false);}
  }
  return <main className="auth-page"><div className="auth-left"><Logo/><div><span className="eyebrow">Una nueva escena musical</span><h1>Tu música.<br/><span className="grad-text">Tu gente.</span></h1><p>Descubre artistas antes que nadie, guarda tus canciones y construye tu propia comunidad musical.</p><div className="auth-decoration"><Logo small/></div></div><span className="small">Beta gratuita · Solo música original revisada</span></div>
  <div className="auth-right"><div className="auth-panel"><span className="pill">Tu cuenta de OVIO</span><h2>{mode==='register'?'Crea tu cuenta':mode==='recover'?'Recupera tu acceso':'Vuelve a tu música'}</h2><p>{mode==='register'?'Elige un nombre único y confirma tu correo para entrar.':mode==='recover'?'Te enviaremos un enlace para crear una nueva contraseña.':'Entra para escuchar, descubrir y crear listas.'}</p><form onSubmit={submit} className="stack">
    {mode==='register'&&<><label>Nombre visible<input required name="name" maxLength="60" placeholder="¿Cómo te llamamos?"/></label><AvailabilityField kind="username" name="username" value={username} onChange={setUsername}/></>}
    <label>Correo electrónico<input required name="email" type="email" maxLength="254" autoComplete="email" placeholder="tu@correo.com"/></label>
    {mode!=='recover'&&<label>Contraseña<input required name="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?12:1} placeholder={mode==='register'?'12 caracteres como mínimo':'Tu contraseña'}/></label>}
    {mode==='register'&&<p className="small auth-security-hint">Utiliza al menos 12 caracteres, con letras y algún número o símbolo.</p>}
    {message&&<p role="status" className="form-message">{message}</p>}
    <button type="submit" className="button primary wide" disabled={busy}>{busy?'Un momento...':mode==='register'?'Crear mi cuenta':mode==='recover'?'Enviar enlace de recuperación':'Iniciar sesión'}</button>
  </form>
  {mode==='login'&&<button type="button" className="text-button auth-recover-link" onClick={()=>changeMode('recover')}>¿Has olvidado tu contraseña?</button>}
  <button type="button" className="text-button" onClick={()=>changeMode(mode==='login'?'register':'login')}>{mode==='register'?'¿Ya tienes cuenta? Inicia sesión':mode==='recover'?'Volver al inicio de sesión':'¿No tienes cuenta? Regístrate gratis'}</button>
  <p className="small auth-note">La beta no incluye publicidad, suscripciones ni pagos a artistas.</p></div></div></main>;
}

function PasswordReset({session,onDone,onCancel}){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  async function submit(e){
    e.preventDefault();if(!session?.user||busy)return;
    setBusy(true);setMessage('');
    const fd=new FormData(e.currentTarget);
    const password=String(fd.get('password')||'');
    const confirm=String(fd.get('confirm')||'');
    const issue=passwordIssue(password);
    if(issue){setMessage(issue);setBusy(false);return;}
    if(password!==confirm){setMessage('Las contraseñas no coinciden.');setBusy(false);return;}
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error){setMessage(safeError(error));return;}
      await onDone();
    }catch {setMessage('No se ha podido actualizar la contraseña. Prueba de nuevo.');}
    finally{setBusy(false);}
  }
  return <main className="auth-page"><div className="auth-left"><Logo/><div><span className="eyebrow">Protegemos tu cuenta</span><h1>Vuelve a<br/><span className="grad-text">escuchar.</span></h1><p>Elige una nueva contraseña para OVIO.</p></div></div>
    <div className="auth-right"><div className="auth-panel"><span className="pill">Seguridad de tu cuenta</span><h2>Crear nueva contraseña</h2>
    {!session?.user?<><p role="alert" className="form-message">No tenemos una sesión de recuperación válida. El enlace puede haber caducado o haber sido utilizado.</p><p>Puedes solicitar otro enlace desde «¿Has olvidado tu contraseña?».</p><button type="button" className="button primary wide" onClick={onCancel}>Volver al inicio de sesión</button></>:
    <><p>Vas a actualizar la contraseña de <b>{session.user.email}</b>. Al terminar te pediremos iniciar sesión otra vez.</p>
    <form className="stack" onSubmit={submit}><label>Nueva contraseña<input name="password" type={showPassword?'text':'password'} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Mínimo 12 caracteres"/></label>
    <label>Confirmar contraseña<input name="confirm" type={showPassword?'text':'password'} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Repite la contraseña"/></label>
    <label className="check-label"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/>Mostrar contraseña</label>
    <p className="small auth-security-hint">12 a 128 caracteres, al menos una letra y un número o símbolo.</p>{message&&<p role="alert" className="form-message">{message}</p>}
    <button type="submit" className="button primary wide" disabled={busy}>{busy?'Guardando...':'Guardar nueva contraseña'}</button></form>
    <button type="button" className="text-button" disabled={busy} onClick={onCancel}>Cancelar recuperación</button></>}
    </div></div></main>;
}

const navs = [
  ['home','Inicio',Home],['search','Buscar',Search],['explore','Descubrir',Compass],
  ['library','Tu biblioteca',Library],['community','Comunidad',Users],
  ['charts','Top OVIO',Trophy],['recap','Mi año en OVIO',CalendarDays]
];
function SectionHeading({title,detail='',button}) {return <div className="section-heading"><div><h2>{title}</h2>{detail&&<p className="subtext">{detail}</p>}</div>{button}</div>}
function Blank({icon:Icon=Music2,title,description,button}){return <div className="blank"><Icon size={28}/><h3>{title}</h3><p>{description}</p>{button}</div>}

export default function App(){
  const [session,setSession] = useState(null);
  const [boot,setBoot] = useState(true);
  const [recoveryMode,setRecoveryMode] = useState(()=>isRecoveryRoute(window.location.search,window.location.hash));
  const [authFeedback,setAuthFeedback] = useState('');
  const [page,setPage] = useState('home');
  const [selected,setSelected] = useState(null);
  const [database,setDatabase] = useState({profiles:[],artists:[],tracks:[],releases:[],likes:[],follows:[],playlists:[],playlistTracks:[],listens:[],reports:[],stats:[],followerCounts:[],notifications:[],playlistSaves:[],artistUpdates:[],updateReports:[],savedReleases:[]});
  const [isAdmin,setIsAdmin] = useState(false);
  const [loading,setLoading] = useState(false);
  const [notice,setNotice] = useState('');
  const [modal,setModal] = useState(null);
  const [query,setQuery] = useState('');
  const [newArtistName,setNewArtistName] = useState('');
  const [profileUsername,setProfileUsername] = useState(null);
  useEffect(()=>setProfileUsername(null),[session?.user?.id]);
  const [genre,setGenre] = useState('Todos');
  const [current,setCurrent] = useState(null);
  const [playing,setPlaying] = useState(false);
  const [elapsed,setElapsed] = useState(0);
  const [duration,setDuration] = useState(0);
  const [volume,setVolume] = useState(.75);
  const [queueState,setQueueState] = useState({ids:[],baseIds:[],cursor:-1,shuffle:false,repeat:'off'});
  const [resumeEnabled,setResumeEnabled] = useState(false);
  const [bookmarks,setBookmarks] = useState([]);
  const [bookmarkLoading,setBookmarkLoading] = useState(false);
  const [mobileMenu,setMobileMenu] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [songRelease,setSongRelease] = useState('');
  const [catalogQuery,setCatalogQuery] = useState('');
  const [catalogStatus,setCatalogStatus] = useState('all');
  const [analyticsSettings,setAnalyticsSettings] = useState({country_code:'ZZ',analytics_enabled:false});
  const [draftAnalyticsSettings,setDraftAnalyticsSettings] = useState({country_code:'ZZ',analytics_enabled:false});
  const analyticsEnabledRef=useRef(false);
  const [charts,setCharts] = useState({tracks:[],artists:[],genres:[]});
  const [chartsLoading,setChartsLoading] = useState(false);
  const [chartScope,setChartScope] = useState('ALL');
  const [chartGenre,setChartGenre] = useState('Todos');
  const [chartMonth,setChartMonth] = useState(new Date().toISOString().slice(0,7));
  const [recapYear,setRecapYear] = useState(new Date().getFullYear());
  const [recap,setRecap] = useState(null);
  const playbackRef = useRef(null);
  const audioRef = useRef(null);
  const countedRef = useRef(new Set());
  const deepLinkConsumed = useRef(false);
  const queueRef = useRef({ids:[],baseIds:[],cursor:-1,shuffle:false,repeat:'off'});
  const playRequestRef = useRef(0);
  const bookmarkNowRef = useRef(null);
  const clearBookmarkRef = useRef(null);
  const bookmarkEnabledRef = useRef(false);
  const bookmarkUserRef = useRef(null);
  const lastBookmarkWriteRef = useRef({trackId:null,seconds:0});
  const resumeStartRef = useRef(null);
  const bookmarkWriteChainRef = useRef(Promise.resolve());
  const currentRef = useRef(null);
  const nextTrackRef = useRef(null);
  const recordListenRef = useRef(null);
  useEffect(()=>{analyticsEnabledRef.current=analyticsSettings.analytics_enabled;},[analyticsSettings.analytics_enabled]);
  useEffect(()=>{bookmarkEnabledRef.current=resumeEnabled;bookmarkUserRef.current=session?.user?.id||null;},[resumeEnabled,session?.user?.id]);
  function setPlayerQueue(q){queueRef.current=q;setQueueState(q);}
  async function flushListeningProgress(){
    const p=playbackRef.current;
    if(!p||!analyticsEnabledRef.current||!supabase||p.seconds<=p.sent)return;
    const seconds=Math.floor(p.seconds);p.sent=seconds;
    if(!seconds)return;
    const {error}=await supabase.rpc('record_ovio_progress',{
      p_track_id:p.trackId,p_session_key:p.sessionKey,p_played_seconds:seconds
    });
    if(error && playbackRef.current?.sessionKey===p.sessionKey){p.sent=Math.min(p.sent,Math.max(0,seconds-1));}
  }
  const notify=(m)=>{setNotice(m);window.clearTimeout(window.__ovioNotice);window.__ovioNotice=window.setTimeout(()=>setNotice(''),4000)};

  useEffect(()=>{
    if(!configured){setBoot(false);return;}
    let alive=true;
    supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setBoot(false)}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,next)=>{
      if(event==='PASSWORD_RECOVERY')setRecoveryMode(true);
      setSession(next);
    });
    return ()=>{alive=false;subscription.unsubscribe()};
  },[]);
  useEffect(()=>{
    if(!session?.user){setDatabase({profiles:[],artists:[],tracks:[],releases:[],likes:[],follows:[],playlists:[],playlistTracks:[],listens:[],reports:[],stats:[],followerCounts:[],notifications:[],playlistSaves:[],artistUpdates:[],updateReports:[],savedReleases:[]});setIsAdmin(false);setBookmarks([]);setResumeEnabled(false);return;}
    loadAll(session.user.id);
  },[session?.user?.id]);
  useEffect(()=>{
    if(!session?.user?.id||!configured)return;
    let active=true;setBookmarkLoading(true);
    Promise.all([
      supabase.from('playback_preferences').select('resume_enabled').eq('user_id',session.user.id).maybeSingle(),
      supabase.from('playback_bookmarks').select('track_id,position_seconds,updated_at').order('updated_at',{ascending:false}).limit(100)
    ]).then(([pref,res])=>{
      if(!active)return;
      if(pref.error||res.error){notify('No se ha podido consultar «Seguir escuchando». Comprueba la migración 007.');}
      else{setResumeEnabled(Boolean(pref.data?.resume_enabled));setBookmarks(res.data||[]);}
      setBookmarkLoading(false);
    });
    return()=>{active=false};
  },[session?.user?.id]);
  // Serializar escrituras: una pausa, salto o fin de canción no debe permitir
  // que una escritura anterior restaure el progreso después de eliminarlo.
  function scheduleBookmarkWrite(task){
    const next=bookmarkWriteChainRef.current.catch(()=>{}).then(task);
    bookmarkWriteChainRef.current=next;
    return next;
  }
  function saveBookmark(trackId,seconds,total){
    const userId=bookmarkUserRef.current;
    if(!bookmarkEnabledRef.current||!userId||!trackId||!supabase)return Promise.resolve();
    const position=resumePosition(seconds,total);
    if(!position)return Promise.resolve();
    lastBookmarkWriteRef.current={trackId,seconds:position};
    return scheduleBookmarkWrite(async()=>{
      if(!bookmarkEnabledRef.current||bookmarkUserRef.current!==userId)return;
      const {error}=await supabase.from('playback_bookmarks').upsert({user_id:userId,track_id:trackId,position_seconds:position,updated_at:new Date().toISOString()},{onConflict:'user_id,track_id'});
      if(!error&&bookmarkUserRef.current===userId){
        setBookmarks(old=>[{track_id:trackId,position_seconds:position,updated_at:new Date().toISOString()},...old.filter(x=>x.track_id!==trackId)].slice(0,100));
      }
    });
  }
  function clearBookmark(trackId){
    const userId=bookmarkUserRef.current;
    if(!bookmarkEnabledRef.current||!userId||!trackId)return Promise.resolve();
    return scheduleBookmarkWrite(async()=>{
      if(bookmarkUserRef.current!==userId)return;
      const {error}=await supabase.from('playback_bookmarks').delete().eq('user_id',userId).eq('track_id',trackId);
      if(!error&&bookmarkUserRef.current===userId)setBookmarks(old=>old.filter(x=>x.track_id!==trackId));
    });
  }
  function bookmarkNow(force=false){
    const a=audioRef.current,trackId=currentRef.current;
    if(!a||!trackId||!bookmarkEnabledRef.current)return;
    const total=Number.isFinite(a.duration)?a.duration:0;
    if(!total)return;
    if(total-a.currentTime<10){if(lastBookmarkWriteRef.current.trackId!==trackId||lastBookmarkWriteRef.current.seconds!==-1){lastBookmarkWriteRef.current={trackId,seconds:-1};void clearBookmark(trackId);}return;}
    if(!force&&lastBookmarkWriteRef.current.trackId===trackId&&Math.abs(a.currentTime-lastBookmarkWriteRef.current.seconds)<20)return;
    if(a.currentTime<12){if(force)void clearBookmark(trackId);return;}
    if(resumePosition(a.currentTime,total))void saveBookmark(trackId,a.currentTime,total);
  }
  bookmarkNowRef.current=bookmarkNow;
  clearBookmarkRef.current=clearBookmark;
  async function changeBookmarkPreference(enabled){
    const userId=session?.user?.id;if(!userId)return;
    if(!enabled&&!window.confirm('¿Desactivar Seguir escuchando y borrar los puntos guardados de tus canciones?'))return;
    // Desactivar primero en el cliente para detener los nuevos guardados.
    if(!enabled){bookmarkEnabledRef.current=false;setResumeEnabled(false);}
    const {error}=await supabase.from('playback_preferences').upsert({user_id:userId,resume_enabled:enabled,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error){setResumeEnabled(!enabled);bookmarkEnabledRef.current=!enabled;return notify('No se pudo guardar: '+safeError(error));}
    if(!enabled){
      await bookmarkWriteChainRef.current.catch(()=>{});
      const {error:deleteError}=await supabase.from('playback_bookmarks').delete().eq('user_id',userId);
      if(deleteError)return notify('No se pudieron borrar los puntos: '+safeError(deleteError));
      setBookmarks([]);
    }
    bookmarkEnabledRef.current=enabled;setResumeEnabled(enabled);
    notify(enabled?'«Seguir escuchando» activado para próximas canciones.':'Progreso guardado eliminado y seguimiento desactivado.');
  }
  useEffect(()=>{if(!audioRef.current){const a = new Audio();a.preload='none';a.volume=volume;audioRef.current=a;}
    const a=audioRef.current;
    const onTime=()=>{
      setElapsed(a.currentTime);
      const p=playbackRef.current;
      if(p&&analyticsEnabledRef.current&&!a.paused&&!a.seeking){
        const now=Date.now();const mediaDelta=a.currentTime-p.lastTime;
        const realDelta=(now-p.lastWall)/1000;
        // Un salto de búsqueda no equivale a minutos escuchados.
        const counted=listenedDelta(mediaDelta,realDelta);
        if(counted>0){
          p.seconds+=counted;
          if(p.seconds-p.sent>=12)void flushListeningProgress();
        }
        p.lastTime=a.currentTime;p.lastWall=now;
      }
      if(!a.paused&&!a.seeking&&currentRef.current)bookmarkNowRef.current?.();
      if(a.currentTime>=30&&currentRef.current&&!countedRef.current.has(currentRef.current)){
        countedRef.current.add(currentRef.current);recordListenRef.current?.(currentRef.current);
      }
    };
    const onDuration=()=>{
      setDuration(Number.isFinite(a.duration)?a.duration:0);
      const resume=resumeStartRef.current;
      if(resume&&resume.trackId===currentRef.current){
        const pos=resumePosition(resume.seconds,a.duration);
        if(pos)a.currentTime=pos;
        resumeStartRef.current=null;
      }
    };
    const onEnded=()=>{void clearBookmarkRef.current?.(currentRef.current);void flushListeningProgress();setPlaying(false);nextTrackRef.current?.(false,true);};
    const onPause=()=>{bookmarkNowRef.current?.(true);void flushListeningProgress();setPlaying(false);};
    const onPlay=()=>{const p=playbackRef.current;if(p){p.lastTime=a.currentTime;p.lastWall=Date.now();}setPlaying(true);};
    const onSeek=()=>{const p=playbackRef.current;if(p){p.lastTime=a.currentTime;p.lastWall=Date.now();}bookmarkNowRef.current?.(true);};
    a.addEventListener('timeupdate',onTime);a.addEventListener('loadedmetadata',onDuration);a.addEventListener('ended',onEnded);a.addEventListener('play',onPlay);a.addEventListener('pause',onPause);a.addEventListener('seeked',onSeek);
    return ()=>{a.pause();a.removeEventListener('timeupdate',onTime);a.removeEventListener('loadedmetadata',onDuration);a.removeEventListener('ended',onEnded);a.removeEventListener('play',onPlay);a.removeEventListener('pause',onPause);a.removeEventListener('seeked',onSeek)};
  },[]);
  useEffect(()=>{if(audioRef.current)audioRef.current.volume=volume},[volume]);
  // Refresco ligero del buzón: no cambia el reproductor ni fuerza a recargar toda la app.
  useEffect(()=>{
    if(!session?.user?.id||!configured)return;
    let cancelled=false;
    const check=async()=>{
      const {data,error}=await supabase.from('notifications')
        .select('id,user_id,event_type,title,message,related_id,created_at,read_at')
        .order('created_at',{ascending:false}).limit(100);
      if(!cancelled&&!error)setDatabase(d=>({...d,notifications:data||[]}));
    };
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible')check()},60000);
    const onFocus=()=>check();window.addEventListener('focus',onFocus);
    return ()=>{cancelled=true;window.clearInterval(timer);window.removeEventListener('focus',onFocus)};
  },[session?.user?.id]);

  async function loadAll(uid=session?.user?.id){
    if(!uid)return;
    setLoading(true);
    const tables=['profiles','artist_applications','tracks','releases','likes','follows','playlists','playlist_tracks','listen_events','artists_public','playlist_saves','artist_updates','saved_releases'];
    const results=await Promise.all([...tables.map(t=>supabase.from(t).select('*').limit(1000)),supabase.rpc('is_admin'),supabase.rpc('my_track_stats'),supabase.rpc('artist_follower_counts')]);
    const [profiles,personalArtists,tracks,releases,likes,follows,playlists,playlistTracks,listens,publicArtists,playlistSaves,artistUpdates,savedReleases]=results.slice(0,13).map(r=>r.data||[]);
    const artists=[...publicArtists,...personalArtists.filter(a=>!publicArtists.some(p=>p.user_id===a.user_id))];
    const admin=Boolean(results[13].data);setIsAdmin(admin);
    const errors=results.filter(r=>r.error);if(errors.length)notify('No se han podido cargar algunos datos: '+safeError(errors[0].error));
    let reports=[],updateReports=[];if(admin){
      const [r,ur]=await Promise.all([supabase.from('copyright_reports').select('*').limit(1000),supabase.from('artist_update_reports').select('*').limit(1000)]);
      reports=r.data||[];updateReports=ur.data||[];
    }
    const notificationResult=await supabase.from('notifications').select('id,user_id,event_type,title,message,related_id,created_at,read_at').order('created_at',{ascending:false}).limit(100);
    if(notificationResult.error)notify('No se han cargado los avisos: '+safeError(notificationResult.error));
    setDatabase({profiles,artists,tracks,releases,likes,follows,playlists,playlistTracks,listens,reports,stats:results[14].data||[],followerCounts:results[15].data||[],notifications:notificationResult.data||[],playlistSaves,artistUpdates,updateReports,savedReleases});
    const {data:settings,error:settingsError}=await supabase.from('listening_settings')
      .select('country_code,analytics_enabled').eq('user_id',uid).maybeSingle();
    if(!settingsError){const actual=settings||{country_code:'ZZ',analytics_enabled:false};setAnalyticsSettings(actual);setDraftAnalyticsSettings(actual);}
    setLoading(false);
    if(!deepLinkConsumed.current){
      const q=new URLSearchParams(location.search).get('playlist');
      const artistId=new URLSearchParams(location.search).get('artist');
      const listenerId=new URLSearchParams(location.search).get('user');
      if(q&&playlists.some(p=>p.id===q)){setSelected(q);setPage('playlist');window.history.replaceState(null,'',window.location.pathname);}
      else if(artistId&&artists.some(a=>a.user_id===artistId&&a.status==='approved')){
        setSelected(artistId);setPage('artist');window.history.replaceState(null,'',window.location.pathname);
      }else if(listenerId&&profiles.some(p=>p.id===listenerId)){
        setSelected(listenerId);setPage('listener');window.history.replaceState(null,'',window.location.pathname);
      }
      deepLinkConsumed.current=true;
    }
  }
  useEffect(()=>{
    if(!session?.user?.id||!configured||!['home','charts'].includes(page))return;
    let active=true;
    async function getCharts(){
      setChartsLoading(true);
      const [year,month]=chartMonth.split('-').map(Number);
      const {data,error}=await supabase.rpc('get_ovio_charts',{
        p_year:year,p_month:month,p_country:chartScope,p_genre:chartGenre
      });
      if(active){
        setCharts(data||{tracks:[],artists:[],genres:[]});setChartsLoading(false);
        if(error)setNotice('No se cargaron los rankings: '+safeError(error));
      }
    }
    getCharts();return()=>{active=false};
  },[session?.user?.id,chartMonth,chartScope,chartGenre,page]);
  useEffect(()=>{
    if(!session?.user?.id||!configured||page!=='recap')return;
    let active=true;setRecap(null);
    supabase.rpc('get_my_ovio_recap',{p_year:recapYear}).then(({data,error})=>{
      if(active){setRecap(error?{error:safeError(error)}:data);}
    });
    return()=>{active=false};
  },[session?.user?.id,page,recapYear,analyticsSettings.analytics_enabled]);
  const uid=session?.user?.id;
  const myProfile=database.profiles.find(p=>p.id===uid) || {display_name:'Oyente'};
  const myApplication=database.artists.find(a=>a.user_id===uid);
  const approvedArtist=myApplication?.status==='approved';
  const publicTracks=database.tracks.filter(t=>t.status==='approved');
  const artistName=(id)=>database.artists.find(a=>a.user_id===id&&a.status==='approved')?.artist_name||database.profiles.find(p=>p.id===id)?.display_name||'Artista';
  const profileFor=(id)=>database.profiles.find(p=>p.id===id) || {display_name:artistName(id)};
  const releaseFor=(id)=>database.releases.find(r=>r.id===id);
  const coverForTrack=(t)=>t?.cover_path||releaseFor(t?.release_id)?.cover_path;
  const followerCount=(artistId)=>Number(database.followerCounts.find(f=>f.artist_id===artistId)?.follower_count||0);
  const myPlaylists=database.playlists.filter(p=>p.owner_id===uid);
  const unreadCount=database.notifications.filter(n=>!n.read_at).length;
  const resumable=bookmarks.map(b=>({bookmark:b,track:publicTracks.find(t=>t.id===b.track_id)})).filter(x=>x.track&&resumePosition(x.bookmark.position_seconds,x.track.duration_seconds)).slice(0,8);
  const liked=(id)=>database.likes.some(l=>l.track_id===id);
  const following=(id)=>database.follows.some(f=>f.artist_id===id);
  const savedPlaylist=(id)=>database.playlistSaves.some(s=>s.playlist_id===id&&s.user_id===uid);
  const savedPlaylists=database.playlists.filter(p=>p.is_public&&savedPlaylist(p.id));
  const savedRelease=(id)=>database.savedReleases.some(r=>r.user_id===uid&&r.release_id===id);
  const savedAlbums=database.releases.filter(r=>savedRelease(r.id)&&publicTracks.some(t=>t.release_id===r.id));
  const visibleUpdates=database.artistUpdates.filter(u=>u.status==='approved').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const followedUpdates=visibleUpdates.filter(u=>following(u.artist_id));
  const playsById=useMemo(()=>database.listens.reduce((m,e)=>(m[e.track_id]=(m[e.track_id]||0)+1,m),{}),[database.listens]);
  const recommended=useMemo(()=>recommendTracks({
    tracks:database.tracks, likes:database.likes, listens:database.listens,
    follows:database.follows, followerCounts:database.followerCounts, limit:30
  }),[database.tracks,database.likes,database.listens,database.follows,database.followerCounts]);
  const personalizedMixes=useMemo(()=>buildPersonalizedMixes({
    tracks:database.tracks,likes:database.likes,listens:database.listens,
    follows:database.follows,followerCounts:database.followerCounts,limit:12
  }),[database.tracks,database.likes,database.listens,database.follows,database.followerCounts]);
  const suggestedAlbums=useMemo(()=>recommendAlbums({
    releases:database.releases,tracks:database.tracks,likes:database.likes,
    listens:database.listens,follows:database.follows,
    savedIds:database.savedReleases.map(x=>x.release_id),limit:8
  }),[database.releases,database.tracks,database.likes,database.listens,database.follows,database.savedReleases]);
  const followedReleases=useMemo(()=>latestFromFollowed({
    tracks:database.tracks,follows:database.follows,limit:6
  }),[database.tracks,database.follows]);
  function nav(to,id=null){setPage(to);setSelected(id);setMobileMenu(false);window.scrollTo({top:0,behavior:'smooth'});}
  async function mutate(request,success='Guardado correctamente'){
    const {error}=await request;if(error){notify(safeError(error));return false;}
    notify(success);await loadAll(uid);return true;
  }
  async function markNotificationRead(id=null){
    const ids=database.notifications.filter(n=>!n.read_at&&(!id||n.id===id)).map(n=>n.id);
    if(!ids.length)return;
    const {error}=await supabase.from('notifications').update({read_at:new Date().toISOString()}).in('id',ids);
    if(error)return notify('No se pudieron marcar como leídas: '+safeError(error));
    setDatabase(d=>({...d,notifications:d.notifications.map(n=>ids.includes(n.id)?{...n,read_at:new Date().toISOString()}:n)}));
  }
  async function updatePendingTrack(form){
    if(!modal?.track||modal.track.status!=='pending')return;
    const title=String(form.get('title')||'').trim();
    const genre=String(form.get('genre')||'Otro');
    const trackNumber=modal.track.release_id?Number(form.get('track_number')):1;
    if(!title||title.length>100)return notify('Introduce un título válido.');
    if(trackNumber<1||trackNumber>99||!Number.isInteger(trackNumber))return notify('Número de pista entre 1 y 99.');
    const {error}=await supabase.rpc('update_my_pending_track',{
      p_track_id:modal.track.id,p_title:title,p_genre:genre,p_track_number:trackNumber
    });
    if(error)return notify('No se pudo editar: '+safeError(error));
    setModal(null);notify('Metadatos guardados. La canción sigue pendiente de revisión.');await loadAll(uid);
  }
  async function toggleLike(trackId){
    if(liked(trackId))await mutate(supabase.from('likes').delete().eq('user_id',uid).eq('track_id',trackId),'Quitada de favoritos');
    else await mutate(supabase.from('likes').insert({user_id:uid,track_id:trackId}),'Añadida a favoritos');
  }
  async function toggleFollow(id){
    if(following(id))await mutate(supabase.from('follows').delete().eq('user_id',uid).eq('artist_id',id),'Ya no sigues a este artista');
    else await mutate(supabase.from('follows').insert({user_id:uid,artist_id:id}),'Ahora sigues a este artista');
  }
  async function togglePlaylistSave(p){
    if(!p.is_public || p.owner_id===uid)return notify('Solo puedes guardar listas públicas de otros usuarios.');
    const request=savedPlaylist(p.id)
      ?supabase.from('playlist_saves').delete().eq('user_id',uid).eq('playlist_id',p.id)
      :supabase.from('playlist_saves').insert({user_id:uid,playlist_id:p.id});
    await mutate(request,savedPlaylist(p.id)?'Lista quitada de guardadas':'Lista guardada en tu biblioteca');
  }
  async function publishUpdate(form){
    if(!approvedArtist)return notify('Debes tener un perfil de artista aprobado.');
    const body=String(form.get('body')||'').trim();
    const trackId=String(form.get('track_id')||'');
    if(body.length<10||body.length>500)return notify('Escribe entre 10 y 500 caracteres.');
    if(trackId&&!publicTracks.some(t=>t.id===trackId&&t.artist_id===uid))return notify('Solo puedes enlazar canciones propias aprobadas.');
    const ok=await mutate(supabase.from('artist_updates').insert({artist_id:uid,body,track_id:trackId||null}),
       'Novedad enviada para revisión. Aún no es pública.');
    if(ok)setModal(null);
  }
  async function reviewUpdate(updateId,status,note=''){
    if(!isAdmin||!['approved','rejected'].includes(status))return;
    if(status==='rejected'&&note.trim().length<10)return notify('Explica el rechazo (10 caracteres mínimo).');
    const ok=await mutate(supabase.from('artist_updates').update({status,review_note:note.trim(),reviewed_at:new Date().toISOString()})
      .eq('id',updateId).eq('status','pending'),status==='approved'?'Novedad aprobada':'Novedad rechazada');
    if(ok)setModal(null);
  }
  async function shareUser(userId){
    const link=`${location.origin}/?user=${encodeURIComponent(userId)}`;
    try { await navigator.clipboard.writeText(link);notify('Enlace del perfil copiado'); }
    catch { window.prompt('Copia este enlace:',link); }
  }
  async function reportUpdate(form){
    if(!modal?.update)return;
    const reason=String(form.get('reason')||'').trim();
    if(reason.length<15||reason.length>1500)return notify('Explica la denuncia entre 15 y 1500 caracteres.');
    const ok=await mutate(supabase.from('artist_update_reports').insert({reporter_id:uid,update_id:modal.update.id,reason}),
      'Denuncia recibida por moderación');
    if(ok)setModal(null);
  }
  async function resolveUpdateReport(reportId){
    if(!isAdmin)return;
    await mutate(supabase.from('artist_update_reports').update({status:'resolved'}).eq('id',reportId),
      'Denuncia marcada como resuelta');
  }
  async function saveListeningSettings(form){
    const country_code=String(form.get('country_code')||'ZZ');
    const analytics_enabled=form.get('analytics_enabled')==='yes';
    if(!analytics_enabled&&analyticsSettings.analytics_enabled&&!window.confirm(
       'Desactivar borrará tu historial de estadísticas OVIO y tu resumen anual. ¿Continuar?'))return;
    const {error}=await supabase.from('listening_settings').upsert({
      user_id:uid,country_code,analytics_enabled,updated_at:new Date().toISOString()
    },{onConflict:'user_id'});
    if(error)return notify('No se pudieron guardar tus preferencias: '+safeError(error));
    setAnalyticsSettings({country_code,analytics_enabled});
    setDraftAnalyticsSettings({country_code,analytics_enabled});
    if(!analytics_enabled)playbackRef.current=null;
    notify(analytics_enabled?'Estadísticas activadas para próximas escuchas.':'Historial borrado y seguimiento desactivado.');
  }
  async function playTrack(t, context=publicTracks, {keepQueue=false,resumeAt=0,position=null}={}){
    if(!t?.audio_path||t.status!=='approved')return notify('Esta canción no está disponible.');
    const requestId=++playRequestRef.current;
    const {data,error}=await supabase.storage.from('song-audio').createSignedUrl(t.audio_path,3600);
    if(requestId!==playRequestRef.current)return;
    if(error){notify('No se puede reproducir esta canción: '+safeError(error));return;}
    const a=audioRef.current;
    if(!a)return;
    bookmarkNowRef.current?.(true);
    a.pause();void flushListeningProgress();playbackRef.current=null;
    if(analyticsEnabledRef.current){
      const sessionKey=crypto.randomUUID();
      const {error:progressError}=await supabase.rpc('record_ovio_progress',{p_track_id:t.id,p_session_key:sessionKey,p_played_seconds:0});
      if(requestId!==playRequestRef.current)return;
      if(!progressError)playbackRef.current={trackId:t.id,sessionKey,seconds:0,sent:0,lastTime:0,lastWall:Date.now()};
    }
    if(keepQueue&&position!==null){setPlayerQueue({...queueRef.current,cursor:position});}
    else if(!keepQueue){setPlayerQueue(createQueue(t.id,context.filter(x=>x.status==='approved').map(x=>x.id),{shuffle:queueRef.current.shuffle,repeat:queueRef.current.repeat}));}
    currentRef.current=t.id;setCurrent(t);setElapsed(0);setDuration(t.duration_seconds||0);
    lastBookmarkWriteRef.current={trackId:t.id,seconds:0};
    resumeStartRef.current=resumeAt>0?{trackId:t.id,seconds:resumeAt}:null;
    a.src=data.signedUrl;
    try{await a.play()}catch(err){if(requestId===playRequestRef.current)notify('El navegador ha bloqueado la reproducción. Pulsa Play.');}
  }
  async function nextTrack(back=false,ended=false){
    const q=queueRef.current;
    if(!q.ids.length)return;
    if(back&&!ended&&audioRef.current?.currentTime>3){audioRef.current.currentTime=0;setElapsed(0);return;}
    const position=nextPosition(q,{back,ended});
    if(position===null){setPlaying(false);audioRef.current?.pause();if(audioRef.current)audioRef.current.currentTime=0;setElapsed(0);return;}
    const t=publicTracks.find(x=>x.id===q.ids[position]);
    if(!t)return notify('La siguiente canción ya no está disponible.');
    await playTrack(t,publicTracks,{keepQueue:true,position});
  }
  function addToQueue(t){
    if(!current){void playTrack(t);return;}
    if(queueRef.current.ids.includes(t.id))return notify('Esta canción ya está en la cola.');
    setPlayerQueue(enqueueNext(queueRef.current,t.id));notify('Canción añadida a la cola.');
  }
  function removeFromQueue(id){setPlayerQueue(removeUpcoming(queueRef.current,id));}
  function adjustQueue(id,delta){setPlayerQueue(moveUpcoming(queueRef.current,id,delta));}
  nextTrackRef.current=(back=false,ended=false)=>nextTrack(back,ended);
  recordListenRef.current=(trackId)=>recordListen(trackId);
  async function recordListen(id){
    if(!uid)return;
    const {error}=await supabase.from('listen_events').insert({user_id:uid,track_id:id});
    if(!error)loadAll(uid); // A lo sumo una escucha contabilizada por día; nunca se usa para remunerar.
  }
  async function toggleSavedRelease(release){
    if(!uid||!release?.id)return;
    if(!publicTracks.some(t=>t.release_id===release.id))return notify('Este álbum todavía no tiene canciones aprobadas.');
    const existing=savedRelease(release.id);
    const request=existing
      ?supabase.from('saved_releases').delete().eq('user_id',uid).eq('release_id',release.id)
      :supabase.from('saved_releases').insert({user_id:uid,release_id:release.id});
    await mutate(request,existing?'Álbum quitado de tu biblioteca':'Álbum guardado en tu biblioteca');
  }
  async function saveSuggestedMix(mix){
    if(!uid||!mix?.tracks?.length)return notify('Este mix no tiene canciones disponibles.');
    const ids=[...new Set(mix.tracks.filter(t=>t.status==='approved').map(t=>t.id))];
    if(!ids.length)return notify('Aún no hay canciones aprobadas para esta lista.');
    // Nueva playlist SIEMPRE privada: el oyente puede hacerla pública después.
    const {data:created,error}=await supabase.from('playlists')
      .insert({owner_id:uid,name:`OVIO · ${mix.title}`.slice(0,75),description:mix.detail.slice(0,250),is_public:false})
      .select('id').single();
    if(error)return notify('No se pudo crear la playlist: '+safeError(error));
    const {error:insertError}=await supabase.from('playlist_tracks')
      .insert(ids.map(track_id=>({playlist_id:created.id,track_id})));
    if(insertError){
      // Evita dejar una lista incompleta si falla una inserción masiva.
      await supabase.from('playlists').delete().eq('id',created.id).eq('owner_id',uid);
      return notify('No se pudieron añadir las canciones: '+safeError(insertError));
    }
    await loadAll(uid);
    notify('Mix guardado como playlist privada. Puedes editarlo o compartirlo cuando quieras.');
    nav('playlist',created.id);
  }
  async function createPlaylist(form){
    const name=String(form.get('name')||'').trim(), description=String(form.get('description')||'').trim();
    const data={name,description,is_public:form.get('is_public')==='true'};
    if(!name)return notify('Pon un título para la playlist.');
    const ok=modal?.playlist?await mutate(supabase.from('playlists').update(data).eq('id',modal.playlist.id),'Playlist actualizada'):
      await mutate(supabase.from('playlists').insert({...data,owner_id:uid}),'Playlist creada');
    if(ok)setModal(null);
  }
  async function addSongToPlaylist(playlistId,trackId){
    if(database.playlistTracks.some(x=>x.playlist_id===playlistId&&x.track_id===trackId))return notify('Esa canción ya está en la lista.');
    const ok=await mutate(supabase.from('playlist_tracks').insert({playlist_id:playlistId,track_id:trackId}),'Canción añadida a tu playlist');if(ok)setModal(null);
  }
  async function removeSongFromPlaylist(playlistId,trackId){await mutate(supabase.from('playlist_tracks').delete().eq('playlist_id',playlistId).eq('track_id',trackId),'Canción retirada de la lista');}
  async function deletePlaylist(p){
    if(!window.confirm(`¿Eliminar la playlist «${p.name}»?`))return;
    const ok=await mutate(supabase.from('playlists').delete().eq('id',p.id),'Playlist eliminada');
    if(ok)nav('library');
  }
  async function updateProfile(form){
    const candidate=normalizeUsername(form.get('username'));
    const isLegacy=myProfile.username?.startsWith('u_')&&myProfile.username?.length===34;
    const keepLegacy=isLegacy&&!candidate;
    const data={display_name:String(form.get('display_name')||'').trim(),bio:String(form.get('bio')||'').trim(),city:String(form.get('city')||'').trim(),...(keepLegacy?{}:{username:candidate})};
    if(!data.display_name)return notify('Necesitamos un nombre público.');
    const invalid=keepLegacy?'':validateUsername(candidate);
    if(invalid)return notify(invalid);
    if(!keepLegacy&&candidate!==myProfile.username){
      const {data:available,error}=await supabase.rpc('ovio_username_available',{candidate});
      if(error)return notify('No se pudo comprobar el nombre de usuario.');
      if(!available)return notify('Este nombre de usuario ya está en uso.');
    }
    const {error}=await supabase.from('profiles').update(data).eq('id',uid);
    if(error)return notify(error.code==='23505'?'Ese usuario acaba de ser reservado. Elige otro.':safeError(error));
    notify('Perfil actualizado');setProfileUsername(null);await loadAll(uid);
  }
  async function changeAvatar(file){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)return notify('Foto JPG, PNG o WebP de hasta 2 MB.');
    const path=`${uid}/${uuid()}.${file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}`;
    const {error}=await supabase.storage.from('avatars').upload(path,file,{contentType:file.type});
    if(error)return notify(safeError(error));
    await mutate(supabase.from('profiles').update({avatar_path:path}).eq('id',uid),'Foto de perfil guardada');
  }
  async function applyArtist(form){
    const data={user_id:uid,artist_name:normalizeArtistName(form.get('artist_name')),genre:String(form.get('genre')||'Rap'),bio:String(form.get('bio')||'').trim()};
    const invalid=validateArtistName(data.artist_name);
    if(invalid)return notify(invalid);
    const {data:available,error:availabilityError}=await supabase.rpc('ovio_artist_name_available',{candidate:data.artist_name});
    if(availabilityError)return notify('No se pudo comprobar el nombre artístico.');
    if(!available)return notify('Ese nombre artístico ya está reservado.');
    const {error}=await supabase.from('artist_applications').insert(data);
    if(error)return notify(error.code==='23505'?'Ese nombre artístico acaba de reservarse. Prueba otro.':safeError(error));
    notify('Solicitud de artista enviada. Espera la revisión.');setModal(null);setNewArtistName('');await loadAll(uid);
  }
  async function uploadCover(file, maxMb=5, bucket='covers'){
    if(!file?.size)return {path:null,error:null};
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>maxMb*1024*1024)
      return {path:null,error:`Imagen JPG/PNG/WebP de hasta ${maxMb} MB.`};
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${uid}/${uuid()}.${ext}`;
    const {error}=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type});
    return {path:error?null:path,error:error?safeError(error):null};
  }
  async function changeArtistBanner(file){
    if(!approvedArtist)return notify('Necesitas un perfil de artista aprobado.');
    if(!file)return;
    setUploading(true);
    const uploaded=await uploadCover(file,5,'artist-banners');
    if(uploaded.error){notify(uploaded.error);setUploading(false);return;}
    const ok=await mutate(supabase.from('profiles').update({banner_path:uploaded.path}).eq('id',uid),'Cabecera de artista actualizada');
    if(!ok&&uploaded.path)await supabase.storage.from('artist-banners').remove([uploaded.path]);
    setUploading(false);
  }
  async function shareArtist(id){
    const url=`${location.origin}/?artist=${encodeURIComponent(id)}`;
    try{await navigator.clipboard.writeText(url);notify('Enlace del artista copiado.')}catch{window.prompt('Copia este enlace:',url);}
  }
  async function createRelease(form){
    const title=String(form.get('title')||'').trim();if(!title)return notify('Escribe el título.');
    const editing=modal?.release;
    const cannotEdit=editing && database.tracks.some(t=>t.release_id===editing.id&&t.status==='approved');
    if(cannotEdit)return notify('El álbum tiene canciones públicas; contacta con soporte para cambios.');
    setUploading(true);
    try {
      const image=await uploadCover(form.get('cover'));
      if(image.error)return notify(image.error);
      const payload={title,kind:String(form.get('kind')||'album'),description:String(form.get('description')||''),...(image.path?{cover_path:image.path}:{})};
      const request=editing?supabase.from('releases').update(payload).eq('id',editing.id):supabase.from('releases').insert({...payload,artist_id:uid});
      const ok=await mutate(request,editing?'Álbum actualizado':'Álbum creado en tu estudio');
      if(!ok&&image.path)await supabase.storage.from('covers').remove([image.path]);
      if(ok)setModal(null);
    }finally {setUploading(false);}
  }
  async function uploadSong(form){
    const file=form.get('audio');const title=String(form.get('title')||'').trim();
    if(!file?.size||!title)return notify('Elige un audio y escribe un título.');
    const isWav=/\.wav$/i.test(file.name), isMp3=/\.mp3$/i.test(file.name);
    if((!isWav&&!isMp3)||file.size>30*1024*1024||
       (file.type&&!['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave'].includes(file.type)))
       return notify('Solo MP3/WAV de hasta 30 MB.');
    if(form.get('rights')!=='yes')return notify('Debes confirmar que tienes todos los derechos de la canción y la base.');
    const releaseId=String(form.get('release_id')||'');
    if(releaseId&&!database.releases.some(r=>r.id===releaseId&&r.artist_id===uid))return notify('Álbum no válido.');
    const coverFile=form.get('cover');
    if(releaseId&&coverFile?.size)return notify('Las canciones del álbum comparten la portada del álbum.');
    setUploading(true);
    const trackId=uuid(),path=`${uid}/${trackId}.${isWav?'wav':'mp3'}`;
    let evidencePath=null,coverPath=null,inserted=false;
    try {
      const proof=form.get('evidence');
      if(proof?.size&&(!['application/pdf','image/jpeg','image/png','image/webp'].includes(proof.type)||proof.size>10*1024*1024))
        return notify('Prueba de autoría PDF/imagen de máximo 10 MB.');
      if(!releaseId){
        const cover=await uploadCover(coverFile);
        if(cover.error)return notify(cover.error);
        coverPath=cover.path;
      }
      const duration=await audioDuration(file);
      const upload=await supabase.storage.from('song-audio').upload(path,file,{contentType:isWav?'audio/wav':'audio/mpeg'});
      if(upload.error)return notify('No se pudo subir el audio: '+safeError(upload.error));
      if(proof?.size){
        const ext=proof.type==='application/pdf'?'pdf':proof.type==='image/png'?'png':proof.type==='image/webp'?'webp':'jpg';
        evidencePath=`${uid}/${trackId}.${ext}`;
        const uploaded=await supabase.storage.from('song-evidence').upload(evidencePath,proof,{contentType:proof.type});
        if(uploaded.error)return notify('No se pudo subir la prueba: '+safeError(uploaded.error));
      }
      const trackNumber=releaseId?Number(form.get('track_number')||1):1;
      const {error}=await supabase.from('tracks').insert({id:trackId,artist_id:uid,release_id:releaseId||null,title,
        genre:String(form.get('genre')||'Otro'),audio_path:path,evidence_path:evidencePath,cover_path:coverPath,
        duration_seconds:duration,track_number:trackNumber,rights_original:true});
      if(error)return notify('No se ha guardado la canción: '+safeError(error));
      inserted=true;
      notify('Canción subida. Pendiente de revisión del administrador.');setModal(null);await loadAll(uid);
      return;
    }finally {
      // Nunca borres un audio si la inserción se ha confirmado: la consulta de seguimiento podría fallar.
      if(!inserted){
        await supabase.storage.from('song-audio').remove([path]);
        if(evidencePath)await supabase.storage.from('song-evidence').remove([evidencePath]);
        if(coverPath)await supabase.storage.from('covers').remove([coverPath]);
      }
      setUploading(false);
    }
  }
  async function review(table,id,status,note=''){
    if(!isAdmin)return notify('Esta operación necesita permisos de administrador.');
    if((table==='tracks'||table==='artist_applications') && !['approved','rejected'].includes(status))return;
    if(status==='rejected' && note.trim().length<10)return notify('Explica el rechazo con al menos 10 caracteres.');
    if(table==='artist_applications'||table==='tracks'){
      const column=table==='artist_applications'?'user_id':'id';
      const label=table==='artist_applications'?'Solicitud de artista':'Canción';
      const payload={status,review_note:note.trim(),reviewed_at:new Date().toISOString()};
      const ok=await mutate(supabase.from(table).update(payload).eq(column,id),
        `${label} ${status==='approved'?'aprobada':'rechazada'}`);
      if(ok)setModal(null);
    }else if(table==='copyright_reports'){
      const ok=await mutate(supabase.from(table).update({status:'resolved'}).eq('id',id),'Denuncia marcada como resuelta');
      if(ok)setModal(null);
    }
  }
  async function reportSong(form){
    if(!modal?.track)return;
    const reason=String(form.get('reason')||'').trim();if(reason.length<15)return notify('Explica la reclamación con al menos 15 caracteres.');
    const ok=await mutate(supabase.from('copyright_reports').insert({reporter_id:uid,track_id:modal.track.id,reason}),'Denuncia enviada al equipo de moderación');if(ok)setModal(null);
  }
  async function sharePlaylist(p){
    if(!p.is_public)return notify('Solo puedes compartir un enlace público de una playlist pública.');
    const link=`${location.origin}/?playlist=${encodeURIComponent(p.id)}`;
    try{await navigator.clipboard.writeText(link);notify('Enlace copiado.')}catch{window.prompt('Copia el enlace:',link)}
  }
  async function logOut(){
    bookmarkNowRef.current?.(true);audioRef.current?.pause();void flushListeningProgress();playbackRef.current=null;
    ++playRequestRef.current;currentRef.current=null;setCurrent(null);setPlayerQueue({ids:[],baseIds:[],cursor:-1,shuffle:false,repeat:'off'});
    setBookmarks([]);setResumeEnabled(false);bookmarkEnabledRef.current=false;bookmarkUserRef.current=null;
    await supabase.auth.signOut();setPage('home');
  }
  const updateCards=(items)=> <div className="updates-grid">{items.map(u=>{
    const linked=publicTracks.find(t=>t.id===u.track_id);
    return <article className="update-card" key={u.id}><div className="update-card-head"><Avatar profile={profileFor(u.artist_id)}/><div><button className="item-link" onClick={()=>nav('artist',u.artist_id)}>{artistName(u.artist_id)}</button><small>{new Date(u.created_at).toLocaleDateString('es-ES')}</small></div><button className="icon-button update-report" title="Denunciar publicación" aria-label="Denunciar publicación" onClick={()=>setModal({type:'report-update',update:u})}><Flag size={15}/></button></div><p>{u.body}</p>{linked&&<button className="update-linked" onClick={()=>playTrack(linked)}><Cover compact title={linked.title} coverPath={coverForTrack(linked)}/><span><b>{linked.title}</b><small>Escuchar canción vinculada</small></span><Play size={17}/></button>}</article>;
  })}</div>;

  const mixTiles=(items)=> <div className="ovio-mixes">{items.map((mix,i)=><article className={'ovio-mix mix-variant-'+i} key={mix.id}>
    <span className="eyebrow"><Sparkles size={14}/> MIX PERSONAL</span>
    <h3>{mix.title}</h3><p>{mix.detail}</p>
    <div className="mix-preview">{mix.tracks.slice(0,3).map((t,j)=><button title={`Escuchar ${t.title}`} key={t.id} onClick={()=>playTrack(t,mix.tracks)}><Cover title={t.title} compact n={j} coverPath={coverForTrack(t)}/></button>)}</div>
    <small>{mix.tracks.length} canciones · Selección generada con tu actividad en OVIO</small>
    <div className="row wrap mix-actions"><button className="button primary" onClick={()=>playTrack(mix.tracks[0],mix.tracks)}><Play size={15}/> Escuchar</button>
    <button className="button secondary" onClick={()=>saveSuggestedMix(mix)}><ListPlus size={15}/> Guardar como playlist</button></div>
  </article>)}</div>;
  const trackCard=(t,i)=> <div className="music-card" key={t.id}><button className="art-button" onClick={()=>playTrack(t,recommended)} aria-label={`Reproducir ${t.title}`}><Cover title={t.title} genre={t.genre} n={i} coverPath={coverForTrack(t)}/><span className="art-play"><Play size={17} fill="white"/></span></button><button className="item-link" onClick={()=>nav('artist',t.artist_id)}>{t.title}</button><div className="item-sub">{artistName(t.artist_id)} · {t.genre}</div></div>;
  const trackRow=(t,i,playlistId=null,context=publicTracks)=> <div className="track-row" key={t.id}><span className="track-number">{i+1}</span><button className="track-main" onClick={()=>playTrack(t,context)}><Cover compact title={t.title} n={i} coverPath={coverForTrack(t)}/><span><b>{t.title}</b><small>{artistName(t.artist_id)} · {formatTime(t.duration_seconds)}</small></span></button><span className="table-genre">{t.genre}</span><button title={liked(t.id)?'Quitar favorito':'Favorito'} className={'icon-button '+(liked(t.id)?'on':'')} onClick={()=>toggleLike(t.id)}><Heart size={18} fill={liked(t.id)?'currentColor':'none'}/></button>{playlistId?<button title="Quitar de la playlist" className="icon-button" onClick={()=>removeSongFromPlaylist(playlistId,t.id)}><X size={18}/></button>:<button title="Añadir a playlist" className="icon-button" onClick={()=>setModal({type:'add',track:t})}><Plus size={18}/></button>}<button title="Añadir a la cola" aria-label={`Añadir ${t.title} a la cola`} className="icon-button queue-add" onClick={()=>addToQueue(t)}><ListPlus size={17}/></button><button title="Denunciar posible infracción de derechos" className="icon-button subtle" onClick={()=>setModal({type:'report',track:t})}><Flag size={15}/></button></div>;

  async function exitRecovery(message=''){
    const {error}=await supabase.auth.signOut();
    if(error)throw error;
    const url=new URL(window.location.href);
    url.searchParams.delete('recovery');
    url.searchParams.delete('code');
    window.history.replaceState(null,'',url.pathname+url.search);
    setAuthFeedback(message);
    setRecoveryMode(false);
  }
  if(!configured)return <Setup/>;
  if(boot)return <Loader/>;
  if(recoveryMode)return <PasswordReset session={session} onDone={()=>exitRecovery('Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.')} onCancel={()=>exitRecovery()}/>;
  if(!session)return <Auth key={authFeedback||'login'} notify={notify} initialMessage={authFeedback}/>;

  let body=null;
  if(page==='home'){
    const recentIds=[...database.listens].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(l=>l.track_id);
    const recent=[...new Set(recentIds)].map(id=>publicTracks.find(t=>t.id===id)).filter(Boolean).slice(0,5);
    body=<><div className="hero"><span className="eyebrow">BIENVENIDO A OVIO</span><h1>Descubre lo<br/><span className="grad-text">que viene.</span></h1><p>Una comunidad donde las próximas canciones que amarás todavía están por descubrir.</p><button className="button primary" onClick={()=>nav('explore')}>Explorar música <Compass size={17}/></button><div className="hero-glyph"><Logo small/></div></div>
      <SectionHeading title="Tus mixes OVIO" detail="Selecciones dinámicas según tus favoritos, escuchas y artistas seguidos; puedes guardarlas como playlists privadas."/>
      {personalizedMixes.length?mixTiles(personalizedMixes):<p className="empty-inline">Tus mixes aparecerán cuando haya canciones aprobadas en OVIO.</p>}
      <SectionHeading title="Hecho para ti" detail="Las recomendaciones se adaptan a tus favoritos y tus escuchas." button={<button className="small-link" onClick={()=>nav('explore')}>Ver más</button>}/>
      {recommended.length?<div className="music-grid">{recommended.slice(0,5).map(trackCard)}</div>:<Blank title="Tu descubrimiento empieza aquí" description="Cuando los primeros artistas estén aprobados, aparecerán sus canciones." button={<button className="button ghost" onClick={()=>nav('community')}>Explorar comunidad</button>}/>}
      {resumeEnabled&&resumable.length>0&&<><SectionHeading title="Seguir escuchando" detail="Retoma tus canciones donde las dejaste, también desde otro dispositivo"/><div className="resume-grid">{resumable.slice(0,5).map(({track,bookmark})=><button key={track.id} className="resume-card" onClick={()=>playTrack(track,publicTracks,{resumeAt:bookmark.position_seconds})}><Cover compact title={track.title} coverPath={coverForTrack(track)}/><span><b>{track.title}</b><small>{artistName(track.artist_id)} · desde {formatTime(bookmark.position_seconds)}</small></span><Play size={18}/></button>)}</div></>}
      {suggestedAlbums.length>0&&<><SectionHeading title="Álbumes para descubrir" detail="Álbumes y EPs con canciones revisadas, ordenados según tus gustos."/><div className="music-grid">{suggestedAlbums.slice(0,6).map((r,i)=><button className="music-card" key={r.id} onClick={()=>nav('album',r.id)}><Cover title={r.title} n={i+4} coverPath={r.cover_path}/><b>{r.title}</b><small>{artistName(r.artist_id)} · {r.kind.toUpperCase()}</small></button>)}</div></>}
      {recent.length>0&&<><SectionHeading title="Volver a escuchar"/><div className="music-grid">{recent.map(trackCard)}</div></>}
      {followedReleases.length>0&&<><SectionHeading title="Novedades de artistas que sigues" detail="Estrenos de los creadores de tu comunidad"/><div className="music-grid">{followedReleases.map(trackCard)}</div></>}
      {followedUpdates.length>0&&<><SectionHeading title="Lo que cuentan tus artistas" button={<button className="small-link" onClick={()=>nav('community')}>Ir a comunidad</button>}/>{updateCards(followedUpdates.slice(0,3))}</>}
      <div className="feature-strip"><div><span className="eyebrow">RADAR OVIO</span><h2>El talento no necesita millones de seguidores.</h2><p>Escucha artistas independientes que están comenzando.</p></div><button className="button primary" onClick={()=>nav('explore')}>Descubrir emergentes</button></div>
      {new Date()>=new Date(`${new Date().getFullYear()}-11-25T00:00:00Z`)&&<div className="recap-spotlight"><span className="eyebrow">ESPECIAL FIN DE AÑO</span><h2>Tu año en OVIO ya está aquí.</h2><p>Descubre cuántos minutos has escuchado y quiénes han sido tus artistas favoritos.</p><button className="button primary" onClick={()=>{setRecapYear(new Date().getFullYear());nav('recap')}}>Ver mi resumen <CalendarDays size={15}/></button></div>}
      <SectionHeading title="Top del mes en OVIO" detail={`Reproducciones válidas de ${chartScope==='ES'?'España':'OVIO'} · ${chartGenre}. Sin posiciones compradas.`} button={<button className="small-link" onClick={()=>nav('charts')}>Ver rankings</button>}/>
      <div className="ranking-home-grid">
        <button className="ranking-tile" onClick={()=>nav('charts')}><Trophy size={23}/><small>ARTISTA DEL MES</small><b>{charts.artists?.[0]?.artist_name||'Aún sin clasificación'}</b><span>{charts.artists?.[0]?`${charts.artists[0].plays} escuchas válidas`:'Necesitamos más oyentes'}</span></button>
        <button className="ranking-tile" onClick={()=>nav('charts')}><Music2 size={23}/><small>CANCIÓN DEL MES</small><b>{charts.tracks?.[0]?.title||'Aún sin clasificación'}</b><span>{charts.tracks?.[0]?.artist_name||'Descubrimientos en camino'}</span></button>
        <button className="ranking-tile" onClick={()=>{setChartScope('ES');setChartGenre('Todos');nav('charts')}}><Globe2 size={23}/><small>ÉXITOS ESPAÑA</small><b>Top canciones</b><span>Por escuchas de usuarios que eligieron España</span></button>
      </div>
      <div className="row wrap rank-shortcuts"><button className="button secondary" onClick={()=>{setChartGenre('Rap');nav('charts')}}>Top Rap <TrendingUp size={15}/></button><button className="button secondary" onClick={()=>{setChartGenre('Pop');nav('charts')}}>Top Pop <TrendingUp size={15}/></button><button className="button ghost" onClick={()=>nav('recap')}>Mi año en OVIO <CalendarDays size={15}/></button></div>
      <SectionHeading title="Lanzamientos recientes"/><div className="track-list">{publicTracks.slice(0,8).map((t,i)=>trackRow(t,i))}{publicTracks.length===0&&<p className="empty-inline">Aún no hay lanzamientos aprobados.</p>}</div>
    </>;
  }
  if(page==='charts'){
    const dates=Array.from({length:8},(_,i)=>{const d=new Date();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-i);return d.toISOString().slice(0,7)});
    const goTrack=(item)=>publicTracks.find(t=>t.id===item.track_id);
    body=<><header className="page-header"><span className="eyebrow">LA ESCENA OVIO</span><h1>Top OVIO <span className="grad-text">mensual</span></h1><p>Artistas, canciones y géneros destacados de cada mes, basados en reproducciones válidas.</p></header>
      <div className="charts-filters"><label>Zona<select value={chartScope} onChange={e=>setChartScope(e.target.value)}><option value="ALL">Todo OVIO</option><option value="ES">Éxitos España</option></select></label><label>Género<select value={chartGenre} onChange={e=>setChartGenre(e.target.value)}>{genres.map(g=><option key={g}>{g}</option>)}</select></label><label>Mes<select value={chartMonth} onChange={e=>setChartMonth(e.target.value)}>{dates.map(d=><option key={d} value={d}>{new Date(d+'T12:00:00Z').toLocaleDateString('es-ES',{month:'long',year:'numeric',timeZone:'UTC'})}</option>)}</select></label></div>
      <p className="insight-note">{chartsLoading?'Cargando rankings...':'Solo se muestran resultados con al menos tres oyentes diferentes. España se basa en el país declarado voluntariamente. Los datos comienzan desde la activación de esta versión y tienen controles antifraude básicos.'}</p>
      <div className="chart-columns"><section><SectionHeading title="Canciones más escuchadas"/><div className="chart-list">{(charts.tracks||[]).map((r,i)=><button className="chart-item" key={r.track_id} onClick={()=>{const t=goTrack(r);if(t)playTrack(t)}}><span className="chart-rank">{i+1}</span><div><b>{r.title}</b><small>{r.artist_name} · {r.genre}</small></div><span className="chart-value">{r.plays} <small>escuchas</small></span></button>)}{!charts.tracks?.length&&<p className="empty-inline">Aún no hay suficientes escuchas para este ranking.</p>}</div></section>
      <section><SectionHeading title="Artistas destacados"/><div className="chart-list">{(charts.artists||[]).map((r,i)=><button className="chart-item" key={r.artist_id} onClick={()=>nav('artist',r.artist_id)}><span className="chart-rank">{i+1}</span><div><b>{r.artist_name}</b><small>{r.listeners} oyentes diferentes</small></div><span className="chart-value">{r.plays}</span></button>)}{!charts.artists?.length&&<p className="empty-inline">Todavía no hay suficientes artistas clasificados.</p>}</div></section></div>
      <SectionHeading title="Géneros más escuchados"/><div className="genres-ranking">{(charts.genres||[]).map((r,i)=><button key={r.genre} className="genre-ranking-card" onClick={()=>setChartGenre(r.genre)}><b>{i+1}. {r.genre}</b><span>{r.plays} escuchas · {r.listeners} oyentes</span></button>)}{!charts.genres?.length&&<p className="empty-inline">Vuelve cuando exista más actividad musical.</p>}</div>
    </>;
  }
  if(page==='recap'){
    const fmtMinutes=n=>Number(n||0).toLocaleString('es-ES');
    body=<><header className="page-header"><span className="eyebrow">TU AÑO MUSICAL</span><h1>Mi año en <span className="grad-text">OVIO</span></h1><p>Un recuerdo personal construido con las canciones que realmente has escuchado en OVIO.</p></header>
      <div className="recap-hero"><span className="eyebrow">OVIO RECAP · {recapYear}</span><h2>{recap?.final?'Tu año en música.':'Tu música hasta ahora.'}</h2><p>El resumen definitivo se desbloquea el 25 de noviembre y recoge la actividad hasta el 24 de noviembre (UTC).</p><label>Consultar año <select value={recapYear} onChange={e=>setRecapYear(Number(e.target.value))}>{Array.from({length:Math.max(1,new Date().getFullYear()-2025)},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y}>{y}</option>)}</select></label></div>
      {!analyticsSettings.analytics_enabled?<div className="surface recap-empty"><LockKeyhole size={29}/><h2>Activa tu resumen personal</h2><p>Para contabilizar minutos y artistas necesitas activar voluntariamente el historial musical. No recuperamos los minutos anteriores a la activación.</p><button className="button primary" onClick={()=>nav('profile')}>Configurar privacidad</button></div>:
      !recap?<Blank title="Preparando tu resumen" description="Consultando el historial de tu cuenta..."/>:
      recap.error?<Blank title="No se pudo cargar" description={recap.error}/>:
      <><div className="recap-stats"><article><small>MINUTOS ESCUCHADOS</small><strong>{fmtMinutes(recap.minutes)}</strong><span>desde que activaste las estadísticas</span></article><article><small>CANCIONES DESCUBIERTAS</small><strong>{fmtMinutes(recap.tracks_discovered)}</strong><span>distintas</span></article><article><small>ARTISTAS ESCUCHADOS</small><strong>{fmtMinutes(recap.artists_discovered)}</strong><span>distintos</span></article></div>
        <div className="recap-favorites"><div><h3><Trophy size={18}/> Tu artista del año</h3><strong>{recap.top_artists?.[0]?.artist_name||'Aún sin datos'}</strong><small>{recap.top_artists?.[0]?Math.floor(recap.top_artists[0].seconds/60)+' minutos':'Escucha música para descubrirlo'}</small></div><div><h3><Music2 size={18}/> Tu canción del año</h3><strong>{recap.top_tracks?.[0]?.title||'Aún sin datos'}</strong><small>{recap.top_tracks?.[0]?.artist_name||'Sin canción favorita todavía'}</small></div><div><h3><Headphones size={18}/> Tu género del año</h3><strong>{recap.top_genres?.[0]?.genre||'Aún sin datos'}</strong><small>{recap.top_genres?.[0]?Math.floor(recap.top_genres[0].seconds/60)+' minutos':'Prueba nuevos géneros musicales'}</small></div></div>
        <div className="row wrap"><button className="button primary" onClick={async()=>{const summary=`Mi ${recap.final?'año':'avance del año'} ${recapYear} en OVIO 🎧\n${recap.minutes} minutos escuchados\nArtista favorito: ${recap.top_artists?.[0]?.artist_name||'—'}\nCanción favorita: ${recap.top_tracks?.[0]?.title||'—'}\nGénero favorito: ${recap.top_genres?.[0]?.genre||'—'}\n#OVIORecap`;try{await navigator.clipboard.writeText(summary);notify('Resumen copiado para compartir.')}catch{notify('No se pudo copiar en este navegador.')}}}><Share2 size={16}/> Copiar mi resumen</button><button className="button ghost" onClick={()=>nav('profile')}>Preferencias de privacidad</button></div>
        <p className="insight-note">{recap.final?'Corte final hasta el 24 de noviembre.':'Vista provisional: seguirá cambiando hasta el 24 de noviembre.'} El tiempo es una estimación basada en los segmentos reproducidos; no es un certificado de escucha.</p>
      </>}
    </>;
  }
  if(page==='search'||page==='explore'){
    const term=query.trim().toLowerCase();
    const filtered=publicTracks.filter(t=>(genre==='Todos'||t.genre===genre)&&(!term||[t.title,t.genre,artistName(t.artist_id),releaseFor(t.release_id)?.title].join(' ').toLowerCase().includes(term)));
    const albumResults=database.releases.filter(r=>publicTracks.some(t=>t.release_id===r.id)&&(!term||[r.title,artistName(r.artist_id)].join(' ').toLowerCase().includes(term)));
    body=<><header className="page-header"><span className="eyebrow">{page==='search'?'BUSCAR EN OVIO':'DESCUBRE TALENTO'}</span><h1>{page==='search'?'¿Qué quieres escuchar?':'Tu radar musical'}</h1><p>Explora canciones, álbumes, géneros y artistas independientes.</p></header>
      <div className="searchbar"><Search size={20}/><input autoFocus={page==='search'} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca canciones, artistas, álbumes..."/></div>
      <div className="chip-row">{genres.map(g=><button key={g} onClick={()=>setGenre(g)} className={'chip '+(genre===g?'chosen':'')}>{g}</button>)}</div>
      {page==='explore'&&personalizedMixes.length>0&&<><SectionHeading title="Playlists sugeridas para ti" detail="Escucha un mix o guárdalo en tu biblioteca"/>{mixTiles(personalizedMixes)}</>}
      <SectionHeading title={`${filtered.length} canciones encontradas`}/><div className="track-list">{filtered.map((t,i)=>trackRow(t,i))}{!filtered.length&&<Blank title="Todavía no hay resultados" description="Prueba otro género o vuelve cuando se hayan aprobado más canciones."/>}</div>
      <SectionHeading title="Álbumes y EPs"/><div className="music-grid">{albumResults.slice(0,10).map((r,i)=><button className="music-card" key={r.id} onClick={()=>nav('album',r.id)}><Cover title={r.title} coverPath={r.cover_path} n={i+1}/><b>{r.title}</b><small>{artistName(r.artist_id)} · {r.kind.toUpperCase()}</small></button>)}</div>
      <SectionHeading title="Artistas emergentes"/>
      <div className="artist-grid">{database.artists.filter(a=>a.status==='approved'&&(!term||a.artist_name.toLowerCase().includes(term))).slice(0,12).map(a=><button className="artist-card" key={a.user_id} onClick={()=>nav('artist',a.user_id)}><Avatar profile={profileFor(a.user_id)} size="large"/><b>{a.artist_name}</b><span>{a.genre} · Artista</span></button>)}</div>
    </>;
  }
  if(page==='library'){
    const mine=publicTracks.filter(t=>liked(t.id));
    body=<><header className="page-header"><span className="eyebrow">TU MÚSICA</span><h1>Tu biblioteca</h1><p>Todo lo que guardas, siempre contigo.</p></header>
      <SectionHeading title="Seguir escuchando" detail="La posición se guarda solo si activas la función en tu perfil" button={<button className="button ghost" onClick={()=>nav('profile')}>Configurar</button>}/>
      {!resumeEnabled?<p className="empty-inline">Activa «Seguir escuchando» en Perfil para guardar tu progreso entre dispositivos.</p>:resumable.length?<div className="resume-grid">{resumable.map(({track,bookmark})=><button className="resume-card" key={track.id} onClick={()=>playTrack(track,publicTracks,{resumeAt:bookmark.position_seconds})}><Cover title={track.title} compact coverPath={coverForTrack(track)}/><span><b>{track.title}</b><small>Continuar desde {formatTime(bookmark.position_seconds)}</small></span><Play size={16}/></button>)}</div>:<p className="empty-inline">Aquí aparecerán las canciones que dejaste a medias.</p>}
      <SectionHeading title="Tus playlists" button={<button className="button secondary" onClick={()=>setModal({type:'playlist'})}><Plus size={16}/> Nueva playlist</button>}/>
      <div className="playlist-grid">{myPlaylists.map((p,i)=><button className="playlist-card" key={p.id} onClick={()=>nav('playlist',p.id)}><Cover title={p.name} n={i+1}/><b>{p.name}</b><small>{p.is_public?'Pública':'Privada'} · {database.playlistTracks.filter(x=>x.playlist_id===p.id).length} canciones</small></button>)}</div>
      {!myPlaylists.length&&<Blank icon={ListMusic} title="Crea tu primera playlist" description="Reúne las canciones que te gustan y decide si quieres compartirlas." button={<button className="button primary" onClick={()=>setModal({type:'playlist'})}>Crear playlist</button>}/>}
      <SectionHeading title="Álbumes guardados" detail="Tus discos y EPs favoritos"/>
      <div className="music-grid">{savedAlbums.map((r,i)=><button className="music-card" key={r.id} onClick={()=>nav('album',r.id)}><Cover title={r.title} n={i+2} coverPath={r.cover_path}/><b>{r.title}</b><small>{artistName(r.artist_id)} · {r.kind.toUpperCase()}</small></button>)}</div>
      {!savedAlbums.length&&<p className="empty-inline">Todavía no has guardado álbumes. Entra en uno y pulsa «Guardar álbum».</p>}
      <SectionHeading title="Playlists guardadas" detail="Colecciones públicas de otras personas"/><div className="playlist-grid">{savedPlaylists.map((p,i)=><button className="playlist-card" key={p.id} onClick={()=>nav('playlist',p.id)}><Cover title={p.name} n={i+4}/><b>{p.name}</b><small>Por {profileFor(p.owner_id).display_name}</small></button>)}</div>
      {!savedPlaylists.length&&<p className="empty-inline">Guarda playlists públicas desde Comunidad y aparecerán aquí.</p>}
      <SectionHeading title="Tus favoritas" detail={`${mine.length} canciones guardadas`}/><div className="track-list">{mine.map((t,i)=>trackRow(t,i))}{!mine.length&&<p className="empty-inline">Dale al corazón de una canción y aparecerá aquí.</p>}</div>
    </>;
  }
  if(page==='community'){
    const pub=database.playlists.filter(p=>p.is_public);
    body=<><header className="page-header"><span className="eyebrow">UNA COMUNIDAD QUE ESCUCHA</span><h1>Comunidad OVIO</h1><p>Las mejores recomendaciones también vienen de otras personas.</p></header>
      <SectionHeading title="Novedades de los artistas" detail="Publicaciones aprobadas por moderación"/>
      {visibleUpdates.length?updateCards(visibleUpdates.slice(0,18)):<Blank icon={Newspaper} title="Pronto habrá novedades" description="Las publicaciones de artistas aparecerán aquí después de ser aprobadas."/>}
      <SectionHeading title="Playlists compartidas" detail="Creadas por oyentes reales"/><div className="playlist-grid">{pub.slice(0,20).map((p,i)=><button key={p.id} className="playlist-card" onClick={()=>nav('playlist',p.id)}><Cover title={p.name} n={i+3}/><b>{p.name}</b><small>Por {profileFor(p.owner_id).display_name}</small></button>)}</div>{!pub.length&&<Blank icon={Globe2} title="La comunidad está empezando" description="Publica una playlist y otros usuarios podrán descubrirla."/>}
      <SectionHeading title="Artistas que están creciendo"/>
      <div className="artist-grid">{database.artists.filter(a=>a.status==='approved').slice(0,16).map(a=><button key={a.user_id} className="artist-card" onClick={()=>nav('artist',a.user_id)}><Avatar profile={profileFor(a.user_id)} size="large"/><b>{a.artist_name}</b><span>{a.genre}</span></button>)}</div>
    </>;
  }
  if(page==='playlist'){
    const p=database.playlists.find(p=>p.id===selected);
    const tracks=p?database.playlistTracks.filter(x=>x.playlist_id===p.id).map(x=>publicTracks.find(t=>t.id===x.track_id)).filter(Boolean):[];
    body=p?<><button className="back" onClick={()=>nav('library')}><ArrowLeft size={17}/> Biblioteca</button><div className="detail-head"><Cover title={p.name} n={2}/><div><span className="eyebrow">PLAYLIST {p.is_public?'PÚBLICA':'PRIVADA'}</span><h1>{p.name}</h1><p>{p.description||'Una selección musical personal'}</p><button className="small text-inline-link" onClick={()=>nav( database.artists.some(a=>a.user_id===p.owner_id&&a.status==='approved')?'artist':'listener',p.owner_id)}>Por {profileFor(p.owner_id).display_name}</button><div className="small">{tracks.length} canciones</div><div className="row wrap detail-buttons">{p.owner_id===uid&&<><button className="button secondary" onClick={()=>setModal({type:'playlist',playlist:p})}><Settings size={16}/> Editar</button><button className="button secondary" onClick={()=>setModal({type:'add',playlist:p})}><Plus size={16}/> Añadir canciones</button><button className="button ghost" onClick={()=>deletePlaylist(p)}><Trash2 size={16}/> Eliminar</button></>}{p.is_public&&<button className="button ghost" onClick={()=>sharePlaylist(p)}><Link2 size={16}/> Compartir</button>}{p.is_public&&p.owner_id!==uid&&<button className="button secondary" onClick={()=>togglePlaylistSave(p)}><Bookmark size={16} fill={savedPlaylist(p.id)?'currentColor':'none'}/> {savedPlaylist(p.id)?'Guardada':'Guardar lista'}</button>}</div></div></div>
      <SectionHeading title="Canciones" button={<button className="button secondary" disabled={!tracks.length} onClick={()=>tracks.length&&playTrack(tracks[0],tracks)}><Play size={15}/> Reproducir lista</button>}/><div className="track-list">{tracks.map((t,i)=>trackRow(t,i,p.owner_id===uid?p.id:null,tracks))}</div>
      {!tracks.length&&<Blank title="Esta playlist está vacía" description="Añade tus canciones favoritas desde tu biblioteca."/>}
    </>:<Blank title="No se encontró la playlist" description="Puede que sea privada o que ya no exista."/>;
  }
  if(page==='artist'){
    const app=database.artists.find(a=>a.user_id===selected&&a.status==='approved');const artistTracks=publicTracks.filter(t=>t.artist_id===selected);
    body=app?<><button className="back" onClick={()=>nav('explore')}><ArrowLeft size={17}/> Descubrir</button><div className="artist-hero artist-hero-banner" style={profileFor(selected).banner_path?{backgroundImage:`linear-gradient(90deg,#10111be8,#10111b6c),url("${assetUrl('artist-banners',profileFor(selected).banner_path)}")`}:{}}><Avatar profile={profileFor(selected)} size="xl"/><div><span className="eyebrow">ARTISTA EN OVIO</span><h1>{app.artist_name}</h1><span className="user-handle">@{profileFor(selected).username||'sin-identificador'}</span><p>{app.bio||'Creando nuevos sonidos'}</p><span className="small">{app.genre} · {artistTracks.length} canciones · {followerCount(selected)} seguidores</span><div className="row wrap" style={{marginTop:16}}>{uid!==selected&&<button className="button primary" onClick={()=>toggleFollow(selected)}>{following(selected)?<Check size={16}/>:<Plus size={16}/>} {following(selected)?'Siguiendo':'Seguir artista'}</button>}<button className="button secondary" onClick={()=>shareArtist(selected)}><Share2 size={16}/> Compartir perfil</button>{uid===selected&&<button className="button secondary" onClick={()=>nav('studio')}>Editar en Studio</button>}</div></div></div>
      <SectionHeading title="Canciones"/><div className="track-list">{artistTracks.map((t,i)=>trackRow(t,i))}</div><SectionHeading title="Álbumes y EPs"/>
      <div className="music-grid">{database.releases.filter(r=>r.artist_id===selected&&artistTracks.some(t=>t.release_id===r.id)).map((r,i)=><button className="music-card" key={r.id} onClick={()=>nav('album',r.id)}><Cover title={r.title} n={i} coverPath={r.cover_path}/><b>{r.title}</b><small>{r.kind.toUpperCase()}</small></button>)}</div>
      <SectionHeading title="Novedades del artista"/><div>{visibleUpdates.some(u=>u.artist_id===selected)?updateCards(visibleUpdates.filter(u=>u.artist_id===selected)): <p className="empty-inline">Este artista todavía no ha compartido novedades.</p>}</div>
    </>:<Blank title="Artista no disponible" description="Este perfil no está aprobado o no existe."/>;
  }
  if(page==='listener'){
    const listener=database.profiles.find(p=>p.id===selected);
    const lists=database.playlists.filter(p=>p.owner_id===selected&&p.is_public);
    body=listener?<><button className="back" onClick={()=>nav('community')}><ArrowLeft size={17}/> Comunidad</button><div className="listener-head"><Avatar profile={listener} size="xl"/><div><span className="eyebrow">PERFIL DE OYENTE</span><h1>{listener.display_name}</h1><span className="user-handle">@{listener.username||'sin-identificador'}</span><p>{listener.bio||'Comparte y descubre música en OVIO.'}</p><div className="row wrap"><span className="small">{lists.length} playlists públicas</span>{selected===uid?<button className="button secondary" onClick={()=>nav('profile')}>Editar perfil</button>:<button className="button secondary" onClick={()=>shareUser(selected)}><Share2 size={16}/> Compartir perfil</button>}</div></div></div><SectionHeading title="Sus playlists públicas"/><div className="playlist-grid">{lists.map((p,i)=><button className="playlist-card" key={p.id} onClick={()=>nav('playlist',p.id)}><Cover title={p.name} n={i}/><b>{p.name}</b><small>{p.description||'Playlist pública'}</small></button>)}</div>{!lists.length&&<p className="empty-inline">Todavía no ha compartido playlists.</p>}</>:<Blank title="Perfil no disponible" description="Esta cuenta ya no existe."/>;
  }
  if(page==='album'){
    const r=database.releases.find(r=>r.id===selected);const tracks=r?publicTracks.filter(t=>t.release_id===r.id).sort((a,b)=>(a.track_number||1)-(b.track_number||1)||new Date(a.created_at)-new Date(b.created_at)):[];
    body=r?<><button className="back" onClick={()=>nav('artist',r.artist_id)}><ArrowLeft size={17}/> Volver al artista</button><div className="detail-head"><Cover title={r.title} n={4} coverPath={r.cover_path}/><div><span className="eyebrow">{r.kind.toUpperCase()}</span><h1>{r.title}</h1><p>{r.description||'Música independiente'}</p><span className="small">{artistName(r.artist_id)} · {tracks.length} canciones aprobadas</span><div className="row wrap detail-buttons">{tracks.length>0&&<><button className="button primary" onClick={()=>playTrack(tracks[0],tracks)}><Play size={16}/> Escuchar álbum</button><button className="button secondary" onClick={()=>toggleSavedRelease(r)}><Bookmark size={16} fill={savedRelease(r.id)?'currentColor':'none'}/>{savedRelease(r.id)?'Guardado':'Guardar álbum'}</button></>}</div></div></div><SectionHeading title="Lista de canciones"/><div className="track-list">{tracks.map((t,i)=>trackRow(t,i))}</div></>:<Blank title="No se encontró este álbum" description="Comprueba que esté disponible."/>;
  }
  if(page==='notifications'){
    body=<><header className="page-header"><span className="eyebrow">TU ACTIVIDAD</span><h1>Notificaciones</h1><p>Decisiones de moderación sobre tu cuenta, canciones y novedades.</p></header>
      <div className="row wrap notification-tools"><span className="small">{unreadCount} sin leer · mostrando las 100 más recientes</span><button className="button secondary" onClick={()=>markNotificationRead()} disabled={!unreadCount}><Check size={16}/> Marcar todas como leídas</button><button className="button ghost" onClick={()=>loadAll(uid)}><RefreshCcw size={16}/> Actualizar</button></div>
      <div className="notification-list">{database.notifications.map(n=><div key={n.id} className={'notification-item '+(!n.read_at?'unread':'')}><div className={'notification-icon '+(n.event_type.endsWith('approved')?'good':'bad')}>{n.event_type.endsWith('approved')?<Check size={20}/>:<AlertCircle size={20}/>}</div><div className="notification-body"><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.created_at).toLocaleString('es-ES')} · {n.read_at?'Leída':'Sin leer'}</small></div><div className="notification-actions">{!n.read_at&&<button className="button tiny ghost" onClick={()=>markNotificationRead(n.id)}>Marcar leída</button>}<button className="button tiny secondary" onClick={()=>{if(!n.read_at)markNotificationRead(n.id);nav('studio')}}>Ver en Studio</button></div></div>)}{!database.notifications.length&&<Blank icon={Bell} title="Todavía no tienes avisos" description="Aquí aparecerán las decisiones sobre tus solicitudes de artista y tus canciones."/>}</div>
    </>;
  }
  if(page==='profile'){
    body=<><header className="page-header"><span className="eyebrow">TU CUENTA</span><h1>Tu perfil</h1><p>Elige cómo apareces ante la comunidad.</p></header>
      <div className="settings-layout"><section className="surface profile-settings"><div className="row"><Avatar profile={myProfile} size="xl"/><div><b className="profile-name">{myProfile.display_name}</b><p className="small">@{myProfile.username || 'sin-usuario'} · {session.user.email}</p><label className="button secondary upload-avatar"><UploadCloud size={17}/> Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>changeAvatar(e.target.files?.[0])}/></label></div></div>
        <form className="stack profile-form" onSubmit={e=>{e.preventDefault();updateProfile(new FormData(e.currentTarget))}}><AvailabilityField kind="username" name="username" value={profileUsername??(myProfile.username?.startsWith('u_')&&myProfile.username.length===34?'':myProfile.username??'')} onChange={setProfileUsername} excludeOwn={!(myProfile.username?.startsWith('u_')&&myProfile.username.length===34)&&normalizeUsername(profileUsername??myProfile.username)===myProfile.username} allowEmpty={Boolean(myProfile.username?.startsWith('u_')&&myProfile.username.length===34)}/><label>Nombre público<input name="display_name" defaultValue={myProfile.display_name} required maxLength={60}/></label><label>Ciudad<input name="city" defaultValue={myProfile.city} maxLength={80} placeholder="Por ejemplo, Madrid"/></label><label>Biografía<textarea name="bio" defaultValue={myProfile.bio} maxLength={500} placeholder="Cuéntanos algo sobre ti"/></label><button className="button primary">Guardar cambios</button></form>
      <div className="listening-settings"><h3>Seguridad de la cuenta</h3><p className="small">¿Necesitas cambiar la contraseña? Te enviaremos un enlace a tu correo verificado. No la modificaremos sin ese enlace.</p><button className="button secondary" type="button" onClick={async()=>{const {error}=await supabase.auth.resetPasswordForEmail(session.user.email,{redirectTo:recoveryRedirectUrl(window.location.origin,window.location.pathname)});notify(error?'No se pudo enviar el enlace. Inténtalo más tarde.':'Si el envío está disponible, recibirás instrucciones en tu correo.');}}><LockKeyhole size={16}/> Enviar enlace para cambiar contraseña</button></div>
      <div className="listening-settings"><h3>Privacidad y estadísticas</h3><p className="small">Participa voluntariamente en rankings y genera tu resumen anual. Si lo desactivas, borraremos tu historial nuevo. El país nunca aparece en tu perfil.</p><form className="stack" onSubmit={e=>{e.preventDefault();saveListeningSettings(new FormData(e.currentTarget))}}><label>País para rankings<select name="country_code" value={draftAnalyticsSettings.country_code} onChange={e=>setDraftAnalyticsSettings(s=>({...s,country_code:e.target.value}))}><option value="ZZ">No indicar país</option><option value="ES">España</option><option value="OT">Otro país</option></select></label><label className="check-label"><input type="checkbox" name="analytics_enabled" value="yes" checked={draftAnalyticsSettings.analytics_enabled} onChange={e=>setDraftAnalyticsSettings(s=>({...s,analytics_enabled:e.target.checked}))}/>Permitir el registro de tiempo escuchado para rankings y mi resumen anual.</label><button className="button secondary" type="submit">Guardar preferencias musicales</button></form></div>
      <div className="listening-settings"><h3>Seguir escuchando</h3><p className="small">Si lo activas, guardaremos la posición de tus canciones a medias en tu cuenta de Supabase para continuar en otros dispositivos. Esto es independiente de las estadísticas de rankings y resumen anual. Puedes desactivarlo y borrar las posiciones cuando quieras.</p><label className="check-label"><input type="checkbox" checked={resumeEnabled} disabled={bookmarkLoading} onChange={e=>changeBookmarkPreference(e.target.checked)}/>Guardar y sincronizar mis puntos de reproducción</label>{resumeEnabled&&<button className="button ghost" onClick={async()=>{if(!window.confirm('¿Eliminar todos los puntos guardados?'))return;const {error}=await supabase.from('playback_bookmarks').delete().eq('user_id',uid);if(error)notify(safeError(error));else{setBookmarks([]);notify('Puntos de reproducción borrados.');}}}>Borrar todos mis puntos guardados</button>}</div>
      </section><section className="surface profile-action"><button className="button secondary" onClick={()=>nav(approvedArtist?'artist':'listener',uid)}><Eye size={16}/> Ver perfil público</button><Sparkles size={27} color="#a88bff"/><h2>¿Creas música?</h2><p>Solicita convertir tu cuenta en perfil de artista. Nuestro equipo verificará la solicitud antes de permitir subidas.</p><button className="button secondary" onClick={()=>nav('studio')}>Ir a mi estudio <Disc3 size={16}/></button><hr/><button className="text-button" onClick={logOut}><LogOut size={16}/> Cerrar sesión</button></section></div>
    </>;
  }
  if(page==='insights'){
    body=approvedArtist?<ArtistInsights artistName={myApplication.artist_name} onBack={()=>nav('studio')}/>:<Blank icon={ShieldCheck} title="Estadísticas de artistas" description="Esta sección está disponible para artistas aprobados." button={<button className="button secondary" onClick={()=>nav('studio')}>Volver a Studio</button>}/>;
  }
  if(page==='studio'){
    const mine=database.tracks.filter(t=>t.artist_id===uid);const albums=database.releases.filter(r=>r.artist_id===uid);
    const visibleCatalog=mine.filter(t=>(catalogStatus==='all'||t.status===catalogStatus)&&[t.title,t.genre,releaseFor(t.release_id)?.title||'Single'].join(' ').toLowerCase().includes(catalogQuery.trim().toLowerCase())).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    body=<><header className="page-header"><span className="eyebrow">CENTRO DE CREADORES</span><h1>OVIO Studio</h1><p>Publica tu música original y gestiona su revisión.</p></header>
      {!myApplication?<section className="surface studio-welcome"><ShieldCheck color="#a58afd" size={38}/><h2>Hazte artista en OVIO</h2><p>Regístrate como creador gratuitamente. Un administrador tendrá que aceptar tu solicitud antes de que puedas subir canciones.</p><button className="button primary" onClick={()=>{setNewArtistName('');setModal({type:'apply'});}}>Solicitar perfil de artista</button></section>:
      myApplication.status!=='approved'?<section className="surface studio-welcome"><Clock3 color="#a58afd" size={38}/><h2>{myApplication.status==='pending'?'Tu solicitud está pendiente de revisión':'Solicitud de artista rechazada'}</h2><p>{myApplication.status==='pending'?'Pronto el equipo podrá revisar tu perfil. Mientras tanto puedes seguir escuchando OVIO.':'Contacta con soporte si necesitas aclarar la decisión. No puedes enviar otra solicitud desde esta beta.'}</p>{myApplication.status==='rejected'&&myApplication.review_note&&<p className="review-feedback"><b>Motivo comunicado:</b> {myApplication.review_note}</p>}</section>:
      <><div className="row wrap action-buttons"><button className="button secondary" onClick={()=>nav('insights')}><TrendingUp size={17}/> Ver mis estadísticas completas</button></div><div className="stat-row"><div className="stat"><b>{mine.filter(t=>t.status!=='rejected').length}/5</b><span>Canciones activas</span></div><div className="stat"><b>{mine.filter(t=>t.status==='approved').length}</b><span>Aprobadas</span></div><div className="stat"><b>{mine.filter(t=>t.status==='pending').length}</b><span>En revisión</span></div><div className="stat"><b>{database.stats.reduce((n,x)=>n+Number(x.listens||0),0)}</b><span>Escuchas antiguas*</span></div></div>
        <div className="row wrap action-buttons"><button className="button primary" onClick={()=>{setSongRelease('');setModal({type:'song'});}}><UploadCloud size={17}/> Subir canción</button><button className="button secondary" onClick={()=>setModal({type:'release'})}><Plus size={17}/> Crear álbum / EP</button></div>
        <section className="surface artist-appearance"><div><span className="eyebrow">TU IDENTIDAD MUSICAL</span><h2>Personaliza tu perfil público</h2><p>Tu cabecera aparecerá detrás del nombre y la foto. Formatos JPG/PNG/WebP, hasta 5 MB.</p><div className="row wrap"><label className="button secondary upload-avatar"><ImagePlus size={17}/> {uploading?'Subiendo imagen...':'Cambiar cabecera'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} hidden onChange={e=>{const f=e.target.files?.[0];changeArtistBanner(f);e.target.value='';}}/></label><button className="button ghost" onClick={()=>nav('artist',uid)}><Eye size={16}/> Ver mi perfil público</button></div></div><div className="studio-banner-preview" style={myProfile.banner_path?{backgroundImage:`linear-gradient(90deg,#10121d80,#10121d33),url("${assetUrl('artist-banners',myProfile.banner_path)}")`}:{}}><Avatar profile={myProfile} size="regular"/><span>{myApplication.artist_name}</span></div></section>
        <SectionHeading title="Novedades para tus seguidores" detail="Comparte un lanzamiento o un mensaje; necesita aprobación manual" button={<button className="button secondary" onClick={()=>setModal({type:'artist-update'})}><Send size={16}/> Publicar novedad</button>}/>
        <div className="updates-list">{database.artistUpdates.filter(u=>u.artist_id===uid).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(u=><div key={u.id} className="surface studio-update"><span className={'status '+u.status}>{u.status==='approved'?'Publicada':u.status==='rejected'?'Rechazada':'Pendiente'}</span><p>{u.body}</p>{u.review_note&&<small>Nota de revisión: {u.review_note}</small>}</div>)}{!database.artistUpdates.some(u=>u.artist_id===uid)&&<p className="empty-inline">Todavía no has enviado novedades.</p>}</div>
        <SectionHeading title="Tus álbumes y EPs"/><div className="music-grid">{albums.map((r,i)=><div className="music-card" key={r.id}><Cover title={r.title} n={i} coverPath={r.cover_path}/><b>{r.title}</b><small>{r.kind.toUpperCase()} · {mine.filter(t=>t.release_id===r.id).length} pistas</small>{!mine.some(t=>t.release_id===r.id&&t.status==='approved')&&<button className="button tiny secondary release-edit" onClick={()=>setModal({type:'release',release:r})}><Settings size={14}/> Editar álbum</button>}</div>)}{!albums.length&&<p className="empty-inline">Aún no tienes álbumes.</p>}</div>
        <SectionHeading title="Tus canciones y su revisión" detail="Busca, filtra y modifica los metadatos de canciones aún pendientes"/>
        <div className="catalog-toolbar"><label className="catalog-search"><Search size={17}/><input type="search" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder="Buscar en mi catálogo" aria-label="Buscar en mi catálogo"/></label>
        <select aria-label="Filtrar por estado" value={catalogStatus} onChange={e=>setCatalogStatus(e.target.value)}><option value="all">Todos los estados</option><option value="pending">Pendientes</option><option value="approved">Aprobadas</option><option value="rejected">Rechazadas</option></select></div>
        <div className="studio-table">{visibleCatalog.map(t=><div key={t.id} className="studio-line"><div className="studio-song-info"><Cover title={t.title} compact coverPath={coverForTrack(t)}/><span><b>{t.title}</b><small>{t.genre} · {releaseFor(t.release_id)?.title||'Single'} · {formatTime(t.duration_seconds)}</small><small>Enviada: {new Date(t.created_at).toLocaleDateString('es-ES')}</small></span></div><div className="catalog-actions"><span className={'status '+t.status}>{t.status==='approved'?'Aprobada':t.status==='rejected'?'Rechazada':'Pendiente'}</span>{t.status==='pending'&&<button className="button tiny secondary" onClick={()=>setModal({type:'edit-track',track:t})}><Settings size={14}/> Editar datos</button>}</div>{t.review_note&&<p className="small catalog-note">Motivo de revisión: {t.review_note}</p>}</div>)}{!visibleCatalog.length&&<p className="empty-inline">{mine.length?'No hay canciones con esos filtros.':'Tus canciones aparecerán aquí al subirlas.'}</p>}</div>
        <p className="small">*Escuchas simplificadas: hasta una por usuario/canción/día, después de 30 segundos. Usa «Mis estadísticas» para ver sesiones válidas y minutos registrados desde v0.6. Ninguna métrica sirve aún para calcular pagos.</p>
      </>}
    </>;
  }
  if(page==='admin'){
    const pendingApps=database.artists.filter(a=>a.status==='pending');const pendingTracks=database.tracks.filter(t=>t.status==='pending');const pendingUpdates=database.artistUpdates.filter(u=>u.status==='pending');
    const reportedUpdates=database.updateReports.filter(r=>r.status==='open');
    body=isAdmin?<><header className="page-header"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Moderación OVIO</h1><p>Revisión manual de artistas, archivos y reclamaciones.</p></header>
      <div className="stat-row"><div className="stat"><b>{pendingApps.length}</b><span>Artistas pendientes</span></div><div className="stat"><b>{pendingTracks.length}</b><span>Canciones pendientes</span></div><div className="stat"><b>{database.reports.filter(r=>r.status==='open').length}</b><span>Denuncias abiertas</span></div></div>
      <SectionHeading title="Solicitudes de artista"/>
      <div className="admin-list">{pendingApps.map(a=><div className="admin-item" key={a.user_id}><div><b>{a.artist_name}</b><p>{a.genre} · {a.bio||'Sin biografía'}</p><small>{a.user_id}</small></div><div className="row"><button className="button tiny primary" onClick={()=>setModal({type:'moderate',table:'artist_applications',object:a,status:'approved'})}>Aprobar</button><button className="button tiny danger" onClick={()=>setModal({type:'moderate',table:'artist_applications',object:a,status:'rejected'})}>Rechazar</button></div></div>)}{!pendingApps.length&&<p className="empty-inline">No hay solicitudes pendientes.</p>}</div>
      <SectionHeading title="Canciones pendientes"/>
      <div className="admin-list">{pendingTracks.map(t=><div className="admin-item" key={t.id}><div><div className="moderation-track-head"><Cover compact title={t.title} coverPath={coverForTrack(t)}/><div><b>{t.title} — {artistName(t.artist_id)}</b><p>{t.genre} · {formatTime(t.duration_seconds)} · {t.release_id?`Álbum (pista ${t.track_number||1})`:'Single'} · Declaración de autoría: {t.rights_original?'Sí':'No'}</p></div></div><small>La declaración no garantiza autenticidad. Revisar antes de aprobar.</small><div className="row" style={{marginTop:10}}><button className="button tiny secondary" onClick={async()=>{const{data,error}=await supabase.storage.from('song-audio').createSignedUrl(t.audio_path,300);if(error)notify(safeError(error));else window.open(data.signedUrl,'_blank','noopener,noreferrer')}}><Headphones size={15}/> Escuchar archivo</button>{t.evidence_path&&<button className="button tiny secondary" onClick={async()=>{const{data,error}=await supabase.storage.from('song-evidence').createSignedUrl(t.evidence_path,300);if(error)notify(safeError(error));else window.open(data.signedUrl,'_blank','noopener,noreferrer')}}><Eye size={15}/> Ver prueba</button>}</div></div><div className="row"><button className="button tiny primary" onClick={()=>setModal({type:'moderate',table:'tracks',object:t,status:'approved'})}>Aprobar</button><button className="button tiny danger" onClick={()=>setModal({type:'moderate',table:'tracks',object:t,status:'rejected'})}>Rechazar</button></div></div>)}{!pendingTracks.length&&<p className="empty-inline">No hay canciones pendientes.</p>}</div>
      <SectionHeading title="Novedades pendientes" detail="Los textos de artistas también requieren aprobación"/>
      <div className="admin-list">{pendingUpdates.map(u=><div key={u.id} className="admin-item"><div><b>{artistName(u.artist_id)}</b><p>{u.body}</p><small>{new Date(u.created_at).toLocaleString('es-ES')}</small></div><div className="row"><button className="button tiny primary" onClick={()=>setModal({type:'moderate-update',update:u,status:'approved'})}>Aprobar</button><button className="button tiny danger" onClick={()=>setModal({type:'moderate-update',update:u,status:'rejected'})}>Rechazar</button></div></div>)}{!pendingUpdates.length&&<p className="empty-inline">No hay novedades pendientes.</p>}</div>
      <SectionHeading title="Denuncias de publicaciones" detail="Investiga las denuncias antes de resolverlas"/>
      <div className="admin-list">{reportedUpdates.map(r=>{const u=database.artistUpdates.find(u=>u.id===r.update_id);return <div className="admin-item" key={r.id}><div><b>Publicación de {u?artistName(u.artist_id):'artista desconocido'}</b><p>{r.reason}</p>{u&&<small>Texto: {u.body}</small>}</div><div className="row wrap">{u?.status==='approved'&&<button className="button tiny danger" onClick={()=>setModal({type:'moderate-update',update:u,status:'rejected'})}>Retirar publicación</button>}<button className="button tiny secondary" onClick={()=>resolveUpdateReport(r.id)}>Marcar resuelta</button></div></div>})}{!reportedUpdates.length&&<p className="empty-inline">No hay denuncias de publicaciones abiertas.</p>}</div>
      <SectionHeading title="Reclamaciones sobre derechos"/>
      <div className="admin-list">{database.reports.filter(r=>r.status==='open').map(r=><div className="admin-item" key={r.id}><div><b>Denuncia de {database.tracks.find(t=>t.id===r.track_id)?.title||'Canción retirada'}</b><p>{r.reason}</p><small>{new Date(r.created_at).toLocaleString('es-ES')}</small></div><div className="row"><button className="button tiny danger" onClick={()=>{const track=database.tracks.find(t=>t.id===r.track_id);if(track){if(!window.confirm('¿Retirar temporalmente el acceso a esta canción mientras se revisa la denuncia?'))return;review('tracks',r.track_id,'rejected','Retirada preventiva tras denuncia de derechos; pendiente de revisión.')}else notify('La canción ya no figura en la biblioteca.');}}>Retirar canción</button><button className="button tiny secondary" onClick={()=>review('copyright_reports',r.id,'resolved')}>Marcar resuelta</button></div></div>)}{!database.reports.some(r=>r.status==='open')&&<p className="empty-inline">No hay reclamaciones abiertas.</p>}</div><p className="small">No se envían avisos automáticos por correo. En producción necesitaremos gestión de plazos, motivos, reclamaciones y trazabilidad.</p>
    </>:<Blank icon={LockKeyhole} title="No tienes permiso de administrador" description="Este panel requiere autorización en la base de datos."/>;
  }
  return <div className="app-shell">
    <aside className={'sidebar '+(mobileMenu?'open':'')}><div className="sidebar-top"><Logo/><button className="icon-button mobile-close" onClick={()=>setMobileMenu(false)}><X/></button></div><div className="sidebar-label">EXPLORAR</div><nav aria-label="Menú principal">{navs.map(([id,label,Icon])=><button key={id} className={'side-link '+(page===id?'active':'')} onClick={()=>nav(id)}><Icon size={19}/>{label}</button>)}</nav><div className="sidebar-label">CREADORES</div><nav><button className={'side-link '+(page==='studio'?'active':'')} onClick={()=>nav('studio')}><AudioLines size={19}/> OVIO Studio</button>{approvedArtist&&<button className={'side-link '+(page==='insights'?'active':'')} onClick={()=>nav('insights')}><TrendingUp size={19}/> Mis estadísticas</button>}<button className={'side-link '+(page==='notifications'?'active':'')} onClick={()=>nav('notifications')}><Bell size={19}/> Notificaciones {unreadCount>0&&<span className="side-counter">{unreadCount>99?'99+':unreadCount}</span>}</button>{isAdmin&&<button className={'side-link '+(page==='admin'?'active':'')} onClick={()=>nav('admin')}><ShieldCheck size={19}/> Moderación</button>}</nav><div className="sidebar-bottom"><div className="sidebar-promo"><Disc3 color="#a993ff"/><b>Tu próxima canción favorita está aquí.</b><p>Descubre nuevos talentos.</p><button className="button tiny secondary" onClick={()=>nav('explore')}>Descubrir</button></div><span className="sidebar-legal">Beta gratuita · Música revisada</span></div></aside>
    <div className="main-column"><header className="topbar"><div className="row"><button className="icon-button mobile-menu" onClick={()=>setMobileMenu(v=>!v)} aria-label="Abrir menú"><Menu/></button><span className="top-greeting">La música se descubre juntos.</span></div><div className="row"><span className="beta-label">OVIO BETA · 0.8</span><button className="notification-bell" aria-label={`Notificaciones: ${unreadCount} sin leer`} title="Notificaciones" onClick={()=>nav('notifications')}>{unreadCount?<BellRing size={19}/>:<Bell size={19}/>} {unreadCount>0&&<span className="bell-count">{unreadCount>99?'99+':unreadCount}</span>}</button><button className="account-button" onClick={()=>nav('profile')}><Avatar profile={myProfile}/><span>{myProfile.display_name}</span><Settings size={16}/></button></div></header>
      <main className="main-content">{loading&&<div className="sync-note"><RefreshCcw size={14}/> Actualizando contenido...</div>}{body}</main>
    </div>
    <div className={'player '+(!current?'no-song':'')}><div className="now-playing">{current?<><button className="player-cover-button" aria-label="Abrir reproductor completo" onClick={()=>setModal({type:'player'})}><Cover compact title={current.title} n={1} coverPath={coverForTrack(current)}/></button><div><b>{current.title}</b><button onClick={()=>nav('artist',current.artist_id)}>{artistName(current.artist_id)}</button></div><button aria-label="Favorito" className={'icon-button '+(liked(current.id)?'on':'')} onClick={()=>toggleLike(current.id)}><Heart size={17} fill={liked(current.id)?'currentColor':'none'}/></button></>:<><span className="player-placeholder"><Music2 size={18}/></span><div><b>Nada reproduciéndose</b><small>Elige una canción</small></div></>}</div>
      <div className="player-center"><div className="transport"><button title="Aleatorio" aria-label={queueState.shuffle?'Desactivar aleatorio':'Activar aleatorio'} aria-pressed={queueState.shuffle} className={'mode-control '+(queueState.shuffle?'active':'')} onClick={()=>setPlayerQueue(toggleShuffle(queueRef.current))}><Shuffle size={17}/></button><button aria-label="Anterior" onClick={()=>nextTrack(true)} disabled={!current}><SkipBack size={19}/></button><button className="play-round" aria-label={playing?'Pausar':'Reproducir'} onClick={()=>{const a=audioRef.current;if(!current)return;if(a.paused)a.play().catch(()=>notify('No se pudo reproducir.'));else a.pause()}} disabled={!current}>{playing?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}</button><button aria-label="Siguiente" onClick={()=>nextTrack()} disabled={!current}><SkipForward size={19}/></button><button title="Repetir" aria-label={`Modo repetir: ${queueState.repeat}`} className={'mode-control '+(queueState.repeat!=='off'?'active':'')} onClick={()=>setPlayerQueue(cycleRepeat(queueRef.current))}>{queueState.repeat==='one'?<Repeat1 size={17}/>:<Repeat size={17}/>}</button></div><div className="progress"><small>{formatTime(elapsed)}</small><input aria-label="Posición de reproducción" type="range" min="0" max={duration||1} step="1" value={Math.min(elapsed,duration||1)} disabled={!current} onChange={e=>{audioRef.current.currentTime=Number(e.target.value);setElapsed(Number(e.target.value))}}/><small>{formatTime(duration)}</small></div></div>
      <div className="player-right"><button className="queue-open" title="Ver cola" aria-label="Ver cola de reproducción" onClick={()=>setModal({type:'queue'})}><ListOrdered size={19}/><span>Cola</span>{queueState.ids.length>0&&<small>{Math.max(0,queueState.ids.length-queueState.cursor-1)}</small>}</button><Volume2 size={17}/><input aria-label="Volumen" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></div></div>
    <nav className="bottom-nav" aria-label="Menú móvil"><button className={page==='home'?'active':''} onClick={()=>nav('home')}><Home/>Inicio</button><button className={page==='search'?'active':''} onClick={()=>nav('search')}><Search/>Buscar</button><button className={page==='explore'?'active':''} onClick={()=>nav('explore')}><Compass/>Descubrir</button><button className={page==='library'?'active':''} onClick={()=>nav('library')}><Library/>Biblioteca</button><button className={page==='profile'?'active':''} onClick={()=>nav('profile')}><UserRound/>Perfil</button></nav>
    {modal&&<div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!uploading)setModal(null)}}><div className="modal"><button className="icon-button modal-close" onClick={()=>{if(!uploading)setModal(null)}} aria-label="Cerrar"><X/></button>
      {modal.type==='player'&&<><span className="eyebrow">SONANDO EN OVIO</span><h2>Reproductor</h2>{current?<div className="expanded-player"><div className="expanded-cover"><Cover title={current.title} genre={current.genre} coverPath={coverForTrack(current)}/></div><h3>{current.title}</h3><button className="text-button" onClick={()=>{setModal(null);nav('artist',current.artist_id)}}>{artistName(current.artist_id)}</button><div className="expanded-progress"><input aria-label="Posición de reproducción" type="range" min="0" max={duration||1} step="1" value={Math.min(elapsed,duration||1)} onChange={e=>{audioRef.current.currentTime=Number(e.target.value);setElapsed(Number(e.target.value))}}/><div className="row space-between"><small>{formatTime(elapsed)}</small><small>{formatTime(duration)}</small></div></div><div className="expanded-controls"><button className={'mode-control '+(queueState.shuffle?'active':'')} aria-label="Aleatorio" aria-pressed={queueState.shuffle} onClick={()=>setPlayerQueue(toggleShuffle(queueRef.current))}><Shuffle size={19}/></button><button aria-label="Anterior" onClick={()=>nextTrack(true)}><SkipBack size={23}/></button><button className="play-round" aria-label={playing?'Pausar':'Reproducir'} onClick={()=>{const a=audioRef.current;if(a.paused)a.play().catch(()=>notify('No se pudo reproducir.'));else a.pause()}}>{playing?<Pause size={25} fill="currentColor"/>:<Play size={25} fill="currentColor"/>}</button><button aria-label="Siguiente" onClick={()=>nextTrack()}><SkipForward size={23}/></button><button className={'mode-control '+(queueState.repeat!=='off'?'active':'')} aria-label={'Repetir '+queueState.repeat} onClick={()=>setPlayerQueue(cycleRepeat(queueRef.current))}>{queueState.repeat==='one'?<Repeat1 size={19}/>:<Repeat size={19}/>}</button></div><div className="expanded-player-bottom"><Volume2 size={16}/><input aria-label="Volumen" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><button className="button secondary" onClick={()=>setModal({type:'queue'})}><ListOrdered size={17}/> Cola</button></div></div>:<p>Elige una canción para empezar.</p>}</>}
      {modal.type==='queue'&&<><span className="eyebrow">REPRODUCTOR OVIO</span><h2>Cola de reproducción</h2><p>{current?`Escuchando: ${current.title}`:'Elige una canción para empezar.'} · Modo repetir: {queueState.repeat==='off'?'Desactivado':queueState.repeat==='all'?'Toda la lista':'Una canción'}.</p><div className="queue-modal-tools"><button className={'button tiny '+(queueState.shuffle?'primary':'secondary')} onClick={()=>setPlayerQueue(toggleShuffle(queueRef.current))}><Shuffle size={15}/> Aleatorio</button><button className="button tiny secondary" onClick={()=>setPlayerQueue(cycleRepeat(queueRef.current))}><Repeat size={15}/> Repetir: {queueState.repeat}</button></div><div className="queue-list">{queueState.ids.map((id,i)=>{const t=publicTracks.find(x=>x.id===id);return t?<div className={'queue-item '+(i===queueState.cursor?'is-current':'')} key={id}><Cover compact title={t.title} coverPath={coverForTrack(t)}/><div><b>{t.title}</b><small>{artistName(t.artist_id)} · {i===queueState.cursor?'Sonando':i<queueState.cursor?'Ya escuchada':'Próxima'}</small></div>{i>queueState.cursor&&<div className="queue-actions"><button className="icon-button" title="Subir" disabled={i===queueState.cursor+1} onClick={()=>adjustQueue(id,-1)}><ChevronUp size={17}/></button><button className="icon-button" title="Bajar" disabled={i===queueState.ids.length-1} onClick={()=>adjustQueue(id,1)}><ChevronDown size={17}/></button><button className="icon-button" title="Quitar de la cola" onClick={()=>removeFromQueue(id)}><X size={17}/></button></div>}{i===queueState.cursor&&<Headphones color="#A98BFF" size={18}/>}</div>:null;})}{!queueState.ids.length&&<p className="empty-inline">Todavía no hay canciones en la cola.</p>}</div></>}
      {modal.type==='report-update'&&<><h2>Denunciar publicación</h2><p>El equipo revisará el mensaje del artista. Tu denuncia no retirará automáticamente el contenido.</p><form className="stack" onSubmit={e=>{e.preventDefault();reportUpdate(new FormData(e.currentTarget))}}><label>Motivo<textarea required name="reason" minLength={15} maxLength={1500} placeholder="Explica qué norma se ha vulnerado..."/></label><button className="button primary">Enviar denuncia</button></form></>}
      {modal.type==='artist-update'&&<><span className="eyebrow">COMUNIDAD DE ARTISTAS</span><h2>Crear una novedad</h2><p>Podrás comunicar un estreno o contar en qué estás trabajando. El equipo revisará el texto antes de publicarlo.</p><form className="stack" onSubmit={e=>{e.preventDefault();publishUpdate(new FormData(e.currentTarget))}}><label>Tu mensaje<textarea required name="body" minLength={10} maxLength={500} placeholder="Hoy comparto una nueva canción con vosotros..."/></label><label>Vincular una canción propia aprobada (opcional)<select name="track_id"><option value="">Sin canción vinculada</option>{publicTracks.filter(t=>t.artist_id===uid).map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></label><div className="warning">No publiques datos personales de terceros ni contenido que infrinja derechos. Las novedades pasan por moderación.</div><button className="button primary" type="submit">Enviar para revisión</button></form></>}
      {modal.type==='moderate-update'&&<><span className="eyebrow">MODERACIÓN DE COMUNIDAD</span><h2>{modal.status==='approved'?'Aprobar novedad':'Rechazar novedad'}</h2><p>{modal.update.body}</p><form className="stack" onSubmit={e=>{e.preventDefault();reviewUpdate(modal.update.id,modal.status,String(new FormData(e.currentTarget).get('review_note')||''))}}><label>{modal.status==='rejected'?'Motivo obligatorio (mínimo 10 caracteres)':'Nota opcional'}<textarea name="review_note" required={modal.status==='rejected'} minLength={modal.status==='rejected'?10:undefined} maxLength={1000}/></label><button type="submit" className={'button '+(modal.status==='rejected'?'danger':'primary')}>Confirmar decisión</button></form></>}
      {modal.type==='moderate'&&<><span className="eyebrow">REVISIÓN MANUAL</span><h2>{modal.status==='approved'?'Confirmar aprobación':'Registrar rechazo'}</h2><p>{modal.table==='tracks'?'Canción':'Solicitud de artista'}: <b>{modal.table==='tracks'?modal.object.title:modal.object.artist_name}</b></p><div className="warning">La declaración de autoría y los archivos adjuntos no prueban por sí solos la titularidad. Aprueba únicamente tras realizar las comprobaciones que correspondan.</div><form className="stack" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);review(modal.table,modal.table==='tracks'?modal.object.id:modal.object.user_id,modal.status,String(fd.get('review_note')||''))}}><label>{modal.status==='rejected'?'Motivo del rechazo (obligatorio)':'Nota de revisión (opcional)'}<textarea name="review_note" required={modal.status==='rejected'} minLength={modal.status==='rejected'?10:undefined} maxLength={1000} placeholder={modal.status==='rejected'?'Explica al artista qué documentación falta o por qué se rechaza.':'Nota para el artista sobre el resultado de la revisión.'} /></label><div className="row wrap"><button type="button" className="button ghost" onClick={()=>setModal(null)}>Cancelar</button><button className={'button '+(modal.status==='rejected'?'danger':'primary')} type="submit">{modal.status==='approved'?'Confirmar aprobación':'Confirmar rechazo'}</button></div></form></>}
      {modal.type==='edit-track'&&<><span className="eyebrow">CATÁLOGO DE ARTISTA</span><h2>Editar canción pendiente</h2><p>Solo puedes actualizar título, género y posición. El audio y la revisión no se modifican.</p><form className="stack" onSubmit={e=>{e.preventDefault();updatePendingTrack(new FormData(e.currentTarget))}}><label>Título<input name="title" required maxLength={100} defaultValue={modal.track.title}/></label><label>Género<select name="genre" defaultValue={modal.track.genre}>{genres.filter(g=>g!=='Todos').map(g=><option key={g} value={g}>{g}</option>)}</select></label>{modal.track.release_id&&<label>Número de pista<input name="track_number" type="number" min="1" max="99" required defaultValue={modal.track.track_number||1}/></label>}<div className="row wrap"><button type="button" className="button ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="button primary" type="submit">Guardar datos</button></div></form></>}
      {modal.type==='playlist'&&<><h2>{modal.playlist?'Editar playlist':'Crear playlist'}</h2><p>Decide quién puede verla y empieza a guardar canciones.</p><form className="stack" onSubmit={e=>{e.preventDefault();createPlaylist(new FormData(e.currentTarget))}}><label>Nombre<input name="name" required maxLength={75} defaultValue={modal.playlist?.name||''} placeholder="Mi música favorita"/></label><label>Descripción<textarea name="description" maxLength={250} defaultValue={modal.playlist?.description||''}/></label><label>Visibilidad<select name="is_public" defaultValue={String(modal.playlist?.is_public||false)}><option value="false">Privada — solo yo</option><option value="true">Pública — otros usuarios podrán escucharla</option></select></label><button className="button primary">Guardar playlist</button></form></>}
      {modal.type==='add'&&<><h2>Añadir canciones</h2><p>{modal.track?'Selecciona la lista donde guardar la canción.':'Elige una canción para esta playlist.'}</p><div className="modal-scroll">{modal.track?myPlaylists.map(p=><button className="select-line" key={p.id} onClick={()=>addSongToPlaylist(p.id,modal.track.id)}><ListMusic size={19}/>{p.name}<Plus size={16}/></button>):publicTracks.map(t=><button className="select-line" key={t.id} onClick={()=>addSongToPlaylist(modal.playlist.id,t.id)}><Music2 size={18}/>{t.title}<Plus size={16}/></button>)}</div>{modal.track&&!myPlaylists.length&&<button className="button secondary" onClick={()=>setModal({type:'playlist'})}>Crear una playlist primero</button>}</>}
      {modal.type==='apply'&&<><h2>Hazte artista</h2><p>La solicitud será revisada por un administrador.</p><form className="stack" onSubmit={e=>{e.preventDefault();applyArtist(new FormData(e.currentTarget))}}><AvailabilityField kind="artist" name="artist_name" value={newArtistName} onChange={setNewArtistName}/><label>Género principal<select name="genre">{genres.filter(x=>x!=='Todos').map(x=><option key={x}>{x}</option>)}</select></label><label>Sobre tu proyecto<textarea name="bio" maxLength={600}/></label><button className="button primary">Enviar solicitud</button></form></>}
      {modal.type==='release'&&<><h2>{modal.release?'Editar álbum / EP':'Crear álbum o EP'}</h2><p>{modal.release?'Puedes editar el álbum mientras ninguna de sus canciones esté aprobada.':'Podrás añadir canciones cuando hayas creado el álbum.'}</p><form className="stack" onSubmit={e=>{e.preventDefault();createRelease(new FormData(e.currentTarget))}}><label>Título del álbum<input name="title" required maxLength={90} defaultValue={modal.release?.title||''}/></label><label>Tipo<select name="kind" defaultValue={modal.release?.kind||'album'}><option value="album">Álbum</option><option value="ep">EP</option></select></label><label>Descripción<textarea name="description" maxLength={1000} defaultValue={modal.release?.description||''}/></label><ImagePicker key={modal.release?.id||'new'} name="cover" label="Portada (JPG, PNG o WebP, máximo 5 MB)" defaultUrl={assetUrl('covers',modal.release?.cover_path)}/><button className="button primary" disabled={uploading}>{uploading?'Guardando...':modal.release?'Guardar cambios':'Crear álbum'}</button></form></>}
      {modal.type==='song'&&<><h2>Subir música original</h2><p>Cada archivo queda privado hasta que un administrador lo apruebe. Los singles independientes pueden llevar una portada propia.</p><form className="stack" onSubmit={e=>{e.preventDefault();uploadSong(new FormData(e.currentTarget))}}><label>Título de la canción<input name="title" maxLength={100} required/></label><label>Género<select name="genre">{genres.filter(x=>x!=='Todos').map(x=><option key={x}>{x}</option>)}</select></label><label>Publicación<select name="release_id" defaultValue="" onChange={e=>setSongRelease(e.target.value)}><option value="">Single independiente</option>{database.releases.filter(r=>r.artist_id===uid).map(r=><option key={r.id} value={r.id}>{r.title} ({r.kind})</option>)}</select></label>{songRelease?<label>Número de pista en el álbum<input name="track_number" type="number" min="1" max="99" defaultValue="1" required/></label>:<ImagePicker key="song-cover" name="cover" label="Portada del single (opcional · hasta 5 MB)"/>}<label>Audio MP3 o WAV, máximo 30 MB<input type="file" name="audio" accept=".mp3,.wav,audio/mpeg,audio/wav" required/><span className="field-hint">Detectaremos la duración del audio antes de guardarlo.</span></label><label>Prueba de creación (opcional: captura del proyecto o documento PDF, máximo 10 MB)<input type="file" name="evidence" accept=".pdf,.jpg,.jpeg,.png,.webp"/></label><label className="check-label"><input type="checkbox" name="rights" value="yes" required/>Declaro que soy titular de todos los derechos de la composición, la grabación y la base instrumental, que es original y no contiene material ajeno sin autorización.</label><div className="warning">La plataforma revisará la declaración, pero no puede certificar al 100 % la autoría. Las reclamaciones pueden causar la retirada.</div><button className="button primary" disabled={uploading}>{uploading?'Subiendo...':'Enviar a revisión'}</button></form></>}
      {modal.type==='report'&&<><h2>Denunciar una canción</h2><p>Indícanos los motivos de la posible infracción de derechos de autor de «{modal.track?.title}».</p><form className="stack" onSubmit={e=>{e.preventDefault();reportSong(new FormData(e.currentTarget))}}><label>Descripción<textarea required name="reason" minLength={15} maxLength={2000} placeholder="Soy titular de los derechos de..."/></label><button className="button primary">Enviar denuncia</button></form></>}
    </div></div>}
    <Toast value={notice}/>
  </div>;
}
function formatTime(n){return `${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;}
