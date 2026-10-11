import React, {useEffect, useRef, useState} from 'react';
import {
  AudioLines, Home, Search, Library, Compass, Users, Trophy, CalendarDays,
  ClipboardCheck, MessageSquare, FileText, TrendingUp, Bell, ShieldCheck,
  ChevronDown, Disc3, X
} from 'lucide-react';
import {getNavigationGroups} from './sidebar-navigation';

const icons = {
  home:Home, search:Search, library:Library, compass:Compass, users:Users,
  trophy:Trophy, calendar:CalendarDays, checklist:ClipboardCheck,
  feedback:MessageSquare, studio:AudioLines, lyrics:FileText, stats:TrendingUp,
  bell:Bell, shield:ShieldCheck
};

function SidebarGroup({group,page,onNavigate,unreadCount}) {
  const active = group.items.some(item=>item.id===page);
  const [expanded,setExpanded] = useState(()=>group.id==='explore'||active);
  const previousPage=useRef(page);
  // Si se navega desde otra parte (p.ej. campana superior), abrir el grupo de destino.
  useEffect(()=>{
    if(page!==previousPage.current && active)setExpanded(true);
    previousPage.current=page;
  },[page,active]);
  const HeadingIcon=icons[group.icon];
  const sectionId=`ovio-menu-${group.id}`;
  return <section className={'nav-section '+(active?'nav-section-active':'')}>
    <h2 className="nav-section-title">
      <button type="button" className="nav-section-toggle" aria-expanded={expanded}
        aria-controls={sectionId} onClick={()=>setExpanded(open=>!open)}>
        <HeadingIcon size={18} aria-hidden="true"/>
        <span>{group.label}</span>
        {group.id==='creators' && unreadCount>0 && <span className="nav-group-count" aria-label={`${unreadCount} notificaciones`}>{unreadCount>99?'99+':unreadCount}</span>}
        <ChevronDown className={'nav-chevron '+(expanded?'expanded':'')} size={17} aria-hidden="true"/>
      </button>
    </h2>
    {expanded && <nav id={sectionId} className="sidebar-nav-links" aria-label={`Opciones de ${group.label}`}>
      {group.items.map(item=>{
        const Icon=icons[item.icon];
        const selected=page===item.id;
        return <button type="button" key={item.id} className={'side-link '+(selected?'active':'')}
          aria-current={selected?'page':undefined} onClick={()=>onNavigate(item.id)}>
          <Icon size={18} aria-hidden="true"/><span className="side-link-label">{item.label}</span>
          {item.id==='notifications' && unreadCount>0 && <span className="side-counter" aria-label={`${unreadCount} sin leer`}>{unreadCount>99?'99+':unreadCount}</span>}
        </button>;
      })}
    </nav>}
  </section>;
}

export default function NavigationSidebar({page,isAdmin,approvedArtist,unreadCount,mobileMenu,onNavigate,onClose,logo}) {
  const groups=getNavigationGroups({isAdmin,approvedArtist});
  const closeButtonRef=useRef(null);
  useEffect(()=>{if(mobileMenu)closeButtonRef.current?.focus();},[mobileMenu]);
  return <>
    {mobileMenu && <button className="sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={onClose}/>}
    <aside id="ovio-sidebar" className={'sidebar '+(mobileMenu?'open':'')} aria-label="Navegación de OVIO">
      <div className="sidebar-top">
        {logo}
        <button ref={closeButtonRef} type="button" className="icon-button mobile-close" onClick={onClose} aria-label="Cerrar menú"><X size={22}/></button>
      </div>
      <div className="sidebar-sections">
        {groups.map(group=><SidebarGroup key={group.id} group={group} page={page} onNavigate={onNavigate} unreadCount={unreadCount}/>)}
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-promo"><Disc3 color="#a993ff" aria-hidden="true"/><b>Tu próxima canción favorita está aquí.</b><p>Descubre nuevos talentos.</p><button type="button" className="button tiny secondary" onClick={()=>onNavigate('explore')}>Descubrir</button></div>
        <span className="sidebar-legal">Beta gratuita · Música revisada</span>
      </div>
    </aside>
  </>;
}
