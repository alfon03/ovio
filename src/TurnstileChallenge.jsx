import React, {useEffect, useRef, useState} from 'react';

// Turnstile es opcional. Su sitekey es PÚBLICA; el secreto NUNCA va al navegador.
// Los tokens se comprueban en Supabase Auth cuando se habilita la protección anti-bots.
const SCRIPT='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

function loadTurnstile(){
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(!scriptPromise){
    scriptPromise=new Promise((resolve,reject)=>{
      let script=document.querySelector('script[data-ovio-turnstile]');
      const loaded=()=>window.turnstile?resolve(window.turnstile):reject(new Error('Turnstile no disponible'));
      const failed=()=>reject(new Error('No se pudo cargar la protección anti-bots'));
      if(!script){
        script=document.createElement('script');
        script.src=SCRIPT;
        script.async=true;
        script.defer=true;
        script.dataset.ovioTurnstile='1';
        script.addEventListener('load',loaded,{once:true});
        script.addEventListener('error',failed,{once:true});
        document.head.appendChild(script);
      }else{
        script.addEventListener('load',loaded,{once:true});
        script.addEventListener('error',failed,{once:true});
      }
    }).catch(error=>{scriptPromise=undefined;throw error;});
  }
  return scriptPromise;
}

export const turnstileSiteKey=(import.meta.env.VITE_TURNSTILE_SITE_KEY||'').trim();

export default function TurnstileChallenge({onToken,resetSignal=0}){
  const container=useRef(null);
  const widget=useRef(null);
  const callback=useRef(onToken);
  const firstReset=useRef(true);
  const [error,setError]=useState('');
  useEffect(()=>{callback.current=onToken;},[onToken]);
  useEffect(()=>{
    if(!turnstileSiteKey)return;
    let active=true;
    loadTurnstile().then(api=>{
      if(!active||!container.current)return;
      widget.current=api.render(container.current,{
        sitekey:turnstileSiteKey,
        theme:'dark',
        callback:token=>{if(active)callback.current(token);},
        'expired-callback':()=>{if(active)callback.current('');},
        'error-callback':()=>{if(active){callback.current('');setError('No se pudo verificar. Recarga la página o inténtalo más tarde.');}},
      });
    }).catch(()=>{if(active){callback.current('');setError('No se pudo cargar la verificación. Comprueba tu conexión y los bloqueadores.');}});
    return ()=>{
      active=false;
      if(widget.current!==null && window.turnstile){
        try{window.turnstile.remove(widget.current);}catch{/* widget retirado */}
      }
      widget.current=null;
    };
  },[]);
  useEffect(()=>{
    if(firstReset.current){firstReset.current=false;return;}
    callback.current('');
    if(widget.current!==null&&window.turnstile){
      try{window.turnstile.reset(widget.current);}catch{/* el widget puede haberse desmontado */}
    }
  },[resetSignal]);
  if(!turnstileSiteKey)return null;
  return <div className="auth-captcha" aria-label="Protección anti-bots">
    <div ref={container}/>
    {error&&<p role="alert" className="field-error">{error}</p>}
  </div>;
}
