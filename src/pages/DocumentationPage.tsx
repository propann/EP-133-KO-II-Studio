import type { AppLanguage } from '../core/i18n';
import { useLanguageStore } from '../core/store/languageStore';

const REPO_DOCS = 'https://github.com/propann/EP-133-KO-II-Studio/blob/main/docs';

type DocLink = {
  title: string;
  file: string;
  description: string;
  status?: string;
};

const toolGuides: DocLink[] = [
  { title: 'DÉMARRER LE STUDIO', file: 'LANCEMENT_LOCAL.md', description: 'Installer l’application, la lancer localement et ouvrir les différents outils.' },
  { title: 'PATTERN & SONG STUDIO', file: 'STRUCTURE_SONG_MODE.md', description: 'Comprendre patterns, scènes, Song Positions et organisation de l’arrangeur.' },
  { title: 'SAVE / LOAD', file: 'VALIDATION_SAVE_LOAD_STUDIO.md', description: 'Créer, sauvegarder, rouvrir et protéger les projets du Studio.' },
  { title: 'SONS & TRANSFERT', file: 'POINT_SONS_ET_TRANSFERT.md', description: 'Groupes, pads, slots, banques sonores et préparation d’une synchronisation.' },
  { title: 'CLONER LA MACHINE', file: 'CLONAGE_COMPLET_MACHINE.md', description: 'Copier projets, métadonnées et samples vers un miroir privé local.', status: 'LECTURE SEULE' },
  { title: 'PONT LOCAL', file: 'PONT_LOCAL_CLONAGE.md', description: 'Installer et utiliser le service local qui relie le navigateur au cloneur.' },
  { title: 'TEST MACHINE & MIDI', file: 'CONNEXION_ET_CALIBRATION_MIDI.md', description: 'Lire le journal MIDI/SysEx, associer les contrôles et tester les deux sens.', status: 'MATÉRIEL' },
  { title: 'RÉFÉRENCE SYSEX EP‑133', file: 'REFERENCE_SYSEX_EP133.md', description: 'Handshake, identification, FILE, métadonnées, format WAV et opérations dangereuses.', status: 'RECHERCHE' },
  { title: 'RHYTHM HERO', file: 'POINT_JEU_ET_STUDIO.md', description: 'Utiliser le module d’entraînement, ses exercices, son score et ses pads.' },
];

const machineGuides: DocLink[] = [
  { title: 'MISE EN ROUTE LINUX', file: 'MISE_EN_ROUTE_LINUX.md', description: 'USB, permissions, navigateur compatible et vérification MIDI sous Linux.' },
  { title: 'MISE EN ROUTE WINDOWS', file: 'MISE_EN_ROUTE_WINDOWS.md', description: 'Préparer Windows, connecter l’EP‑133 et lancer l’application.' },
  { title: 'CHARGER UN PROJET MACHINE', file: 'CHARGEMENT_PROJET_MACHINE.md', description: 'Lire un projet réel sans modifier les données de l’EP‑133.', status: 'LECTURE SEULE' },
  { title: 'BANQUE DE SAMPLES', file: 'BANQUE_SAMPLES_STUDIO.md', description: 'Comprendre les sons, leurs emplacements et leur utilisation dans le Studio.' },
  { title: 'FORMATS EP‑133', file: 'DECISION_FORMATS_PROJET.md', description: 'Archives .pak/.ppak, MIDI, JSON et limites de compatibilité connues.' },
  { title: 'MODÈLE DE DONNÉES', file: 'MODELE_DONNEES_PROJET.md', description: 'Groupes, pads, notes, vélocités, durées et champs préservés.' },
];

const guideTranslations: Record<'en' | 'es', Record<string, [string, string, string?]>> = {
  en: {
    'LANCEMENT_LOCAL.md':['START THE STUDIO','Install the app, run it locally and open each tool.'], 'STRUCTURE_SONG_MODE.md':['PATTERN & SONG STUDIO','Understand patterns, scenes, Song Positions and the arranger.'], 'VALIDATION_SAVE_LOAD_STUDIO.md':['SAVE / LOAD','Create, save, reopen and protect Studio projects.'], 'POINT_SONS_ET_TRANSFERT.md':['SOUNDS & TRANSFER','Groups, pads, slots, sound banks and synchronization preparation.'], 'CLONAGE_COMPLET_MACHINE.md':['CLONE THE DEVICE','Copy projects, metadata and samples to a private local mirror.','READ ONLY'], 'PONT_LOCAL_CLONAGE.md':['LOCAL BRIDGE','Connect the browser to the local cloning engine.'], 'CONNEXION_ET_CALIBRATION_MIDI.md':['MACHINE TEST & MIDI','Read MIDI/SysEx logs, map controls and test both directions.','HARDWARE'], 'POINT_JEU_ET_STUDIO.md':['RHYTHM HERO','Use the training module, exercises, scoring and pads.'],
    'MISE_EN_ROUTE_LINUX.md':['LINUX SETUP','USB, permissions, compatible browser and MIDI checks on Linux.'], 'MISE_EN_ROUTE_WINDOWS.md':['WINDOWS SETUP','Prepare Windows, connect the EP‑133 and start the app.'], 'CHARGEMENT_PROJET_MACHINE.md':['LOAD A DEVICE PROJECT','Read a real project without changing EP‑133 data.','READ ONLY'], 'BANQUE_SAMPLES_STUDIO.md':['SAMPLE LIBRARY','Understand sounds, slots and their use in the Studio.'], 'DECISION_FORMATS_PROJET.md':['EP‑133 FORMATS','.pak/.ppak archives, MIDI, JSON and known compatibility limits.'], 'MODELE_DONNEES_PROJET.md':['DATA MODEL','Groups, pads, notes, velocities, durations and preserved fields.'], 'REFERENCE_SYSEX_EP133.md':['EP‑133 SYSEX REFERENCE','Handshake, identification, FILE, metadata, WAV format and dangerous operations.','RESEARCH'],
  },
  es: {
    'LANCEMENT_LOCAL.md':['INICIAR EL STUDIO','Instala la aplicación, ejecútala localmente y abre sus herramientas.'], 'STRUCTURE_SONG_MODE.md':['PATTERN & SONG STUDIO','Comprende patterns, escenas, Song Positions y el arreglador.'], 'VALIDATION_SAVE_LOAD_STUDIO.md':['SAVE / LOAD','Crea, guarda, vuelve a abrir y protege proyectos del Studio.'], 'POINT_SONS_ET_TRANSFERT.md':['SONIDOS Y TRANSFERENCIA','Grupos, pads, slots, bancos de sonidos y preparación de sincronización.'], 'CLONAGE_COMPLET_MACHINE.md':['CLONAR LA MÁQUINA','Copia proyectos, metadatos y samples a un espejo local privado.','SOLO LECTURA'], 'PONT_LOCAL_CLONAGE.md':['PUENTE LOCAL','Conecta el navegador con el motor local de clonación.'], 'CONNEXION_ET_CALIBRATION_MIDI.md':['PRUEBA DE MÁQUINA Y MIDI','Lee el registro MIDI/SysEx, asigna controles y prueba ambos sentidos.','HARDWARE'], 'POINT_JEU_ET_STUDIO.md':['RHYTHM HERO','Usa el módulo de entrenamiento, sus ejercicios, puntuación y pads.'],
    'MISE_EN_ROUTE_LINUX.md':['CONFIGURACIÓN LINUX','USB, permisos, navegador compatible y verificación MIDI en Linux.'], 'MISE_EN_ROUTE_WINDOWS.md':['CONFIGURACIÓN WINDOWS','Prepara Windows, conecta el EP‑133 e inicia la aplicación.'], 'CHARGEMENT_PROJET_MACHINE.md':['CARGAR UN PROYECTO','Lee un proyecto real sin modificar los datos del EP‑133.','SOLO LECTURA'], 'BANQUE_SAMPLES_STUDIO.md':['BANCO DE SAMPLES','Comprende sonidos, slots y su uso en el Studio.'], 'DECISION_FORMATS_PROJET.md':['FORMATOS EP‑133','Archivos .pak/.ppak, MIDI, JSON y límites conocidos.'], 'MODELE_DONNEES_PROJET.md':['MODELO DE DATOS','Grupos, pads, notas, velocidades, duraciones y campos preservados.'], 'REFERENCE_SYSEX_EP133.md':['REFERENCIA SYSEX EP‑133','Handshake, identificación, FILE, metadatos, formato WAV y operaciones peligrosas.','INVESTIGACIÓN'],
  },
};

function localizedGuides(guides: DocLink[], language: AppLanguage): DocLink[] {
  if (language === 'fr') return guides;
  return guides.map((guide) => { const translated = guideTranslations[language][guide.file]; return translated ? { ...guide, title:translated[0], description:translated[1], status:translated[2] } : guide; });
}

function localizedGuideFile(file: string, language: AppLanguage): string {
  const translatedFiles = new Set([
    'LANCEMENT_LOCAL.md', 'CONNEXION_ET_CALIBRATION_MIDI.md', 'CLONAGE_COMPLET_MACHINE.md',
    'STRUCTURE_SONG_MODE.md', 'VALIDATION_SAVE_LOAD_STUDIO.md', 'POINT_SONS_ET_TRANSFERT.md',
    'PONT_LOCAL_CLONAGE.md', 'MISE_EN_ROUTE_LINUX.md', 'MISE_EN_ROUTE_WINDOWS.md',
    'CHARGEMENT_PROJET_MACHINE.md', 'BANQUE_SAMPLES_STUDIO.md', 'DECISION_FORMATS_PROJET.md',
    'MODELE_DONNEES_PROJET.md', 'REFERENCE_SYSEX_EP133.md', 'POINT_JEU_ET_STUDIO.md',
    'GESTION_FICHIERS_ET_SONS.md', 'ARCHITECTURE_MIROIR_MACHINE.md', 'VALIDATION_CLONE_REEL.md',
    'VALIDATION_LECTEUR_PROJET_EP133.md',
  ]);
  return translatedFiles.has(file) && language !== 'fr'
    ? file.replace('.md', `.${language}.md`)
    : file;
}

const ui = {
  fr: { back:'← ACCUEIL', center:'CENTRE DE DOCUMENTATION', badge:'OUTILS · MACHINE · FR', hero:'MAÎTRISER LE STUDIO.', hero2:'COMPRENDRE LA MACHINE.', lead:'Tous les guides de nos outils sont réunis ici, avec les procédures de connexion et les références de l’EP‑133.', tools:'NOS OUTILS', toolsSub:'Studio, clone, sons, MIDI et entraînement', machine:'LA MACHINE', machineSub:'Connexion, formats, projets et samples', official:'GUIDE OFFICIEL', officialSub:'Référence constructeur Teenage Engineering', software:'DOCUMENTATION DU LOGICIEL', softwareText:'Les procédures pratiques pour utiliser chaque module d’EP‑133 KO II Studio.', hardware:'DOCUMENTATION MATÉRIELLE', hardwareText:'Nos notes techniques et procédures vérifiées pour travailler avec la vraie machine.', guides:'GUIDES', open:'OUVRIR ↗', source:'SOURCE CONSTRUCTEUR', officialTitle:'GUIDE OFFICIEL EP‑133', sourceText:'La référence pour toutes les commandes et fonctions de la machine. Le manuel reste la propriété de Teenage Engineering et n’est pas redistribué par ce projet.', online:'GUIDE EN LIGNE ↗', downloads:'TÉLÉCHARGEMENTS ↗' },
  en: { back:'← HOME', center:'DOCUMENTATION CENTER', badge:'TOOLS · DEVICE · EN', hero:'MASTER THE STUDIO.', hero2:'UNDERSTAND THE DEVICE.', lead:'All guides for our tools are gathered here, together with connection procedures and EP‑133 references.', tools:'OUR TOOLS', toolsSub:'Studio, clone, sounds, MIDI and training', machine:'THE DEVICE', machineSub:'Connection, formats, projects and samples', official:'OFFICIAL GUIDE', officialSub:'Teenage Engineering manufacturer reference', software:'SOFTWARE DOCUMENTATION', softwareText:'Practical procedures for every EP‑133 KO II Studio module.', hardware:'DEVICE DOCUMENTATION', hardwareText:'Our technical notes and verified procedures for working with the real device.', guides:'GUIDES', open:'OPEN ↗', source:'MANUFACTURER SOURCE', officialTitle:'OFFICIAL EP‑133 GUIDE', sourceText:'The reference for all device controls and functions. The manual remains the property of Teenage Engineering and is not redistributed by this project.', online:'ONLINE GUIDE ↗', downloads:'DOWNLOADS ↗' },
  es: { back:'← INICIO', center:'CENTRO DE DOCUMENTACIÓN', badge:'HERRAMIENTAS · MÁQUINA · ES', hero:'DOMINAR EL STUDIO.', hero2:'COMPRENDER LA MÁQUINA.', lead:'Todas las guías de nuestras herramientas están reunidas aquí, junto con los procedimientos de conexión y las referencias del EP‑133.', tools:'NUESTRAS HERRAMIENTAS', toolsSub:'Studio, clon, sonidos, MIDI y entrenamiento', machine:'LA MÁQUINA', machineSub:'Conexión, formatos, proyectos y samples', official:'GUÍA OFICIAL', officialSub:'Referencia del fabricante Teenage Engineering', software:'DOCUMENTACIÓN DEL SOFTWARE', softwareText:'Procedimientos prácticos para cada módulo de EP‑133 KO II Studio.', hardware:'DOCUMENTACIÓN DE LA MÁQUINA', hardwareText:'Notas técnicas y procedimientos verificados para trabajar con la máquina real.', guides:'GUÍAS', open:'ABRIR ↗', source:'FUENTE DEL FABRICANTE', officialTitle:'GUÍA OFICIAL EP‑133', sourceText:'La referencia para todos los controles y funciones de la máquina. El manual pertenece a Teenage Engineering y este proyecto no lo redistribuye.', online:'GUÍA EN LÍNEA ↗', downloads:'DESCARGAS ↗' },
} as const;

function DocumentationLibrary({ eyebrow, title, description, links, start, guidesLabel, openLabel, language }: { eyebrow: string; title: string; description: string; links: DocLink[]; start: number; guidesLabel: string; openLabel: string; language: AppLanguage }) {
  return <section className="docs-library">
    <header><div><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div><span>{links.length} {guidesLabel}</span></header>
    <div>{links.map((guide, index) => <a href={`${REPO_DOCS}/${localizedGuideFile(guide.file, language)}`} target="_blank" rel="noreferrer" key={guide.file}>
      <b>{String(start + index).padStart(2, '0')}</b>
      <div><strong>{guide.title}</strong><p>{guide.description}</p>{guide.status && <em>{guide.status}</em>}</div>
      <span>{openLabel}</span>
    </a>)}</div>
  </section>;
}

interface DocumentationPageProps { onBack: () => void; }

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  // Lu directement dans le magasin partagé plutôt que reçu en prop — voir
  // core/store/languageStore.ts et docs/REGISTRE_IDEES.md R-08.
  const language = useLanguageStore((state) => state.language);
  const t = ui[language];
  return <main className="documentation-page">
    <header className="module-header docs-header"><button onClick={onBack}>{t.back}</button><div><small>MODULE 05</small><h1>{t.center}</h1></div><span className="ready">{t.badge}</span></header>

    <section className="docs-hero"><div><small>EP‑133 KO II STUDIO</small><h2>{t.hero}<br />{t.hero2}</h2><p>{t.lead}</p></div><div className="docs-device-diagram" aria-label="EP-133 diagram"><div className="docs-screen"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="docs-groups"><b>A</b><b>B</b><b>C</b><b>D</b></div><div className="docs-pad-mini">{['7','8','9','4','5','6','1','2','3','·','0','↵'].map((key) => <i key={key}>{key}</i>)}</div></div></section>

    <nav className="docs-index" aria-label="Documentation index"><a href="#outils"><b>01</b><span>{t.tools}<small>{t.toolsSub}</small></span></a><a href="#machine"><b>02</b><span>{t.machine}<small>{t.machineSub}</small></span></a><a href="#officiel"><b>03</b><span>{t.official}<small>{t.officialSub}</small></span></a></nav>

    <div id="outils"><DocumentationLibrary eyebrow={t.software} title={t.tools} description={t.softwareText} links={localizedGuides(toolGuides, language)} start={1} guidesLabel={t.guides} openLabel={t.open} language={language} /></div>
    <div id="machine"><DocumentationLibrary eyebrow={t.hardware} title="EP‑133 K.O. II" description={t.hardwareText} links={localizedGuides(machineGuides, language)} start={toolGuides.length + 1} guidesLabel={t.guides} openLabel={t.open} language={language} /></div>

    <section className="docs-sources" id="officiel"><div><small>{t.source}</small><h2>{t.officialTitle}</h2><p>{t.sourceText}</p></div><div className="docs-source-actions"><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">{t.online}</a><a className="secondary" href="https://teenage.engineering/downloads/ep-133" target="_blank" rel="noreferrer">{t.downloads}</a></div></section>
  </main>;
}
