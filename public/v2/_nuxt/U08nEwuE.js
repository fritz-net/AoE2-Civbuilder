import{T as d}from"./B52puhAd.js";import{g,r as n,p as f,c as m,b as _,A as a,J as T,o as v,_ as C}from"./Cxq5ns99.js";const b={class:"techtree-page"},U="Custom Civilization",A=`
<span>Sample Custom Civ</span>
<p><em>Infantry & Archer civilization</em></p>

<h3>Civilization Bonuses</h3>
<ul>
  <li>Infantry units +10% HP in Feudal Age, +15% in Castle Age, +20% in Imperial Age</li>
  <li>Archers cost -15% gold</li>
  <li>Town Centers work 10% faster</li>
  <li>Blacksmith upgrades free</li>
</ul>

<hr>

<h3>Unique Unit</h3>
<p><strong>Elite Guard</strong> - A heavily armored infantry unit with bonus damage against cavalry.</p>

<h3>Unique Technologies</h3>
<ul>
  <li><strong>Castle Age:</strong> Battle Tactics - Infantry +1 attack, +1 armor</li>
  <li><strong>Imperial Age:</strong> Elite Training - Barracks units train 50% faster</li>
</ul>

<hr>

<h3>Team Bonus</h3>
<p>Barracks units +2 line of sight</p>
`,k=g({__name:"techtree",setup(B){const i=T(),o=n(null),r=n([[13,17,21,74,545,539,331,125,83,128,440],[12,45,49,50,68,70,72,79,82,84,87,101,103,104,109,199,209,276,562,584,598,621,792],[22,101,102,103,408]]),s=n(100),l=f(()=>((i.app.baseURL||"/v2/").replace(/\/v2\/?$/,"")||"/").replace(/\/$/,"")+"/aoe2techtree");function c(e,t){console.log("Tech tree completed:",{tree:e,points:t})}function p(e){console.log("Tree updated:",e)}function h(e){console.log("Points updated:",e)}return(e,t)=>{const u=d;return v(),m("div",b,[_(u,{ref_key:"techTreeRef",ref:o,"initial-tree":a(r),editable:!0,points:a(s),"relative-path":a(l),"sidebar-content":A,"sidebar-title":U,onDone:c,"onUpdate:tree":p,"onUpdate:points":h},null,8,["initial-tree","points","relative-path"])])}}}),I=C(k,[["__scopeId","data-v-592ed754"]]);export{I as default};
