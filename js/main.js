const API = "https://pokeapi.co/api/v2";
const FKEY = "fav_pokemon_ids";

const elList = document.querySelector("#list");
const elSt = document.querySelector("#st");
const elQ = document.querySelector("#q");
const elBtnSearch = document.querySelector("#btnSearch");
const elBtnView = document.querySelector("#btnView");

const COLOR_HEX = {
  black:"#111827", blue:"#3b82f6", brown:"#92400e", gray:"#6b7280",
  green:"#10b981", pink:"#ec4899", purple:"#8b5cf6",
  red:"#ef4444", white:"#f3f4f6", yellow:"#f59e0b"
};

function setSt(s){ elSt.textContent = s; }
function clearSt(){ elSt.textContent = ""; }
function pad3(n){ return String(n).padStart(3,"0"); }
function idFromUrl(u){
  const m = u.match(/\/pokemon\/(\d+)\//);
  return m ? Number(m[1]) : 0;
}

// favoritos
function favGet(){ try{ return JSON.parse(localStorage.getItem(FKEY)||"[]"); }catch{ return []; } }
function favSet(ids){ localStorage.setItem(FKEY, JSON.stringify(ids)); }
function isFav(id){ return favGet().includes(id); }
function toggleFav(id){ const xs=favGet(); const i=xs.indexOf(id); i>=0?xs.splice(i,1):xs.push(id); favSet(xs); }

// cache de cores em memória (reduz chamadas)
const colorCache = {};

async function getSpeciesColorName(id){
  if (colorCache[id]) return colorCache[id];
  try{
    const r = await fetch(`${API}/pokemon-species/${id}`);
    if (!r.ok) return null;
    const sp = await r.json();
    const name = sp && sp.color && sp.color.name ? sp.color.name : null;
    colorCache[id] = name;
    return name;
  }catch{ return null; }
}

let view = "grid"; // "grid" | "list"

function cardTpl(p){
  const fav = isFav(p.id);
  const id3 = pad3(p.id);
  const href = "detalhes/index.html?id=" + id3;
  const hex = COLOR_HEX[p.color] || "rgba(255,255,255,.18)";

  const star = `<button class="star" data-star="${p.id}" title="Favoritar">${fav ? "★" : "☆"}</button>`;

  if (view === "grid") {
    return `
      <li class="card" style="border-color:${hex}">
        <div class="card-head">
          <span class="id" style="color:${hex}">#${id3}</span>
          ${star}
        </div>
        <a class="card-link" href="${href}" aria-label="Ver detalhes de ${p.name}">
          <figure class="card-figure">
            <img src="${p.img}" alt="${p.name}" loading="lazy" />
            <figcaption class="card-caption">
              <span class="name">${p.name}</span>
              <span class="muted small">Detalhes →</span>
            </figcaption>
          </figure>
        </a>
      </li>`;
  }

  return `
    <li class="card row" style="border-color:${hex}">
      <img class="row-img" src="${p.img}" alt="${p.name}" loading="lazy" />
      <div class="row-main">
        <div class="row-title">
          <span class="id" style="color:${hex}">#${id3}</span>
          <span class="name">${p.name}</span>
        </div>
        <div class="row-actions">
          <a class="link" href="${href}" aria-label="Ver detalhes de ${p.name}">Detalhes</a>
          ${star}
        </div>
      </div>
    </li>`;
}

async function fetchPokemonList(){
  const r = await fetch(`${API}/pokemon?limit=151&offset=0`);
  if (!r.ok) throw new Error("HTTP "+r.status);
  const data = await r.json();

  const base = data.results.map((s) => {
    const id = idFromUrl(s.url);
    return {
      id,
      name: s.name,
      img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    };
  });

  // buscar cores em paralelo
  const withColors = await Promise.all(base.map(async (pk) => {
    const colorName = await getSpeciesColorName(pk.id);
    return { ...pk, color: colorName };
  }));

  return withColors;
}

async function renderList(q){
  setSt("Carregando...");
  if (!window.__ALL_POKE__) window.__ALL_POKE__ = await fetchPokemonList();
  const all = window.__ALL_POKE__;
  const list = q ? all.filter(p => p.name.includes(q.toLowerCase())) : all;
  elList.innerHTML = list.map(cardTpl).join("");
  clearSt();
}

// eventos
elBtnSearch.addEventListener("click", () => renderList(elQ.value));
elQ.addEventListener("keyup", (e) => { if (e.key === "Enter") renderList(elQ.value); });
elQ.addEventListener("input", () => renderList(elQ.value));

elBtnView.addEventListener("click", () => {
  view = (view === "grid" ? "list" : "grid");
  elList.className = view;
  renderList(elQ.value);
});

elList.addEventListener("click", (ev) => {
  const t = ev.target;
  if (!(t instanceof HTMLElement)) return;
  const starEl = t.closest("[data-star]");
  if (starEl) {
    const id = Number(starEl.getAttribute("data-star"));
    toggleFav(id);
    renderList(elQ.value);
  }
});

// bootstrap
elList.className = view;
renderList("");
