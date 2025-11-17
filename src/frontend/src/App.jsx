import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [data, setData] = useState({ translations: {}, allKeys: [], mainLang: "en" });
  const [local, setLocal] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState({ type: "key", reverse: false }); // type: "key" or lang code
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/translations")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLocal(JSON.parse(JSON.stringify(d.translations || {})));
      });
  }, []);

  const languages = useMemo(() => {
    const langs = Object.keys(local);
    if (!langs.includes(data.mainLang) && data.mainLang) langs.unshift(data.mainLang);
    langs.sort((a,b) => (a === data.mainLang ? -1 : b === data.mainLang ? 1 : a.localeCompare(b)));
    return langs;
  }, [local, data.mainLang]);

  const keys = useMemo(() => {
    let all = data.allKeys || [];
    if (filter) {
      const f = filter.toLowerCase();
      all = all.filter(k => k.toLowerCase().includes(f) || languages.some(l => (local[l]?.[k] || "").toLowerCase().includes(f)));
    }

    // Sorting
    if (sortBy.type === "key") {
      all.sort((a,b) => sortBy.reverse ? b.localeCompare(a) : a.localeCompare(b));
    } else if (languages.includes(sortBy.type)) {
      all.sort((a,b) => {
        const va = (local[sortBy.type]?.[a] || "").toLowerCase();
        const vb = (local[sortBy.type]?.[b] || "").toLowerCase();
        return sortBy.reverse ? vb.localeCompare(va) : va.localeCompare(vb);
      });
    }
    return all;
  }, [data.allKeys, filter, local, languages, sortBy]);

  const onChange = (lang,key,val) => {
    setLocal(prev => ({ ...prev, [lang]: { ...(prev[lang]||{}), [key]: val } }));
    setDirty(prev => new Set(prev).add(`${lang}||${key}`));
  };

  const saveAll = async () => {
    setSaving(true);
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations: local })
    });
    setDirty(new Set());
    setSaving(false);
    alert("Saved");
  };

  const onHeaderClick = (type) => {
    setSortBy(prev => ({
      type,
      reverse: prev.type === type ? !prev.reverse : false
    }));
  };

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif", background:"#f0f2f5", minHeight:"100vh" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", background:"white", padding:24, borderRadius:12, boxShadow:"0 12px 30px rgba(0,0,0,0.1)"}}>
        <h1 style={{ margin:0, marginBottom:16, color:"#1f2937" }}>Translation Editor</h1>

        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16 }}>
          <input 
            placeholder="Search keys or values"
            value={filter}
            onChange={e=>setFilter(e.target.value)}
            style={{
              flex:1,
              padding:10,
              borderRadius:8,
              border:"1px solid #d1d5db",
              outline:"none",
              fontSize:14
            }}
          />
        </div>

        <div style={{ overflowX:"auto", maxHeight:"70vh", position:"relative", border:"1px solid #e5e7eb", borderRadius:8 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ position:"sticky", top:0, background:"#f9fafb", zIndex:2 }}>
              <tr>
                <th style={thStyle} onClick={()=>onHeaderClick("key")}>
                  Key {sortBy.type==="key" ? (sortBy.reverse ? "↓" : "↑") : ""}
                </th>
                {languages.map(lang => (
                  <th key={lang} style={thStyle} onClick={()=>onHeaderClick(lang)}>
                    {lang} {sortBy.type===lang ? (sortBy.reverse ? "↓" : "↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key, idx) => (
                <tr key={key} style={{ background: idx % 2 === 0 ? "#ffffff" : "#fefefe", transition:"background 0.2s" }}>
                  <td style={{...tdStyle, fontFamily:"monospace", width:220}}>{key}</td>
                  {languages.map(lang => {
                    const value = (local[lang] && local[lang][key]) || "";
                    const isDirty = dirty.has(`${lang}||${key}`);
                    return (
                      <td key={lang} style={{...tdStyle, background: isDirty ? "#fff7e6" : "transparent"}}>
                        <input 
                          value={value} 
                          onChange={e=>onChange(lang,key,e.target.value)}
                          style={{
                            width:"100%",
                            border:"none",
                            padding:8,
                            background: isDirty ? "#fffbeb" : "transparent",
                            borderRadius:4,
                            transition:"background 0.2s"
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot style={{ position:"sticky", bottom:0, background:"#f9fafb", zIndex:2 }}>
              <tr>
                <td colSpan={languages.length+1} style={{ padding:12, textAlign:"right", borderTop:"1px solid #e5e7eb" }}>
                  {dirty.size} unsaved changes
                  <button 
                    onClick={saveAll} 
                    disabled={dirty.size===0 || saving}
                    style={{
                      marginLeft:12,
                      padding:"8px 16px",
                      background:"#2563eb",
                      color:"white",
                      border:"none",
                      borderRadius:8,
                      cursor: dirty.size===0 ? "not-allowed" : "pointer",
                      transition:"background 0.2s"
                    }}
                    onMouseOver={e=>e.currentTarget.style.background = "#1d4ed8"}
                    onMouseOut={e=>e.currentTarget.style.background = "#2563eb"}
                  >
                    {saving ? "Saving..." : "Save all"}
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign:"left", 
  padding:12, 
  borderBottom:"1px solid #e5e7eb",
  background:"#f3f4f6",
  position:"sticky",
  top:0,
  zIndex:2,
  cursor:"pointer",
  userSelect:"none"
};

const tdStyle = {
  padding:10, 
  borderBottom:"1px solid #f1f1f1", 
  verticalAlign:"top"
};
