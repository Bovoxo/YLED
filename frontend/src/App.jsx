import { useState } from 'react'
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
      const response = await fetch(`http://127.0.0.1:8000/api/losovat?od=${odCisla}&do=${doCisla}`)
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
      const response = await fetch("http://127.0.0.1:8000/api/rozdelit-tymy", {
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
      const response = await fetch("http://127.0.0.1:8000/api/vyhledat-text", {
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
      const response = await fetch("http://127.0.0.1:8000/api/vytvorit-prezentaci", {
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
      const response = await fetch("http://127.0.0.1:8000/api/stahnout-yt", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, mode: rezim, kvalita: kvalita })
      })
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        if (data.chyba) return setStatus(`❌ ${data.chyba}`)
      }
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `stazeno_z_youtube${rezim === "video" ? ".mp4" : ".mp3"}`
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      setStatus("✅ Úspěšně staženo!")
    } catch (err) { setStatus("❌ Výpadek spojení.") }
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
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>

      {/* HLAVIČKA */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", margin: "0 0 10px 0", letterSpacing: "1px" }}>🏕️ Camp Manager <span style={{ color: "#3b82f6" }}>ULTRA</span></h1>
        <p style={{ color: "#94a3b8", margin: 0 }}>Všechny táborové nástroje na jednom místě.</p>
      </div>

      {/* NAVIGACE */}
      <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "40px", flexWrap: "wrap" }}>
        <MenuBtn id="losovac" ikona="🎲" text="Losovač" barva="#3b82f6" />
        <MenuBtn id="tymy" ikona="👥" text="Týmy" barva="#22c55e" />
        <MenuBtn id="prezentace" ikona="🎤" text="Prezentace" barva="#a855f7" />
        <MenuBtn id="youtube" ikona="📹" text="YouTube" barva="#ef4444" />
      </div>

      {/* ZOBRAZENÍ VYBRANÉHO MODULU */}
      <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
        {aktivni === "losovac" && <ModulLosovac />}
        {aktivni === "tymy" && <ModulTymy />}
        {aktivni === "prezentace" && <ModulPrezentace />}
        {aktivni === "youtube" && <ModulYoutube />}
      </div>

    </div>
  )
}

export default App