import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, RefreshCw, Clock3, Headphones, Users, Music2, TrendingUp, Info, AlertCircle } from 'lucide-react';
import { supabase, safeError } from './supabase';
import { formatMonth, intervals, normalizedInsights } from './artist-insights';

const fmt = new Intl.NumberFormat('es-ES');

function Metric({icon:Icon,label,value,help}) {
  return <article className="insight-metric"><div className="insight-metric-head"><Icon size={19}/><span>{label}</span></div><strong>{fmt.format(value)}</strong><small>{help}</small></article>;
}

export default function ArtistInsights({artistName,onBack}) {
  const [period,setPeriod] = useState(6);
  const [metric,setMetric] = useState('plays');
  const [reload,setReload] = useState(0);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [insights,setInsights] = useState(null);
  useEffect(() => {
    let live=true;
    setLoading(true);setError('');
    supabase.rpc('get_my_artist_insights',{p_months:period}).then(({data,error:requestError})=>{
      if(!live)return;
      if(requestError){setError(safeError(requestError));setInsights(null);}
      else setInsights(normalizedInsights(data));
      setLoading(false);
    }).catch(e=>{if(live){setError(String(e?.message||e));setLoading(false);}});
    return ()=>{live=false;};
  },[period,reload]);

  const max = useMemo(()=>Math.max(1,...(insights?.months||[]).map(m=>m[metric])),[insights,metric]);
  const sum = insights?.totals;
  return <>
    <header className="page-header"><button className="back" onClick={onBack}><ArrowLeft size={17}/> OVIO Studio</button><span className="eyebrow">ESTADÍSTICAS PARA ARTISTAS</span><h1>Tu música en números</h1><p>Comprende cómo están creciendo tus canciones{artistName?` · ${artistName}`:''}.</p></header>
    <div className="insight-actions"><label>Periodo de análisis<select value={period} onChange={e=>setPeriod(Number(e.target.value))}>{intervals.map(n=><option value={n} key={n}>{n} {n===1?'mes':'meses'}</option>)}</select></label><button className="button secondary" onClick={()=>setReload(x=>x+1)} disabled={loading}><RefreshCw size={16}/> Actualizar</button></div>
    {loading && <section className="surface insight-status" role="status">Cargando estadísticas del artista…</section>}
    {error && <section className="surface insight-status" role="alert"><AlertCircle size={21}/><div><b>No se han podido cargar los datos.</b><p>{error}</p><p className="small">Comprueba que ejecutaste la migración 006 y que tienes un perfil de artista aprobado.</p></div></section>}
    {!loading && !error && sum && <>
      <div className="insight-metrics">
        <Metric icon={Headphones} label="Reproducciones válidas" value={sum.plays} help="Sesiones que cumplen el mínimo de escucha"/>
        <Metric icon={Users} label="Oyentes únicos" value={sum.listeners} help="Usuarios distintos en el periodo"/>
        <Metric icon={Clock3} label="Minutos escuchados" value={sum.minutes} help="Tiempo registrado, redondeado hacia abajo"/>
        <Metric icon={TrendingUp} label="Seguidores actuales" value={sum.followers} help={`${fmt.format(sum.current_followers_joined_last_30d)} seguidores actuales llegaron en 30 días`}/>
      </div>
      <section className="surface insight-chart-section">
        <div className="insight-heading"><div><h2>Evolución mensual</h2><p className="small">{insights.from} a {insights.to} · meses UTC; el mes actual aún está en curso</p></div><div className="insight-toggle" role="group" aria-label="Métrica del gráfico">{[['plays','Reproducciones'],['listeners','Oyentes'],['minutes','Minutos']].map(([id,label])=><button key={id} className={metric===id?'selected':''} onClick={()=>setMetric(id)} aria-pressed={metric===id}>{label}</button>)}</div></div>
        <div className="insight-bar-list">{insights.months.map(m=><div key={m.month} className="insight-bar-row"><span>{formatMonth(m.month)}</span><div className="insight-bar-track" role="img" aria-label={`${formatMonth(m.month)}: ${fmt.format(m[metric])}`}><div className="insight-bar-fill" style={{width:`${Math.max(0,Math.min(100,(m[metric]/max)*100))}%`}}/></div><b>{fmt.format(m[metric])}</b></div>)}</div>
        {insights.months.length===0&&<p className="small">Todavía no hay meses disponibles.</p>}
      </section>
      <section className="surface insight-song-section"><div className="insight-heading"><div><h2>Rendimiento por canción</h2><p className="small">Solo canciones aprobadas, ordenadas por reproducciones válidas.</p></div><span className="small">{fmt.format(sum.approved_tracks)} aprobadas</span></div>
        <div className="insight-table-wrap"><table className="insight-table"><thead><tr><th>Canción</th><th>Género</th><th>Reproducciones</th><th>Oyentes</th><th>Minutos</th></tr></thead><tbody>{insights.tracks.map(t=><tr key={t.track_id}><td><Music2 size={15}/> <b>{t.title}</b></td><td>{t.genre}</td><td>{fmt.format(t.plays)}</td><td>{fmt.format(t.listeners)}</td><td>{fmt.format(t.minutes)}</td></tr>)}</tbody></table></div>
        {insights.tracks.length===0&&<div className="insight-empty"><BarChart3 size={27}/><b>Aún no hay canciones aprobadas.</b><p>Cuando tu música se publique, su rendimiento aparecerá aquí.</p></div>}
        {insights.tracks.length>0&&sum.plays===0&&<p className="small">Todavía no hay reproducciones válidas registradas durante el periodo elegido.</p>}
      </section>
      <div className="insight-privacy"><Info size={20}/><p><b>Sobre estos datos:</b> son estadísticas beta agregadas, basadas en sesiones de usuarios que activaron el seguimiento voluntariamente desde la v0.6. No incluyen escuchas anteriores, oyentes sin consentimiento ni identificación individual. Las reproducciones válidas y los minutos pueden no coincidir porque siguen reglas distintas. Si un usuario elimina su historial, las cifras pueden disminuir. Los seguidores recientes cuentan solo a quienes te siguen actualmente.</p></div>
    </>}
  </>;
}
