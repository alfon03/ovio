import React, {useCallback,useEffect,useState} from 'react';
import {Bug, MessageSquare, RotateCw, Send, ShieldCheck} from 'lucide-react';
import {supabase, safeError} from './supabase';
import {FEEDBACK_CATEGORIES,FEEDBACK_SCREENS,FEEDBACK_STATES,FEEDBACK_PRIORITIES,validateFeedback} from './beta-feedback';

const initial={category:'error',screen:'Inicio',title:'',details:'',priority:'normal'};
const textCategory=(value)=>FEEDBACK_CATEGORIES.find(v=>v.value===value)?.label||value;
const formatDate=(d)=>new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});

export default function BetaSupport({userId,isAdmin=false,adminView=false}){
  const [items,setItems]=useState([]);
  const [draft,setDraft]=useState(initial);
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [updating,setUpdating]=useState(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [filter,setFilter]=useState('all');
  const [decisions,setDecisions]=useState({});
  const admin=Boolean(adminView&&isAdmin);
  const load=useCallback(async()=>{
    if(!userId)return;
    setLoading(true);setError('');
    // RLS obliga a que el usuario solo lea sus incidencias; el admin ve todas.
    const {data,error:e}=await supabase.from('beta_feedback')
      .select('id,user_id,category,screen,title,details,priority,status,response,created_at,updated_at')
      .order('created_at',{ascending:false}).limit(200);
    if(e)setError('No se pudieron cargar los comentarios. Comprueba la migración 011. '+safeError(e));
    else setItems(data||[]);
    setLoading(false);
  },[userId,admin]);
  useEffect(()=>{void load()},[load]);
  async function submit(e){
    e.preventDefault();if(submitting)return;
    const invalid=validateFeedback(draft);
    if(invalid){setError(invalid);return;}
    setSubmitting(true);setError('');setMessage('');
    const {error:e}=await supabase.from('beta_feedback').insert({
      user_id:userId,category:draft.category,screen:draft.screen,
      title:draft.title.trim(),details:draft.details.trim(),priority:draft.priority
    });
    setSubmitting(false);
    if(e){setError('No se pudo enviar. Es posible que hayas alcanzado el límite de 5 comentarios por hora. '+safeError(e));return;}
    setDraft(initial);setMessage('Gracias. El equipo de OVIO ha recibido tu comentario.');await load();
  }
  async function save(item){
    const change=decisions[item.id]||{};
    const status=change.status??item.status;
    const response=(change.response??item.response??'').trim();
    if(!Object.hasOwn(FEEDBACK_STATES,status)){setError('Estado no válido.');return;}
    if(response.length>1000){setError('La respuesta supera los 1.000 caracteres.');return;}
    setUpdating(item.id);setError('');setMessage('');
    const {error:e}=await supabase.from('beta_feedback').update({status,response}).eq('id',item.id);
    setUpdating(null);
    if(e){setError('No se pudo actualizar: '+safeError(e));return;}
    setMessage('Incidencia actualizada.');await load();
  }
  const visible=items.filter(x=>filter==='all'||x.status===filter);
  return <section className="ovio-beta-support">
    <div className="section-heading"><div><span className="eyebrow">OVIO · BETA PRIVADA</span>
      <h2>{admin?'Bandeja de incidencias':'Ayúdanos a mejorar OVIO'}</h2>
      <p className="subtext">{admin?'Revisa los comentarios de los participantes y responde desde OVIO.':'Cuéntanos qué falla, qué mejorarías o qué idea te gustaría ver.'}</p>
    </div><button type="button" className="button secondary" onClick={load} disabled={loading}><RotateCw size={15}/> Actualizar</button></div>
    {error&&<p role="alert" className="beta-feedback-error">{error}</p>}
    {message&&<p role="status" className="beta-feedback-success">{message}</p>}
    {!admin&&<form className="surface beta-feedback-form stack" onSubmit={submit}>
      <div className="row wrap" style={{alignItems:'center'}}><MessageSquare size={21} color="#ab91ff"/><b>Enviar un comentario</b></div>
      <div className="beta-feedback-grid"><label>Tipo de comentario<select value={draft.category} onChange={e=>setDraft(v=>({...v,category:e.target.value}))}>{FEEDBACK_CATEGORIES.map(c=><option value={c.value} key={c.value}>{c.label}</option>)}</select></label>
      <label>¿Dónde ha ocurrido?<select value={draft.screen} onChange={e=>setDraft(v=>({...v,screen:e.target.value}))}>{FEEDBACK_SCREENS.map(s=><option key={s}>{s}</option>)}</select></label></div>
      <label>Asunto<input value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))} required minLength={8} maxLength={120} placeholder="Ej.: No se reproduce mi playlist"/></label>
      <label>Cuéntanos qué ha pasado<textarea value={draft.details} onChange={e=>setDraft(v=>({...v,details:e.target.value}))} required minLength={15} maxLength={2000} rows={4} placeholder="Qué intentabas hacer, qué ocurrió y los pasos para repetirlo. No incluyas contraseñas ni datos sensibles."/></label>
      <label>Importancia<select value={draft.priority} onChange={e=>setDraft(v=>({...v,priority:e.target.value}))}><option value="normal">Normal</option><option value="high">Importante: bloquea alguna función</option></select></label>
      <p className="small">Máximo 5 envíos por hora. Para denunciar infracciones de derechos utiliza «Denunciar» en la canción: este formulario no las sustituye.</p>
      <button type="submit" className="button primary" disabled={submitting}><Send size={16}/>{submitting?'Enviando...':'Enviar a OVIO'}</button>
    </form>}
    <div className="surface beta-feedback-history"><div className="row wrap beta-feedback-history-head"><h3>{admin?'Comentarios recibidos':'Mis comentarios'}</h3><label className="beta-feedback-filter">Estado<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option>{Object.entries(FEEDBACK_STATES).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label></div>
      {loading?<p className="small">Cargando comentarios...</p>:!visible.length?<div className="beta-feedback-empty"><Bug size={25}/><p>{admin?'No hay comentarios con ese estado.':'Todavía no has enviado comentarios.'}</p></div>:visible.map(item=><article className="beta-feedback-item" key={item.id}>
        <div className="row wrap beta-feedback-item-head"><b>{item.title}</b><span className={'beta-status beta-status-'+item.status}>{FEEDBACK_STATES[item.status]||item.status}</span></div>
        <div className="small beta-feedback-meta">{textCategory(item.category)} · {item.screen} · {FEEDBACK_PRIORITIES[item.priority]} · {formatDate(item.created_at)}{admin&&` · Usuario ${item.user_id.slice(0,8)}…`}</div>
        <p className="beta-feedback-details">{item.details}</p>
        {item.response&&!admin&&<div className="beta-feedback-response"><ShieldCheck size={17}/><p><b>Respuesta de OVIO</b><br/>{item.response}</p></div>}
        {admin&&<div className="stack beta-feedback-admin-controls">
          <div className="beta-feedback-grid"><label>Estado<select value={decisions[item.id]?.status??item.status} onChange={e=>setDecisions(d=>({...d,[item.id]:{...d[item.id],status:e.target.value}}))}>{Object.entries(FEEDBACK_STATES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Respuesta para el usuario<textarea rows={2} maxLength={1000} value={decisions[item.id]?.response??item.response??''} onChange={e=>setDecisions(d=>({...d,[item.id]:{...d[item.id],response:e.target.value}}))} placeholder="Respuesta visible para quien envió este comentario"/></label></div>
          <button type="button" className="button secondary" disabled={updating===item.id} onClick={()=>save(item)}>{updating===item.id?'Guardando...':'Guardar respuesta y estado'}</button>
        </div>}
      </article>)}
    </div>
  </section>;
}
