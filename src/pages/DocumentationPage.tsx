const REPO_DOCS = 'https://github.com/propann/ep133-ko-ii-studio/blob/main/docs';

const guides = [
  ['PRISE EN MAIN', 'LANCEMENT_LOCAL.md', 'Installer, lancer et connecter le EP‑133.'],
  ['MIDI', 'CONNEXION_ET_CALIBRATION_MIDI.md', 'Diagnostic, mapping officiel et résolution des problèmes.'],
  ['STUDIO', 'MODELE_DONNEES_PROJET.md', 'Notes, groupes, vélocités, durées et formats.'],
  ['FICHIERS', 'DECISION_FORMATS_PROJET.md', 'Choix .pak/.ppak, MIDI et représentation technique.'],
  ['SÉCURITÉ', 'VALIDATION_LECTEUR_PROJET_EP133.md', 'Lecture seule et validation sur la machine réelle.'],
  ['DÉVELOPPEMENT', 'ETAT_DU_PROJET.md', 'Fonctions disponibles, limites et prochaine étape.'],
] as const;

interface DocumentationPageProps { onBack: () => void; }

export function DocumentationPage({ onBack }: DocumentationPageProps) {
  return <main className="documentation-page">
    <header className="module-header docs-header"><button onClick={onBack}>← ACCUEIL</button><div><small>MODULE 04</small><h1>DOCUMENTATION EP‑133</h1></div><span className="ready">FR · LOCAL · VÉRIFIÉ</span></header>

    <section className="docs-hero"><div><small>EP‑133 KO II STUDIO</small><h2>APPRENDRE LA MACHINE.<br />COMPRENDRE L’OUTIL.</h2><p>Une documentation française construite à partir des essais réels, du guide officiel et des formats vérifiés.</p></div><div className="docs-device-diagram" aria-label="Schéma original des quatre groupes et douze pads"><div className="docs-screen"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="docs-groups"><b>A</b><b>B</b><b>C</b><b>D</b></div><div className="docs-pad-mini">{['7','8','9','4','5','6','1','2','3','·','0','↵'].map((key) => <i key={key}>{key}</i>)}</div></div></section>

    <section className="docs-conventions"><article><span>PRESS</span><div className="docs-key">MAIN</div><p>Appui bref : déclencher une action.</p></article><article><span>HOLD!</span><div className="docs-combo"><div className="docs-key gray">SHIFT</div><b>＋</b><div className="docs-key">PAD</div></div><p>Maintenir : ouvrir une fonction secondaire.</p></article><article><span>SLIDE ↕</span><div className="docs-fader"><i /></div><p>Glisser : modifier une valeur continue.</p></article></section>

    <section className="docs-library"><header><div><small>BIBLIOTHÈQUE</small><h2>GUIDES DU PROJET</h2></div><span>{guides.length} DOCUMENTS ESSENTIELS</span></header><div>{guides.map(([title, file, description], index) => <a href={`${REPO_DOCS}/${file}`} target="_blank" rel="noreferrer" key={file}><b>{String(index + 1).padStart(2, '0')}</b><div><strong>{title}</strong><p>{description}</p></div><span>OUVRIR ↗</span></a>)}</div></section>

    <section className="docs-sources"><div><small>SOURCE CONSTRUCTEUR</small><h2>GUIDE OFFICIEL EP‑133</h2><p>La référence pour les commandes et fonctions de la machine. Les illustrations et le manuel restent la propriété de Teenage Engineering et ne sont pas redistribués par ce projet.</p></div><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">CONSULTER LE GUIDE OFFICIEL ↗</a></section>
  </main>;
}
