import React, {useCallback, useEffect, useState} from 'react';
import {ArrowLeft, FileText, Plus, Save, Trash2, LockKeyhole, RefreshCcw} from 'lucide-react';
import {supabase, safeError} from './supabase';
import {cleanLyricDraft, validateLyricDraft, LYRIC_BODY_MAX, LYRIC_TITLE_MAX} from './lyric-drafts';

const emptyDraft = {title:'',body:'',track_id:null};
const niceDate = d => new Date(d).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'});

// NO hay publicación ni vínculo al catálogo público. La tabla tiene RLS de propietario.
export default function LyricDrafts({userId,tracks=[],onBack}) {
  const [items,setItems]=useState([]);
  const [editingId,setEditingId]=useState(null);
  const [draft,setDraft]=useState(emptyDraft);
  const [original,setOriginal]=useState(emptyDraft);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const dirty=JSON.stringify(draft)!==JSON.stringify(original);
  const load=useCallback(async()=>{
    if(!userId)return;
    setLoading(true);setError('');
    const {data,error:dbError}=await supabase.from('artist_lyric_drafts')
      .select('id,title,body,track_id,created_at,updated_at')
      .eq('owner_id',userId).order('updated_at',{ascending:false}).limit(200);
    if(dbError)setError('No se pudieron cargar las letras. Comprueba la migración 013. '+safeError(dbError));
    else setItems(data||[]);
    setLoading(false);
  },[userId]);
  useEffect(()=>{void load();},[load]);
  function selectDraft(item){
    if(dirty&&!window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?'))return;
    setEditingId(item?.id||null);
    const next=item?{title:item.title,body:item.body,track_id:item.track_id||null}:emptyDraft;
    setDraft(next);setOriginal(next);setError('');setMessage('');
  }
  async function save(event){
    event.preventDefault();if(saving||deleting)return;
    const reason=validateLyricDraft(draft);
    if(reason){setError(reason);return;}
    const payload=cleanLyricDraft(draft);
    setSaving(true);setError('');setMessage('');
    const query=editingId
      ?supabase.from('artist_lyric_drafts').update(payload).eq('id',editingId).eq('owner_id',userId)
      :supabase.from('artist_lyric_drafts').insert({...payload,owner_id:userId});
    const {data,error:dbError}=await query.select('id,title,body,track_id,created_at,updated_at').single();
    setSaving(false);
    if(dbError){setError('No se pudo guardar: '+safeError(dbError));return;}
    setEditingId(data.id);
    const clean={title:data.title,body:data.body,track_id:data.track_id||null};
    setDraft(clean);setOriginal(clean);
    setMessage('Letra guardada en privado. Solo tú puedes consultarla en OVIO.');
    await load();
  }
  async function remove(){
    if(!editingId||deleting||saving)return;
    if(!window.confirm('¿Eliminar esta letra de forma permanente? Esta acción no se puede deshacer.'))return;
    setDeleting(true);setError('');setMessage('');
    const {error:dbError}=await supabase.from('artist_lyric_drafts').delete()
      .eq('id',editingId).eq('owner_id',userId);
    setDeleting(false);
    if(dbError){setError('No se pudo eliminar: '+safeError(dbError));return;}
    setEditingId(null);setDraft(emptyDraft);setOriginal(emptyDraft);
    setMessage('Borrador eliminado.');await load();
  }
  return <section className="lyric-vault">
    <header className="page-header"><span className="eyebrow">OVIO STUDIO · ARCHIVO PRIVADO</span>
      <h1>Mis letras</h1><p>Escribe ideas y letras para tus canciones. Se guardan como borradores privados: <b>no se publican</b>, no aparecen en búsquedas y otros artistas no pueden verlas.</p>
      <div className="row wrap"><button type="button" className="button secondary" onClick={()=>{if(!dirty||window.confirm('¿Salir sin guardar los cambios?'))onBack();}}><ArrowLeft size={16}/> Volver a Studio</button>
      <button type="button" className="button primary" onClick={()=>selectDraft(null)}><Plus size={17}/> Nueva letra</button></div>
    </header>
    <div className="lyric-private-hint"><LockKeyhole size={18}/><span><b>Solo para ti.</b> El acceso se protege en Supabase con políticas de propietario. No existe un botón de publicación. Guarda una copia personal de tus letras importantes.</span></div>
    {error&&<p className="beta-feedback-error" role="alert">{error}</p>}
    {message&&<p className="beta-feedback-success" role="status">{message}</p>}
    <div className="lyric-vault-grid">
      <aside className="lyric-vault-list surface"><div className="lyric-vault-list-head"><b>Tus borradores</b><button type="button" className="icon-button" onClick={load} disabled={loading} title="Actualizar"><RefreshCcw size={17}/></button></div>
        {loading?<p className="small">Cargando...</p>:items.length?items.map(item=><button type="button" key={item.id} onClick={()=>selectDraft(item)} className={'lyric-list-item '+(editingId===item.id?'selected':'')}><FileText size={18}/><span><b>{item.title}</b><small>{niceDate(item.updated_at)}</small></span></button>):<p className="small">Todavía no tienes letras. Crea tu primer borrador.</p>}
      </aside>
      <form className="lyric-vault-editor surface" onSubmit={save}>
        <div className="lyric-editor-top"><b>{editingId?'Editar letra':'Nueva letra privada'}</b><span className="lyric-private-chip"><LockKeyhole size={13}/> Privado</span></div>
        <label>Título de la letra<input value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))} required maxLength={LYRIC_TITLE_MAX} placeholder="Ej.: Mi próxima canción" /></label>
        <label>Relacionar con una canción tuya (opcional)<select value={draft.track_id||''} onChange={e=>setDraft(v=>({...v,track_id:e.target.value||null}))}><option value="">Sin canción asociada</option>{tracks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
        <label>Letra o ideas<textarea value={draft.body} onChange={e=>setDraft(v=>({...v,body:e.target.value}))} maxLength={LYRIC_BODY_MAX} rows={17} spellCheck placeholder={'Verso 1...\n\nEstribillo...'} /></label>
        <div className="lyric-editor-foot"><small>{draft.body.length.toLocaleString('es-ES')} / {LYRIC_BODY_MAX.toLocaleString('es-ES')} caracteres · {dirty?'Cambios sin guardar':'Sin cambios pendientes'}</small><div className="row wrap"><button className="button primary" disabled={saving||deleting} type="submit"><Save size={16}/>{saving?'Guardando...':'Guardar borrador'}</button>{editingId&&<button type="button" className="button danger" onClick={remove} disabled={saving||deleting}><Trash2 size={16}/>{deleting?'Eliminando...':'Eliminar'}</button>}</div></div>
      </form>
    </div>
  </section>;
}
