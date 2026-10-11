import React, {useState} from 'react';
import {LockKeyhole} from 'lucide-react';
import {supabase} from './supabase';
import {recoveryRedirectUrl} from './auth-security';
import TurnstileChallenge, {turnstileSiteKey} from './TurnstileChallenge';

export default function AccountPasswordRequest({email,notify}){
  const [token,setToken]=useState('');
  const [resetSignal,setResetSignal]=useState(0);
  const [busy,setBusy]=useState(false);
  async function request(){
    if(busy||(turnstileSiteKey&&!token))return;
    setBusy(true);
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(email,{
        redirectTo:recoveryRedirectUrl(window.location.origin,window.location.pathname),
        ...(turnstileSiteKey?{captchaToken:token}:{})
      });
      notify(error?'No se pudo enviar el enlace. Inténtalo más tarde.':'Si el envío está disponible, recibirás instrucciones en tu correo.');
    }catch{notify('No se pudo contactar con el servicio de correo.');}
    finally{setBusy(false);setToken('');setResetSignal(v=>v+1);}
  }
  return <div className="listening-settings"><h3>Seguridad de la cuenta</h3>
    <p className="small">¿Necesitas cambiar la contraseña? Te enviaremos un enlace a tu correo verificado. No la modificaremos sin ese enlace.</p>
    {turnstileSiteKey&&<TurnstileChallenge onToken={setToken} resetSignal={resetSignal}/>}
    <button className="button secondary" type="button" disabled={busy||(Boolean(turnstileSiteKey)&&!token)} onClick={request}>
      <LockKeyhole size={16}/>{busy?'Enviando…':'Enviar enlace para cambiar contraseña'}
    </button>
  </div>;
}
