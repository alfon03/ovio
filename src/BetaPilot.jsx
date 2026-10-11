import React, {useCallback,useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,ClipboardCheck,RefreshCcw,ShieldCheck,Users,Music2,Headphones,MessageSquare,Sparkles} from 'lucide-react';
import {supabase, safeError} from './supabase';
import {PILOT_STEPS,pilotStepStatus,pilotProgress,pilotMetrics} from './beta-pilot';

export function BetaWelcome({username='',favoriteCount=0,playlistCount=0,followCount=0,onNavigate}){
  const statuses=pilotStepStatus({username,favoriteCount,playlistCount,followCount});
  const completed=pilotProgress(statuses);
  return <div className="pilot-page">
    <header className="page-header"><span className="eyebrow">OVIO · BETA PRIVADA</span><h1>Empieza a descubrir tu música</h1><p>Cuatro acciones sencillas para probar OVIO. El progreso se calcula con tu propia cuenta.</p></header>
    <div className="pilot-intro surface"><div><span className="eyebrow"><Sparkles size={14}/> MIS PRIMEROS PASOS</span><h2>{completed} de {PILOT_STEPS.length} completados</h2><p>Las canciones deben estar aprobadas para aparecer en el catálogo. Algunas tareas pueden esperar hasta que haya música disponible.</p></div>
      <div className="pilot-progress-track" aria-label={`${completed} de ${PILOT_STEPS.length} pasos completados`}><span style={{width:`${completed/PILOT_STEPS.length*100}%`}}/></div></div>
    <div className="pilot-steps">{PILOT_STEPS.map((step,index)=><section className="pilot-step surface" key={step.id}>
      <div className={'pilot-step-number '+(statuses[step.id]?'done':'')}>{statuses[step.id]?<CheckCircle2 size={20}/>:index+1}</div>
      <div className="pilot-step-copy"><h3>{step.title}</h3><p>{step.description}</p><small>{statuses[step.id]?'¡Completado!':'Todavía pendiente'}</small></div>
      <button className="button secondary" type="button" onClick={()=>onNavigate(step.destination)}>{statuses[step.id]?'Volver':'Ir ahora'} <ArrowRight size={15}/></button>
    </section>)}</div>
    <section className="pilot-help surface"><MessageSquare size={22}/><div><h3>Tu opinión nos ayuda a mejorar</h3><p>Si alguna función falla, entra en Ayuda y sugerencias. No envíes contraseñas ni documentos personales.</p></div><button type="button" className="button primary" onClick={()=>onNavigate('feedback')}>Enviar comentario</button></section>
  </div>;
}

const tiles=[
  ['registeredUsers','Cuentas registradas',Users],['newUsers7d','Altas en 7 días',Users],
  ['approvedArtists','Artistas aprobados',Music2],['pendingArtists','Artistas por revisar',ShieldCheck],
  ['approvedTracks','Canciones publicadas',Headphones],['pendingTracks','Canciones por revisar',ShieldCheck],
  ['openFeedback','Incidencias nuevas',MessageSquare],['reviewingFeedback','Incidencias en revisión',MessageSquare]
];

export default function BetaPilotDashboard({isAdmin=false,onNavigate}){
  const [overview,setOverview]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const fetchOverview=useCallback(async()=>{
    if(!isAdmin){setLoading(false);setOverview(null);return;}
    setLoading(true);setError('');
    const {data,error:failure}=await supabase.rpc('get_ovio_pilot_overview');
    if(failure)setError('No se pudo cargar el panel. Comprueba la migración 012 y tus permisos: '+safeError(failure));
    else setOverview(pilotMetrics(data));
    setLoading(false);
  },[isAdmin]);
  useEffect(()=>{void fetchOverview()},[fetchOverview]);
  if(!isAdmin)return <div className="surface pilot-noaccess"><ShieldCheck size={30}/><h2>Zona del equipo OVIO</h2><p>Este panel solo está disponible para administradores.</p></div>;
  return <div className="pilot-page"><div className="section-heading"><div><span className="eyebrow">OVIO · PILOTO PRIVADO</span><h1>Panel del piloto</h1><p className="subtext">Un resumen privado de la actividad y los asuntos que requieren atención.</p></div><button className="button secondary" type="button" onClick={fetchOverview} disabled={loading}><RefreshCcw size={15}/>{loading?'Actualizando...':'Actualizar'}</button></div>
    {error&&<p role="alert" className="beta-feedback-error">{error}</p>}
    {loading&&!overview?<p className="surface pilot-loading">Cargando indicadores...</p>:overview&&<>
      <div className="pilot-metrics">{tiles.map(([id,name,Icon])=><div className="pilot-metric surface" key={id}><div><Icon size={19}/><span>{name}</span></div><strong>{overview[id].toLocaleString('es-ES')}</strong></div>)}</div>
      <div className="pilot-secondary-grid"><section className="surface pilot-summary"><span className="eyebrow">ESCUCHAS CON ESTADÍSTICAS ACTIVADAS · 7 DÍAS</span><h2>{overview.listeningMinutes7d.toLocaleString('es-ES')} min</h2><div className="pilot-summary-stats"><span>{overview.validPlays7d.toLocaleString('es-ES')} sesiones de al menos 30 s</span><span>{overview.activeListeners7d.toLocaleString('es-ES')} oyentes distintos</span></div><p>Son datos parciales: solo cuentan usuarios que han autorizado registrar su actividad. No representan todas las escuchas de OVIO.</p></section>
      <section className="surface pilot-summary"><span className="eyebrow">ATENCIÓN AL PARTICIPANTE</span><h2>{(overview.openFeedback+overview.reviewingFeedback).toLocaleString('es-ES')} sin cerrar</h2><p>{overview.resolvedFeedback} incidencias resueltas hasta la fecha.</p><button className="button secondary" type="button" onClick={()=>onNavigate('feedback-admin')}>Abrir soporte <ArrowRight size={16}/></button></section></div>
      <section className="surface pilot-help"><ClipboardCheck size={24}/><div><h3>Antes de ampliar el piloto</h3><p>Comprueba reclamaciones de derechos, permisos RLS y los correos de invitación. Estas cifras no acreditan que la aplicación esté lista legalmente para abrir al público.</p></div><button className="button secondary" onClick={()=>onNavigate('admin')}>Ver moderación</button></section>
    </>}
  </div>;
}
