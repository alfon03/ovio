import React from 'react';

/** Evita una pantalla vacía tras un fallo inesperado de React. No envía datos externos. */
export default class ErrorBoundary extends React.Component {
  state = {hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(error){
    if(import.meta.env.DEV)console.error('OVIO: error de interfaz',error);
  }
  render(){
    if(!this.state.hasError)return this.props.children;
    return <main className="fatal-screen" role="alert">
      <div className="fatal-card">
        <span className="fatal-mark" aria-hidden="true">◎</span>
        <span className="eyebrow">OVIO · RECUPERACIÓN</span>
        <h1>Esta pantalla no se ha podido cargar.</h1>
        <p>Tu cuenta y tu música siguen en Supabase. Prueba a recargar la aplicación; si el problema continúa, comunícalo al equipo de OVIO.</p>
        <button type="button" className="button primary" onClick={()=>window.location.reload()}>Recargar OVIO</button>
      </div>
    </main>;
  }
}
