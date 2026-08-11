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

function DocumentationLibrary({ eyebrow, title, description, links, start }: { eyebrow: string; title: string; description: string; links: DocLink[]; start: number }) {
  return <section className="docs-library">
    <header><div><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></div><span>{links.length} GUIDES</span></header>
    <div>{links.map((guide, index) => <a href={`${REPO_DOCS}/${guide.file}`} target="_blank" rel="noreferrer" key={guide.file}>
      <b>{String(start + index).padStart(2, '0')}</b>
      <div><strong>{guide.title}</strong><p>{guide.description}</p>{guide.status && <em>{guide.status}</em>}</div>
      <span>OUVRIR ↗</span>
    </a>)}</div>
  </section>;
}

interface DocumentationPageProps { onBack: () => void; }

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  return <main className="documentation-page">
    <header className="module-header docs-header"><button onClick={onBack}>← ACCUEIL</button><div><small>MODULE 05</small><h1>CENTRE DE DOCUMENTATION</h1></div><span className="ready">OUTILS · MACHINE · FR</span></header>

    <section className="docs-hero"><div><small>EP‑133 KO II STUDIO</small><h2>MAÎTRISER LE STUDIO.<br />COMPRENDRE LA MACHINE.</h2><p>Tous les guides de nos outils sont réunis ici, avec les procédures de connexion et les références de l’EP‑133.</p></div><div className="docs-device-diagram" aria-label="Schéma original des quatre groupes et douze pads"><div className="docs-screen"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="docs-groups"><b>A</b><b>B</b><b>C</b><b>D</b></div><div className="docs-pad-mini">{['7','8','9','4','5','6','1','2','3','·','0','↵'].map((key) => <i key={key}>{key}</i>)}</div></div></section>

    <nav className="docs-index" aria-label="Sommaire de la documentation"><a href="#outils"><b>01</b><span>NOS OUTILS<small>Studio, clone, sons, MIDI et entraînement</small></span></a><a href="#machine"><b>02</b><span>LA MACHINE<small>Connexion, formats, projets et samples</small></span></a><a href="#officiel"><b>03</b><span>GUIDE OFFICIEL<small>Référence constructeur Teenage Engineering</small></span></a></nav>

    <div id="outils"><DocumentationLibrary eyebrow="DOCUMENTATION DU LOGICIEL" title="NOS OUTILS" description="Les procédures pratiques pour utiliser chaque module d’EP‑133 KO II Studio." links={toolGuides} start={1} /></div>
    <div id="machine"><DocumentationLibrary eyebrow="DOCUMENTATION MATÉRIELLE" title="EP‑133 K.O. II" description="Nos notes techniques et procédures vérifiées pour travailler avec la vraie machine." links={machineGuides} start={toolGuides.length + 1} /></div>

    <section className="docs-sources" id="officiel"><div><small>SOURCE CONSTRUCTEUR</small><h2>GUIDE OFFICIEL EP‑133</h2><p>La référence pour toutes les commandes et fonctions de la machine. Les illustrations et le manuel restent la propriété de Teenage Engineering et ne sont pas redistribués par ce projet.</p></div><div className="docs-source-actions"><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">GUIDE EN LIGNE ↗</a><a className="secondary" href="https://teenage.engineering/downloads/ep-133" target="_blank" rel="noreferrer">TÉLÉCHARGEMENTS ↗</a></div></section>
  </main>;
}
