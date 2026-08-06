import { useState, useRef, useEffect } from 'react'
import localforage from 'localforage'
import './App.css'

//ZAPNUTÍ COMMAND:
//cd frontend
//npm run dev
//pak kliknout na odkaz

// ==========================================
// 🧩 MODUL 1: LOSOVAČ ČÍSEL
// ==========================================
function ModulLosovac() {
  const [odCisla, setOdCisla] = useState(1)
  const [doCisla, setDoCisla] = useState(100)
  const [vysledek, setVysledek] = useState("?")
  const [chyba, setChyba] = useState("")

  const losovat = async () => {
    setChyba("")
    try {
      const response = await fetch(`/api/losovat?od=${odCisla}&do=${doCisla}`)
      const data = await response.json()
      if (data.chyba) { setChyba(data.chyba); setVysledek("!?") }
      else { setVysledek(data.vylosovano) }
    } catch (err) { setChyba("Výpadek spojení se serverem.") }
  }

  return (
    <div className="glass-panel" style={{ textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
      <h2 style={{ color: "#3b82f6" }}>🎲 Losovač čísel</h2>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", margin: "20px 0" }}>
        <input type="number" value={odCisla} onChange={(e) => setOdCisla(e.target.value)} style={{ width: "80px", textAlign: "center" }} />
        <span style={{ fontSize: "24px", color: "#94a3b8" }}>-</span>
        <input type="number" value={doCisla} onChange={(e) => setDoCisla(e.target.value)} style={{ width: "80px", textAlign: "center" }} />
      </div>
      <button onClick={losovat} style={{ width: "100%", padding: "15px", backgroundColor: "#3b82f6", color: "white", fontSize: "18px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
        LOSOVAT
      </button>
      <div style={{ marginTop: "30px", fontSize: "70px", fontWeight: "900", color: "#facc15", textShadow: "0 0 20px rgba(250, 204, 21, 0.4)" }}>
        {vysledek}
      </div>
      {chyba && <p style={{ color: "#ef4444", fontWeight: "bold" }}>{chyba}</p>}
    </div>
  )
}

// ==========================================
// 🧩 MODUL 2: ROZDĚLOVAČ TÝMŮ
// ==========================================
function ModulTymy() {
  const [jmena, setJmena] = useState("Adam\nBarča\nCyril\nDana\nEmil\nFranta")
  const [pocetTymu, setPocetTymu] = useState(2)
  const [vysledneTymy, setVysledneTymy] = useState([])
  const [chyba, setChyba] = useState("")

  const rozdelit = async () => {
    setChyba("")
    try {
      const response = await fetch("/api/rozdelit-tymy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seznam_jmen: jmena, pocet_tymu: parseInt(pocetTymu) })
      })
      const data = await response.json()
      if (data.chyba) setChyba(data.chyba)
      else setVysledneTymy(data.vysledne_tymy)
    } catch (err) { setChyba("Výpadek spojení se serverem.") }
  }

  return (
    <div className="glass-panel">
      <h2 style={{ color: "#22c55e", textAlign: "center", marginBottom: "20px" }}>👥 Rozdělovač týmů</h2>
      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>

        <div style={{ flex: "1 1 300px" }}>
          <label style={{ color: "#94a3b8", fontSize: "14px" }}>Jména (každé na nový řádek):</label>
          <textarea value={jmena} onChange={(e) => setJmena(e.target.value)} style={{ width: "100%", height: "200px", marginTop: "8px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px" }}>
            <label style={{ color: "#94a3b8" }}>Počet týmů:</label>
            <input type="number" min="1" max="10" value={pocetTymu} onChange={(e) => setPocetTymu(e.target.value)} style={{ width: "80px" }} />
          </div>
          <button onClick={rozdelit} style={{ width: "100%", padding: "15px", marginTop: "20px", backgroundColor: "#22c55e", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            ROZDĚLIT DO TÝMŮ
          </button>
          {chyba && <p style={{ color: "#ef4444", marginTop: "10px" }}>{chyba}</p>}
        </div>

        <div style={{ flex: "1 1 300px", backgroundColor: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "15px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#f8fafc" }}>Výsledek:</h3>
          {vysledneTymy.length === 0 ? <p style={{ color: "#64748b" }}>Zatím nerozděleno...</p> :
            vysledneTymy.map((tym, i) => (
              <div key={i} style={{ marginBottom: "15px", padding: "15px", backgroundColor: "#1e293b", borderLeft: "4px solid #22c55e", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#22c55e" }}>🏆 {tym.nazev_tymu} ({tym.pocet_clenu})</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {tym.clenove.map((clen, idx) => (
                    <span key={idx} style={{ backgroundColor: "#334155", padding: "4px 10px", borderRadius: "20px", fontSize: "14px" }}>{clen}</span>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 🧩 MODUL 3: TEXTY DO POWERPOINTU
// ==========================================
function ModulPrezentace() {
  const [interpret, setInterpret] = useState("")
  const [pisen, setPisen] = useState("")
  const [textPisne, setTextPisne] = useState("")
  const [maxRadku, setMaxRadku] = useState(4)
  const [status, setStatus] = useState("Připraveno")

  const najitText = async () => {
    setStatus("Hledám text na Genius.com... ⏳")
    try {
      const response = await fetch("/api/vyhledat-text", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interpret, pisen })
      })
      const data = await response.json()
      if (data.chyba) setStatus(`❌ ${data.chyba}`)
      else { setTextPisne(data.text); setStatus("✅ Nalezeno!") }
    } catch (err) { setStatus("❌ Chyba serveru.") }
  }

  const stahnout = async () => {
    if (!textPisne) return setStatus("❌ Chybí text!")
    setStatus("Generuji PowerPoint... ⏳")
    try {
      const response = await fetch("/api/vytvorit-prezentaci", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_pisne: textPisne, max_radku: parseInt(maxRadku) })
      })
      if (!response.ok) throw new Error()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${interpret || "prezentace"} - ${pisen || "text"}.pptx`
      a.click()
      window.URL.revokeObjectURL(url)
      setStatus("✅ Staženo!")
    } catch (err) { setStatus("❌ Chyba generování.") }
  }

  return (
    <div className="glass-panel">
      <h2 style={{ color: "#a855f7", textAlign: "center", marginBottom: "20px" }}>🎤 Texty do PowerPointu</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Interpret (např. Queen)" value={interpret} onChange={(e) => setInterpret(e.target.value)} style={{ flex: "1 1 200px" }} />
        <input type="text" placeholder="Název písně" value={pisen} onChange={(e) => setPisen(e.target.value)} style={{ flex: "1 1 200px" }} />
        <button onClick={najitText} style={{ padding: "12px 20px", backgroundColor: "#a855f7", color: "white", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>🔍 Najít</button>
      </div>
      <textarea value={textPisne} onChange={(e) => setTextPisne(e.target.value)} placeholder="Vlož text nebo použij vyhledávání nahoře..." style={{ width: "100%", height: "200px", marginBottom: "15px", boxSizing: "border-box" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ color: "#94a3b8" }}>Řádků na slide:</label>
          <input type="number" min="1" max="8" value={maxRadku} onChange={(e) => setMaxRadku(e.target.value)} style={{ width: "70px" }} />
        </div>
        <button onClick={stahnout} style={{ padding: "12px 25px", backgroundColor: "#ec4899", color: "white", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>💾 STÁHNOUT .PPTX</button>
      </div>
      <p style={{ textAlign: "center", color: status.includes("❌") ? "#ef4444" : "#94a3b8", marginTop: "15px" }}>{status}</p>
    </div>
  )
}

// ==========================================
// 🧩 MODUL 4: YOUTUBE DOWNLOADER
// ==========================================
function ModulYoutube() {
  const [url, setUrl] = useState("")
  const [rezim, setRezim] = useState("video")
  const [kvalita, setKvalita] = useState("1080")
  const [status, setStatus] = useState("Připraveno")

  const stahnout = async () => {
    if (!url) return setStatus("❌ Chybí odkaz!")
    setStatus("⏳ Zpracovávám (může to chvíli trvat)...")
    try {
      const response = await fetch("/api/stahnout-yt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, mode: rezim, kvalita: kvalita })
      })
      
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        if (data.chyba) return setStatus(`❌ ${data.chyba}`)
      }

      // Vytáhneme název souboru z hlavičky 'Content-Disposition'
      let nazevSouboru = `stazeno_z_youtube${rezim === "video" ? ".mp4" : ".mp3"}` // Záložní název
      const disposition = response.headers.get('Content-Disposition')
      
      if (disposition) {
        // Hledáme UTF-8 zakódovaný název (kvůli české diakritice)
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/)
        if (utf8Match && utf8Match[1]) {
          nazevSouboru = decodeURIComponent(utf8Match[1])
        } else {
          // Obyčejné hledání, pokud není název v UTF-8
          const normalMatch = disposition.match(/filename="?([^";]+)"?/)
          if (normalMatch && normalMatch[1]) {
            nazevSouboru = normalMatch[1]
          }
        }
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = nazevSouboru // <--- TADY POUŽIJEME SPRÁVNÝ NÁZEV OD SERVERU
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      setStatus("✅ Úspěšně staženo!")
    } catch (err) { 
      setStatus("❌ Výpadek spojení.") 
    }
  }

  return (
    <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#ef4444", textAlign: "center", marginBottom: "20px" }}>📹 YouTube Downloader</h2>
      <input type="text" placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%", boxSizing: "border-box", marginBottom: "20px" }} />

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: rezim === "video" ? "#fff" : "#64748b" }}>
          <input type="radio" value="video" checked={rezim === "video"} onChange={(e) => setRezim(e.target.value)} /> 🎬 Video (MP4)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: rezim === "audio" ? "#fff" : "#64748b" }}>
          <input type="radio" value="audio" checked={rezim === "audio"} onChange={(e) => setRezim(e.target.value)} /> 🎵 Audio (MP3)
        </label>
      </div>

      {rezim === "video" && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <select value={kvalita} onChange={(e) => setKvalita(e.target.value)} style={{ width: "100%" }}>
            <option value="1080">Kvalita: Limit 1080p (Rychlejší)</option>
            <option value="max">Kvalita: MAX 4K/8K (Pomalejší stahování)</option>
          </select>
        </div>
      )}

      <button onClick={stahnout} style={{ width: "100%", padding: "15px", backgroundColor: "#ef4444", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
        STÁHNOUT SOUBOR
      </button>
      <p style={{ textAlign: "center", color: status.includes("❌") ? "#ef4444" : "#94a3b8", marginTop: "15px" }}>{status}</p>
    </div>
  )
}

// ==========================================
// 🧩 MODUL 5: IMPOSTER GAME
// ==========================================
function ModulImposter() {
  // Fáze hry: "nastaveni", "predavani", "diskuze", "odhaleni"
  const [faze, setFaze] = useState("nastaveni")
  
  // Nastavení hry
  const [pocetHracu, setPocetHracu] = useState(5)
  const [pocetImposteru, setPocetImposteru] = useState(1)
  const [kategorie, setKategorie] = useState("jídlo")
  const [napoveda, setNapoveda] = useState(false)
  const [tajnyMod, setTajnyMod] = useState(false)
  
  // Data ze serveru a stav předávání
  const [hraci, setHraci] = useState([])
  const [aktualniHracIndex, setAktualniHracIndex] = useState(0)
  const [kartaOdhalena, setKartaOdhalena] = useState(false)
  const [chyba, setChyba] = useState("")

  const startHry = async () => {
    setChyba("")
    try {
      const response = await fetch("/api/imposter-losovat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pocet_hracu: parseInt(pocetHracu),
          pocet_imposteru: parseInt(pocetImposteru),
          kategorie: kategorie,
          zobrazit_napovedu: napoveda,
          tajny_mod: tajnyMod
        })
      })
      const data = await response.json()
      if (data.chyba) {
        setChyba(data.chyba)
      } else {
        setHraci(data.hraci)
        setAktualniHracIndex(0)
        setKartaOdhalena(false)
        setFaze("predavani") // Přepneme hru do režimu otáčení karet
      }
    } catch (err) { setChyba("Výpadek spojení se serverem.") }
  }

  // Funkce pro tlačítko "Skrýt a poslat"
  const dalsiHrac = () => {
    setKartaOdhalena(false) // Nejprve skryjeme kartu
    if (aktualniHracIndex + 1 < hraci.length) {
      // Jdeme na dalšího hráče
      setAktualniHracIndex(aktualniHracIndex + 1)
    } else {
      // Všichni už se podívali, jdeme na diskuzi
      setFaze("diskuze")
    }
  }

  // Restart celé hry
  const novaHra = () => {
    setHraci([])
    setFaze("nastaveni")
  }

  return (
    <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto", minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      
      {/* === FÁZE 1: NASTAVENÍ === */}
      {faze === "nastaveni" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          <h2 style={{ color: "#facc15", textAlign: "center", marginBottom: "20px" }}>🕵️ Imposter Game</h2>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: "1 1 150px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "5px" }}>Počet hráčů</label>
              <input type="number" min="3" value={pocetHracu} onChange={(e) => setPocetHracu(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "5px" }}>Počet impostorů</label>
              <input type="number" min="1" value={pocetImposteru} onChange={(e) => setPocetImposteru(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: "1 1 100%" }}>
              <label style={{ color: "#94a3b8", display: "block", marginBottom: "5px" }}>Kategorie</label>
              <select value={kategorie} onChange={(e) => setKategorie(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#1e293b", color: "#fff", border: "1px solid #334155" }}>
                <option value="škola">Škola</option>
                <option value="jídlo">Jídlo</option>
                <option value="sport">Sport</option>
                <option value="profese">Profese</option>
                <option value="zvířata">Zvířata</option>
                <option value="tábor">Tábor</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", color: "#e2e8f0" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" checked={tajnyMod} onChange={(e) => setTajnyMod(e.target.checked)} />
              <strong>Tajný mód:</strong> Impostor neví, že je impostor.
            </label>
            {!tajnyMod && (
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={napoveda} onChange={(e) => setNapoveda(e.target.checked)} />
                <strong>Nápověda:</strong> Ukázat impostorovi kategorii slova.
              </label>
            )}
          </div>

          <button onClick={startHry} style={{ width: "100%", padding: "15px", backgroundColor: "#facc15", color: "#000", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            ZAHÁJIT HRU
          </button>

          {chyba && <p style={{ color: "#ef4444", fontWeight: "bold", textAlign: "center", marginTop: "15px" }}>{chyba}</p>}
        </div>
      )}

      {/* === FÁZE 2: PŘEDÁVÁNÍ MOBILU (Otáčecí kartička) === */}
      {faze === "predavani" && hraci.length > 0 && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.3s" }}>
          
          <div style={{ backgroundColor: "#111827", borderRadius: "15px", padding: "40px 20px", minHeight: "250px", display: "flex", flexDirection: "column", justifyContent: "center", border: "1px solid #1f2937", marginBottom: "20px" }}>
            <h2 style={{ color: "#fff", fontSize: "28px", margin: "0 0 10px 0" }}>
              Hráč {hraci[aktualniHracIndex].hrac}
            </h2>

            {!kartaOdhalena ? (
              // SKRYTÝ STAV
              <p style={{ color: "#6b7280", margin: 0, fontSize: "16px" }}>Podávej zařízení. Až budeš připraven, klikni.</p>
            ) : (
              // ODHALENÝ STAV
              <div style={{ animation: "fadeIn 0.2s" }}>
                <p style={{ color: "#9ca3af", margin: "10px 0" }}>Tvoje slovo/role je:</p>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#facc15", textShadow: "0 0 10px rgba(250, 204, 21, 0.2)", margin: "10px 0" }}>
                  {hraci[aktualniHracIndex].data.slovo}
                </div>
                {hraci[aktualniHracIndex].data.role === "Impostor" && (
                  <p style={{ color: "#ef4444", fontWeight: "bold", fontSize: "14px" }}>Tip: Chovej se nenápadně 👀</p>
                )}
              </div>
            )}
          </div>

          {!kartaOdhalena ? (
             <button onClick={() => setKartaOdhalena(true)} style={{ width: "100%", padding: "18px", backgroundColor: "#22c55e", color: "white", fontSize: "18px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
               ZOBRAZIT MOJE SLOVO
             </button>
          ) : (
             <button onClick={dalsiHrac} style={{ width: "100%", padding: "18px", backgroundColor: "#ef4444", color: "white", fontSize: "18px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
               SKRÝT A POSLAT DÁL
             </button>
          )}
        </div>
      )}

      {/* === FÁZE 3: DISKUZE === */}
      {faze === "diskuze" && (
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s" }}>
          <h1 style={{ fontSize: "40px", color: "#fff", margin: "0 0 10px 0" }}>Čas na nápovědy!</h1>
          <p style={{ color: "#9ca3af", fontSize: "18px", lineHeight: "1.5", marginBottom: "30px" }}>
            Každý hráč postupně řekne 1 slovo, které souvisí s tajným slovem.<br/>
            Nebuďte příliš konkrétní... Impostor vás poslouchá 👀.
          </p>
          
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={() => setFaze("odhaleni")} style={{ flex: 1, padding: "15px", backgroundColor: "#3b82f6", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
              UKÁZAT VÝSLEDKY
            </button>
          </div>
        </div>
      )}

      {/* === FÁZE 4: ODHALENÍ (Konec hry) === */}
      {faze === "odhaleni" && (
        <div style={{ animation: "fadeIn 0.3s" }}>
          <h2 style={{ color: "#ef4444", textAlign: "center", marginBottom: "20px" }}>Kdo byl kdo?</h2>
          <div style={{ backgroundColor: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
             {hraci.map(h => (
               <div key={h.hrac} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #334155" }}>
                 <strong style={{ color: "#fff" }}>Hráč {h.hrac}</strong>
                 <span style={{ color: h.data.role.includes("Impostor") ? "#ef4444" : "#22c55e" }}>
                   {h.data.role} ({h.data.slovo})
                 </span>
               </div>
             ))}
          </div>
          <button onClick={novaHra} style={{ width: "100%", padding: "15px", backgroundColor: "#64748b", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            HRÁT ZNOVU
          </button>
        </div>
      )}

    </div>
  )
}

// ==========================================
// 🧩 MODUL 6: SOUNDBOARD (UPGRADE - Pevná velikost & Databáze)
// ==========================================
function ModulSoundboard() {
  const getInitialGrid = () => {
    const grid = Array(24).fill(null).map(() => ({
      url: null, fileBlob: null, name: "Prázdné", color: "#334155", start: 0, end: 0, playing: false
    }));

    // Seznam všech pevných zvuků ze složky public/zvuky
    const predpripraveneZvuky = [
      { file: "circus.mp3", name: "Cirkus", color: "#eab308" },           // Žlutá
      { file: "crickets.mp3", name: "Cvrčci", color: "#22c55e" },         // Zelená
      { file: "crowd_clapping.mp3", name: "Potlesk", color: "#3b82f6" },  // Modrá
      { file: "error.mp3", name: "Error", color: "#ef4444" },             // Červená
      { file: "fah.mp3", name: "Fah", color: "#a855f7" },                 // Fialová
      { file: "incorrect.mp3", name: "Špatně", color: "#ef4444" },        // Červená
      { file: "iphone_ringtone.mp3", name: "iPhone Zvonění", color: "#3b82f6" }, // Modrá
      { file: "iphone_text.mp3", name: "iPhone SMS", color: "#3b82f6" },  // Modrá
      { file: "love_song.mp3", name: "Love Song", color: "#ef4444" },     // Červená
      { file: "meaw.MP3", name: "Mňau", color: "#eab308" },               // Žlutá
      { file: "rick_roll.mp3", name: "Rick Roll", color: "#a855f7" },     // Fialová
      { file: "rizzt.mp3", name: "Rizzt", color: "#22c55e" },             // Zelená
      { file: "run.mp3", name: "Run!", color: "#ef4444" },                // Červená
      { file: "sad_violin.mp3", name: "Sad Violin", color: "#3b82f6" },   // Modrá
      { file: "titanic.mp3", name: "Titanic", color: "#3b82f6" },         // Modrá
      { file: "wah_wah_wahwah.mp3", name: "Wah Wah...", color: "#ef4444" },// Červená
      { file: "zvonek.mp3", name: "Zvonek", color: "#eab308" }            // Žlutá
    ];

    // Automatické naplnění mřížky
    predpripraveneZvuky.forEach((zvuk, index) => {
      if (index < 24) { // Pojistka, aby to nepřeteklo přes tvých 24 tlačítek
        grid[index] = {
          url: `/zvuky/${zvuk.file}`,
          fileBlob: null,
          name: zvuk.name,
          color: zvuk.color,
          start: 0,
          end: 0,
          playing: false
        };
      }
    });

    return grid;
  };

  const [tlacitka, setTlacitka] = useState(getInitialGrid);
  const [nacteno, setNacteno] = useState(false); // Hlídá, jestli už se data načetla z paměti prohlížeče

  const audioRefs = useRef(Array(24).fill(null));
  const timeoutRefs = useRef(Array(24).fill(null));
  const [editIndex, setEditIndex] = useState(null);

  const paletaBarev = [
    { nazev: "Fialová", hex: "#a855f7" }, { nazev: "Modrá", hex: "#3b82f6" }, { nazev: "Zelená", hex: "#22c55e" },
    { nazev: "Červená", hex: "#ef4444" }, { nazev: "Žlutá", hex: "#eab308" }, { nazev: "Tmavá", hex: "#334155" }
  ];

  // 1. NAČTENÍ DAT PO ZAPNUTÍ WEBU
  useEffect(() => {
    localforage.getItem('soundboard_data').then((ulozenaData) => {
      if (ulozenaData) {
        // Obnovíme dočasné URL adresy pro soubory, které jsme uložili
        const obnovenaTlacitka = ulozenaData.map((btn, index) => {
          // První tlačítko je pevné ze serveru, to nepřepisujeme, pokud není v datech změněno uživatelem
          if (btn.fileBlob) {
            return { ...btn, url: URL.createObjectURL(btn.fileBlob), playing: false };
          }
          return { ...btn, playing: false };
        });
        setTlacitka(obnovenaTlacitka);
      }
      setNacteno(true);
    });
  }, []);

  // 2. ULOŽENÍ DAT PŘI KAŽDÉ ZMĚNĚ
  useEffect(() => {
    if (nacteno) {
      // Před uložením vyčistíme 'url', protože Blob URL v databázi nepřežije. Ukládáme jen 'fileBlob'.
      const kUlozeni = tlacitka.map(({ url, playing, ...zbytek }) => zbytek);
      localforage.setItem('soundboard_data', kUlozeni);
    }
  }, [tlacitka, nacteno]);

  const nahratSoubor = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const novaTlacitka = [...tlacitka];
      novaTlacitka[index] = {
        ...novaTlacitka[index],
        url: fileUrl,
        fileBlob: file, // Zde ukládáme samotný soubor do stavu (a následně do databáze)
        name: file.name.replace(/\.[^/.]+$/, "").substring(0, 15),
        color: "#a855f7",
        start: 0, end: 0
      };
      setTlacitka(novaTlacitka);
    }
  };

  const prehraj = (index) => {
    const btn = tlacitka[index];
    if (!btn.url) return;
    zastav(index);

    const audio = new Audio(btn.url);
    audio.currentTime = btn.start;

    const novaTlacitka = [...tlacitka];
    novaTlacitka[index].playing = true;
    setTlacitka(novaTlacitka);

    audio.play();
    audioRefs.current[index] = audio;
    audio.onended = () => zastav(index);

    if (btn.end > btn.start) {
      timeoutRefs.current[index] = setTimeout(() => zastav(index), (btn.end - btn.start) * 1000);
    }
  };

  const zastav = (index) => {
    if (audioRefs.current[index]) {
      audioRefs.current[index].pause();
      audioRefs.current[index].currentTime = 0;
      audioRefs.current[index] = null;
    }
    if (timeoutRefs.current[index]) {
      clearTimeout(timeoutRefs.current[index]);
      timeoutRefs.current[index] = null;
    }
    setTlacitka(prev => {
      const nova = [...prev];
      nova[index] = { ...nova[index], playing: false };
      return nova;
    });
  };

  const stopAll = () => tlacitka.forEach((_, index) => zastav(index));

  const ulozitNastaveni = (index, newData) => {
    const novaTlacitka = [...tlacitka];
    novaTlacitka[index] = { ...novaTlacitka[index], ...newData };
    setTlacitka(novaTlacitka);
    setEditIndex(null);
  };

  // --- MENU ÚPRAVY ---
  if (editIndex !== null) {
    const btn = tlacitka[editIndex];
    return (
      <div className="glass-panel" style={{ maxWidth: "500px", margin: "0 auto", animation: "fadeIn 0.2s" }}>
        <h2 style={{ color: btn.color, textAlign: "center", marginBottom: "20px" }}>⚙️ Nastavení tlačítka</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ color: "#9ca3af", fontSize: "14px" }}>Název:</label>
            <input type="text" defaultValue={btn.name} id="editName" style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ color: "#9ca3af", fontSize: "14px" }}>Barva:</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
              {paletaBarev.map(c => (
                <button key={c.hex} onClick={() => ulozitNastaveni(editIndex, { color: c.hex, name: document.getElementById("editName").value })}
                  style={{ width: "40px", height: "40px", backgroundColor: c.hex, borderRadius: "50%", border: btn.color === c.hex ? "3px solid white" : "none", cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#9ca3af", fontSize: "14px" }}>Start (s):</label>
              <input type="number" min="0" defaultValue={btn.start} id="editStart" style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#9ca3af", fontSize: "14px" }}>Konec (s):</label>
              <input type="number" min="0" defaultValue={btn.end} id="editEnd" style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={() => setEditIndex(null)} style={{ flex: 1, padding: "12px", backgroundColor: "#334155", color: "white", borderRadius: "8px", border: "none" }}>Zrušit</button>
            <button onClick={() => ulozitNastaveni(editIndex, { name: document.getElementById("editName").value, start: parseFloat(document.getElementById("editStart").value) || 0, end: parseFloat(document.getElementById("editEnd").value) || 0 })} style={{ flex: 2, padding: "12px", backgroundColor: "#22c55e", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold" }}>Uložit změny</button>
          </div>
        </div>
      </div>
    );
  }

  // --- VYKRESLENÍ MŘÍŽKY (OPRAVA ROZLOŽENÍ) ---
  return (
    <div className="glass-panel" style={{ width: "100%", margin: "0 auto", overflowX: "auto" }}>
      <h2 style={{ color: "#a855f7", textAlign: "center", marginBottom: "20px" }}>🎛️ Soundboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 140px)", gap: "12px", justifyContent: "center", minWidth: "1200px", marginBottom: "20px" }}>
        {tlacitka.map((btn, index) => (
          <div key={index} style={{
            width: "140px",      // Pevná šířka
            height: "150px",     // Pevná výška
            boxSizing: "border-box", // Zabrání nafouknutí přes padding
            backgroundColor: btn.playing ? `${btn.color}40` : (btn.url ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.2)"),
            border: `2px solid ${btn.url ? btn.color : "#334155"}`,
            borderRadius: "12px", padding: "12px", textAlign: "center",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            boxShadow: btn.playing ? `0 0 15px ${btn.color}80` : "none", transition: "all 0.2s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <strong style={{ color: "#fff", fontSize: "14px", wordWrap: "break-word", textAlign: "left", flex: 1 }}>{btn.name}</strong>
              {btn.url && (
                <button onClick={() => setEditIndex(index)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "0 0 0 5px" }}>⚙️</button>
              )}
            </div>

            {!btn.url ? (
              <label style={{ cursor: "pointer", padding: "8px", backgroundColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#9ca3af" }}>
                📂 Vybrat MP3
                <input type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => nahratSoubor(index, e)} />
              </label>
            ) : (
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => prehraj(index)} style={{ flex: 2, padding: "8px", backgroundColor: btn.color, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>▶ PLAY</button>
                <button onClick={() => zastav(index)} style={{ flex: 1, padding: "8px", backgroundColor: "#1e293b", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>🛑</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={stopAll} style={{ width: "100%", padding: "15px", backgroundColor: "#ef4444", color: "white", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer" }}>🛑 STOP ALL</button>
    </div>
  );
}

// ==========================================
// 📺 HLAVNÍ APLIKACE (Zastřešuje vše)
// ==========================================
function App() {
  const [aktivni, setAktivni] = useState("losovac")

  // Tlačítko pro menu (abychom nepsali styl 4x)
  const MenuBtn = ({ id, ikona, text, barva }) => (
    <button
      onClick={() => setAktivni(id)}
      style={{
        padding: "12px 20px", fontWeight: "bold", color: "white", border: "none", borderRadius: "12px", cursor: "pointer",
        backgroundColor: aktivni === id ? barva : "rgba(255,255,255,0.05)",
        boxShadow: aktivni === id ? `0 0 15px ${barva}80` : "none",
      }}>
      {ikona} {text}
    </button>
  )

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "40px 20px" }}>

      {/* HLAVIČKA */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", margin: "0 0 10px 0", letterSpacing: "1px" }}>🏕️ YLeventdeck <span style={{ color: "#3b82f6" }}>demo</span></h1>
        <p style={{ color: "#94a3b8", margin: 0 }}>Všechny táborové nástroje na jednom místě.</p>
      </div>

      {/* NAVIGACE */}
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px", flexWrap: "wrap" }}>
        <MenuBtn id="losovac" ikona="🎲" text="Losovač" barva="#3b82f6" />
        <MenuBtn id="tymy" ikona="👥" text="Týmy" barva="#22c55e" />
        <MenuBtn id="prezentace" ikona="🎤" text="Prezentace" barva="#a855f7" />
        <MenuBtn id="youtube" ikona="📹" text="YouTube" barva="#ef4444" />
        <MenuBtn id="imposter" ikona="🕵️" text="Imposter" barva="#facc15" />
        <MenuBtn id="soundboard" ikona="🎛️" text="Soundboard" barva="#ff751f" />
      </div>

      {/* ZOBRAZENÍ VYBRANÉHO MODULU */}
      <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
        {aktivni === "losovac" && <ModulLosovac />}
        {aktivni === "tymy" && <ModulTymy />}
        {aktivni === "prezentace" && <ModulPrezentace />}
        {aktivni === "youtube" && <ModulYoutube />}
        {aktivni === "imposter" && <ModulImposter />}
      </div>

      {/* SOUNDBOARD: Je tu pořád, jen ho CSSkem schováme/ukážeme, aby se nevymazala paměť! */}
      <div style={{ display: aktivni === "soundboard" ? "block" : "none", animation: "fadeIn 0.3s ease-in-out" }}>
          <ModulSoundboard />
      </div>
    </div>
  )
}

export default App
