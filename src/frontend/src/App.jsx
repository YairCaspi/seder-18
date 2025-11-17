import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [data, setData] = useState({ translations: {}, allKeys: [], mainLang: "en" });
  const [local, setLocal] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [sortBy, setSortBy] = useState({ column: "key", asc: true });
  const [selectedRow, setSelectedRow] = useState(null);
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
    const all = data.allKeys || [];
    let arr = [...all];
    if (sortBy.column === "key") {
      arr.sort((a,b) => sortBy.asc ? a.localeCompare(b) : b.localeCompare(a));
    } else {
      arr.sort((a,b) => {
        const va = (local[sortBy.column]?.[a] || "").toLowerCase();
        const vb = (local[sortBy.column]?.[b] || "").toLowerCase();
        return sortBy.asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return arr;
  }, [data.allKeys, local, sortBy]);

  const onChange = (lang,key,val) => {
    setLocal(prev => {
      const copy = { ...prev, [lang]: { ...(prev[lang]||{}), [key]: val } };
      return copy;
    });
    setDirty(prev => new Set(prev).add(`${lang}||${key}`));
  };

  const saveAll = async () => {
    setSaving(true);
    await fetch("/api/save-translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations: local })
    });
    setDirty(new Set());
    setSaving(false);
    alert("Saved");
  };

  const toggleSort = (col) => {
    setSortBy(prev => {
      if (prev.column === col) return { column: col, asc: !prev.asc };
      return { column: col, asc: true };
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif", background:"#f5f7fa", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      
      {/* Header */}
      <div style={{ background:"white", padding:20, borderRadius:12, boxShadow:"0 4px 10px rgba(0,0,0,0.08)", position:"sticky", top:0, zIndex:10 }}>
        <h1 style={{ margin:0 }}>Translation Editor</h1>
      </div>

      {/* Selected row modal */}
      {selectedRow && (
        <div style={{ position:"fixed", top:0,left:0,right:0,bottom:0, background:"rgba(0,0,0,0.4)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:20 }}
          onClick={()=>setSelectedRow(null)}>
          <div style={{ background:"white", padding:20, borderRadius:12, minWidth:300, maxWidth:"90%", maxHeight:"80%", overflowY:"auto" }}
            onClick={e=>e.stopPropagation()}>
            <h3>{selectedRow}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {languages.map(lang => (
                <div key={lang} style={{ display:"flex", flexDirection:"column" }}>
                  <label>{lang}</label>
                  <input
                    value={local[lang]?.[selectedRow] || ""}
                    onChange={e => onChange(lang, selectedRow, e.target.value)}
                    style={{ padding:6, borderRadius:4, border:"1px solid #ccc" }}
                  />
                </div>
              ))}
            </div>
            <button onClick={()=>setSelectedRow(null)} style={{ marginTop:12 }}>Close</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflow:"auto", flex:1 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
          <thead style={{ position:"sticky", top:0, background:"#fafafa", zIndex:5 }}>
            <tr>
              <th style={{...thStyle, left:0, zIndex:6, position:"sticky"}} onClick={()=>toggleSort("key")}>Key {sortBy.column==="key"? (sortBy.asc?"▲":"▼"):""}</th>
              {languages.map((lang, idx) => (
                <th key={lang} style={{...thStyle, minWidth:120, position: idx===0?"sticky":"static", left: idx===0?150:undefined, background: idx===0?"#fafafa":undefined, cursor:"pointer"}} onClick={()=>toggleSort(lang)}>
                  {lang} {sortBy.column===lang ? (sortBy.asc?"▲":"▼"):""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map(key => (
              <tr key={key} onClick={()=>setSelectedRow(key)} style={{ cursor:"pointer" }}>
                <td style={{...tdStyle, fontFamily:"monospace", width:150}}>{key}</td>
                {languages.map((lang, idx) => {
                  const value = (local[lang]?.[key]) || "";
                  const isDirty = dirty.has(`${lang}||${key}`);
                  return (
                    <td key={lang} style={{...tdStyle, minWidth:120, background: isDirty ? "#fff7e6" : "transparent"}}>
                      <input value={value} onChange={e=>onChange(lang,key,e.target.value)} style={{width:"100%",border:"none",padding:6}}/>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot style={{ position:"sticky", bottom:0, background:"#fafafa", zIndex:5 }}>
            <tr>
              <td colSpan={languages.length+1} style={{ padding:8, textAlign:"right" }}>
                {dirty.size} unsaved changes
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Save button footer */}
      <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end", background:"white", padding:12, position:"sticky", bottom:0, zIndex:10, boxShadow:"0 -4px 10px rgba(0,0,0,0.08)", borderRadius:12 }}>
        <button onClick={saveAll} disabled={dirty.size===0 || saving} style={{ padding:"8px 14px", background:"#2563eb", color:"white", border:"none", borderRadius:8 }}>
          {saving ? "Saving..." : "Save all"}
        </button>
      </div>

    </div>
  );
}

const thStyle = { textAlign:"left", padding:12, borderBottom:"1px solid #eee", cursor:"pointer" };
const tdStyle = { padding:10, borderBottom:"1px solid #f1f1f1", verticalAlign:"top" };
