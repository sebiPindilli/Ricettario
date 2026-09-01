import { useState } from "react";
import { useTheme } from "../context.js";
import { F, TAG_GROUPS } from "../data/constants.js";

// ══════════════════════════════════════════════════════════════
// COMPONENT: TagPicker — structured tag selector with custom tags
// ══════════════════════════════════════════════════════════════
export default function TagPicker({ selectedTags, onChange, extraGroups = [], onAddGroup, onAddTagToGroup }) {
  const th = useTheme();
  const [openGroup, setOpenGroup] = useState(null);
  const [customInputs, setCustomInputs] = useState({}); // {groupName: string}
  const [newGroupInput, setNewGroupInput] = useState("");

  const toggle = (tag) => onChange(
    selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
  );

  // Merge preset groups + extra custom groups, always end with "Altro"
  const baseGroups = TAG_GROUPS.filter(g => g.group !== "Altro");
  const altroPreset = TAG_GROUPS.find(g => g.group === "Altro") || { group:"Altro", tags:[] };
  const allGroups = [
    ...baseGroups,
    ...extraGroups,
    altroPreset,
  ];

  // Custom tags are any selected tags not in any known group
  const allKnownTags = allGroups.flatMap(g => g.tags);
  const orphanTags = selectedTags.filter(t => !allKnownTags.includes(t));

  const addCustomTag = (groupName) => {
    const val = (customInputs[groupName] || "").trim();
    if (!val) return;
    // Add tag to the group (via callback) and select it
    if (onAddTagToGroup) onAddTagToGroup(groupName, val);
    if (!selectedTags.includes(val)) onChange([...selectedTags, val]);
    setCustomInputs(prev => ({ ...prev, [groupName]: "" }));
  };

  const addNewGroup = () => {
    const val = newGroupInput.trim();
    if (!val) return;
    if (onAddGroup) onAddGroup(val);
    setNewGroupInput("");
    setOpenGroup(val); // open newly created group
  };

  return (
    <div>
      {/* Active tags summary */}
      {selectedTags.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {selectedTags.map(tag => (
            <button key={tag} onClick={() => toggle(tag)} style={{
              padding:"4px 10px", borderRadius:20,
              background:th.appAccent, color:th.appOnAccent,
              border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer",
              display:"flex", alignItems:"center", gap:4,
            }}>
              {tag} <span style={{ opacity:0.7 }}>×</span>
            </button>
          ))}
        </div>
      )}

      {/* Groups */}
      {allGroups.map(group => {
        const isOpen = openGroup === group.group;
        const activeInGroup = group.tags.filter(t => selectedTags.includes(t));
        const isAltro = group.group === "Altro";
        // Orphan tags (not in any group) shown in "Altro"
        const altroCustTags = isAltro ? orphanTags : [];
        const totalActive = activeInGroup.length + (isAltro ? altroCustTags.length : 0);

        return (
          <div key={group.group} style={{ marginBottom:6 }}>
            <button
              onClick={() => setOpenGroup(isOpen ? null : group.group)}
              style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"9px 12px",
                background: totalActive > 0 ? th.appPillBg : th.appCard,
                border:`1.5px solid ${totalActive > 0 ? th.appAccent : th.appBorder}`,
                borderRadius:10, cursor:"pointer",
                fontFamily:F.ui, fontSize:12, color:th.appInk,
              }}
            >
              <span style={{ fontWeight:600 }}>
                {group.group}
                {totalActive > 0 && (
                  <span style={{ marginLeft:8, background:th.appAccent, color:th.appOnAccent, borderRadius:10, padding:"1px 7px", fontSize:10 }}>
                    {totalActive}
                  </span>
                )}
              </span>
              <span style={{ color:th.appFaded, fontSize:11 }}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div style={{ padding:"8px 4px 4px" }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                  {group.tags.map(tag => {
                    const sel = selectedTags.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggle(tag)} style={{
                        padding:"5px 12px", borderRadius:20,
                        border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                        background: sel ? th.appAccent : "transparent",
                        color: sel ? "#fff" : th.appFaded,
                        fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      }}>{tag}</button>
                    );
                  })}
                  {isAltro && altroCustTags.map(tag => (
                    <button key={tag} onClick={() => toggle(tag)} style={{
                      padding:"5px 12px", borderRadius:20,
                      border:`1.5px solid ${th.appAccent}`,
                      background:th.appAccent, color:th.appOnAccent,
                      fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:4,
                    }}>{tag} <span style={{ opacity:0.7 }}>×</span></button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={customInputs[group.group] || ""}
                    onChange={e => setCustomInputs(prev => ({ ...prev, [group.group]:e.target.value }))}
                    onKeyDown={e => e.key==="Enter" && addCustomTag(group.group)}
                    placeholder={`Aggiungi tag a "${group.group}"…`}
                    style={{ flex:1, padding:"8px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.ui, fontSize:12, color:th.appInk, outline:"none" }}
                  />
                  <button onClick={() => addCustomTag(group.group)} style={{ padding:"8px 14px", borderRadius:10, background:th.appAccent, color:th.appOnAccent, border:"none", fontFamily:F.ui, fontSize:12, cursor:"pointer", fontWeight:700 }}>＋</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add new custom category ── */}
      {onAddGroup && (
        <div style={{ marginTop:8, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:6 }}>
            Aggiungi una nuova categoria di tag
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={newGroupInput}
              onChange={e => setNewGroupInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && addNewGroup()}
              placeholder="es. Intolleranze, Occasione speciale…"
              style={{ flex:1, padding:"8px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.ui, fontSize:12, color:th.appInk, outline:"none" }}
            />
            <button onClick={addNewGroup} style={{ padding:"8px 14px", borderRadius:10, background:th.appInk, color:th.appBg, border:"none", fontFamily:F.ui, fontSize:12, cursor:"pointer", fontWeight:700 }}>＋ Categoria</button>
          </div>
        </div>
      )}
    </div>
  );
}
