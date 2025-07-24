// Importiamo le librerie necessarie
const Airtable = require('airtable');
const fs = require('fs'); // File System: per scrivere i file
const path = require('path'); // Per gestire i percorsi dei file in modo corretto

// La libreria 'dotenv' carica le variabili d'ambiente da un file .env
// Questo ci permette di tenere la API Key segreta e non scriverla nel codice
require('dotenv').config();

// --- 1. CONFIGURAZIONE ---

// Recuperiamo le credenziali dalle variabili d'ambiente
// Su GitHub, queste verranno impostate come "Secrets"
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'app8nc9CNkto8h9zu'; // L'ID della tua base Airtable

// Controlliamo che la API Key sia stata impostata
if (!AIRTABLE_API_KEY) {
  console.error('Errore: La variabile AIRTABLE_API_KEY non è stata definita.');
  console.error('Crea un file .env e aggiungi la tua API Key, o impostala come Secret su GitHub.');
  process.exit(1); // Interrompe lo script se la chiave non è presente
}

// Inizializziamo la connessione ad Airtable
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

// Definiamo le tabelle che vogliamo scaricare e come chiamare i file di output
const TABLES_TO_SYNC = [
  { airtableName: 'Progetti', outputName: 'progetti.json' },
  { airtableName: 'Milestone', outputName: 'milestone.json' },
  { airtableName: 'Task', outputName: 'task.json' },
  { airtableName: 'Imprevisti', outputName: 'imprevisti.json' },
  { airtableName: 'Varianti', outputName: 'varianti.json' },
  { airtableName: 'Decision Log', outputName: 'decisioni.json' },
  // Nota: ho escluso 'Time Log' e 'Risorse' come da tua struttura, ma puoi aggiungerle qui se servono
];

// Definiamo la cartella di destinazione per i file JSON
const OUTPUT_DIR = path.join(__dirname, 'src', 'data');

// --- 2. FUNZIONE DI FETCH ---

/**
 * Scarica tutti i record da una specifica tabella di Airtable.
 * Gestisce automaticamente la paginazione (se hai più di 100 record).
 * @param {string} tableName Il nome della tabella su Airtable.
 * @returns {Promise<Array<object>>} Un array di oggetti, dove ogni oggetto contiene i campi di un record.
 */
async function fetchTable(tableName) {
  console.log(`⏳ Inizio download dati da "${tableName}"...`);
  const records = [];
  try {
    const allRecords = await base(tableName).select().all();
    allRecords.forEach(record => {
      // Estraiamo solo i campi ('fields') di ogni record, che sono i dati che ci interessano
      records.push(record.fields);
    });
    console.log(`✅ Dati da "${tableName}" scaricati con successo (${records.length} record).`);
    return records;
  } catch (error) {
    console.error(`❌ Errore durante il download dalla tabella "${tableName}":`, error);
    throw error; // Rilancia l'errore per fermare il processo
  }
}

// --- 3. FUNZIONE PRINCIPALE DI SINCRONIZZAZIONE ---

async function syncAllTables() {
  console.log('🚀 Avvio sincronizzazione dati da Airtable...');

  // Assicuriamoci che la cartella di destinazione esista, altrimenti la creiamo
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Creata cartella di destinazione: ${OUTPUT_DIR}`);
  }

  // Eseguiamo il download per ogni tabella definita nella configurazione
  for (const tableConfig of TABLES_TO_SYNC) {
    try {
      const data = await fetchTable(tableConfig.airtableName);
      const outputPath = path.join(OUTPUT_DIR, tableConfig.outputName);
      
      // Scriviamo i dati scaricati nel file JSON corrispondente
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2)); // 'null, 2' formatta il JSON per essere leggibile
      console.log(`💾 File salvato: ${outputPath}`);
    } catch (error) {
      console.error(`🛑 Sincronizzazione fallita per la tabella "${tableConfig.airtableName}". Interruzione del processo.`);
      process.exit(1);
    }
  }

  console.log('🎉 Sincronizzazione completata con successo!');
}

// --- 4. ESECUZIONE DELLO SCRIPT ---
syncAllTables();
