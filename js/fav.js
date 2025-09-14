const API = "https://pokeapi.co/api/v2";
const elList = document.querySelector("#list");
const elSt = document.querySelector("#st");
const FKEY = "fav_pokemon_ids";

const COLOR_HEX = {
  black:"#111827", blue:"#3b82f6", brown:"#92400e", gray:"#6b7280",
  green:"#10b981", pink:"#ec4899", purple:"#8b5cf6",
  red:"#ef4444", white:"#f3f4f6", yellow:"#f59e0b"
};

function setSt(s){ elSt.textContent = s; }
function clearSt(){ elSt.textContent = ""; }
function pad3(n){ return String(n).padStart(3,"0"); }
function fallbackImg(id){ return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`; }

function favGet(){ try{ return JSON.parse(localStorage.getItem(FKEY)||"[]"); }catch{ return []; } }
function favRemove(id){
  const xs = favGet().filter(x => x !== id);
  localStorage.setItem(FKEY, JSON.stringify(xs));
}

async function fetchPk(id){
  const r = await fetch(`${API}/pokemon/${id}`);
  if (!r.ok) throw new Error("HTTP "+r.status);
  return r.json();
}
async function fetchColorName(id){
  const r = await fetch(`${API}/pokemon-species/${id}`);
  if (!r.ok) return null;
  const s = await r.json();
  return s && s.color && s.color.name ? s.color.name : null;
}

function tpl(p){
  const id3 = pad3(p.id);
  const href = `../detalhes/index.html?id=${id3}`;
  const hex = COLOR_HEX[p.color] || "rgba(255,255,255,.18)";
  return `
    <li class="card" style="border-color:${hex}">
      <div class="card-head">
        <span class="id" style="color:${hex}">#${id3}</span>
        <button class="link danger" data-remove="${p.id}">Remover</button>
      </div>
      <a class="card-link" href="${href}">
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

async function load(){
  setSt("Carregando favoritos...");
  const ids = favGet();
  if (!ids.length) {
    elList.innerHTML = '<li class="muted">Você ainda não favoritou nenhum Pokémon.</li>';
    clearSt();
    return;
  }

  const all = await Promise.all(ids.map(async (id) => {
    const p = await fetchPk(id);
    const color = await fetchColorName(p.id);
    return {
      id: p.id,
      name: p.name,
      img: (p.sprites && p.sprites.front_default) ? p.sprites.front_default : fallbackImg(p.id),
      color
    };
  }));

  all.sort((a,b) => a.id - b.id);
  elList.innerHTML = all.map(tpl).join("");
  clearSt();
}

elList.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const rm = t.closest("[data-remove]");
  if (rm) {
    const id = Number(rm.getAttribute("data-remove"));
    favRemove(id);
    load();
  }
});

load().catch((e) => setSt("Erro: " + (e && e.message ? e.message : String(e))));
