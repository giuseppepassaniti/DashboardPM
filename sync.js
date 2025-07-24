
// 📦 Librerie richieste
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// 🔐 Variabili di ambiente
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// 📁 Cartella di destinazione
const outputDir = path.join(__dirname, "src", "data");

// 📄 Tabelle da sincronizzare
const tables = [
  { name: "progetti", airtableTable: "Progetti" },
  { name: "milestone", airtableTable: "Milestone" },
  { name: "task", airtableTable: "Task" },
  { name: "imprevisti", airtableTable: "Imprevisti" },
  { name: "varianti", airtableTable: "Varianti" },
  { name: "decisioni", airtableTable: "Decision Log" }
];

// 🧠 Funzione per scaricare i dati di una tabella
async function fetchTable(tableName) {
  const url = `${baseUrl}/${encodeURIComponent(tableName)}?pageSize=100`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Errore nel recupero della tabella ${tableName}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records.map((r) => ({ id: r.id, ...r.fields }));
}

// 🚀 Funzione principale
async function syncAll() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const { name, airtableTable } of tables) {
    try {
      console.log(`⏳ Sincronizzazione tabella: ${airtableTable}`);
      const records = await fetchTable(airtableTable);
      fs.writeFileSync(
        path.join(outputDir, `${name}.json`),
        JSON.stringify(records, null, 2)
      );
      console.log(`✅ ${name}.json aggiornato (${records.length} record)`);
    } catch (err) {
      console.error(`❌ Errore con ${airtableTable}:`, err.message);
    }
  }
}

syncAll();
