document.addEventListener("DOMContentLoaded", () => {

  const ordersList = document.getElementById("orders-list");
  const slotsGrid = document.getElementById("slots-grid");
  const assignedList = document.getElementById("assigned-list");
  const autoAssignBtn = document.getElementById("auto-assign");
  const resetBtn = document.getElementById("reset-btn");
  const searchInput = document.getElementById("search-input");
  const filterPref = document.getElementById("filter-preference");

  const initialOrders = [
    { id: "ORD-101", name: "Apples 1kg", address: "MG Road", pref: "morning", zone:"A" },
    { id: "ORD-102", name: "Milk 2L", address: "Anna Nagar", pref: "afternoon", zone:"B" },
    { id: "ORD-103", name: "Eggs Pack", address: "T Nagar", pref: "evening", zone:"A" },
    { id: "ORD-104", name: "Rice 5kg", address: "Velachery", pref: "afternoon", zone:"C" },
    { id: "ORD-105", name: "Vegetables", address: "Adyar", pref: "morning", zone:"B" }
  ];

  const initialSlots = [
    { id:"S1", label:"08:00 - 10:00", capacity:3, assigned:[], tags:["morning"] },
    { id:"S2", label:"10:00 - 13:00", capacity:3, assigned:[], tags:["morning","afternoon"] },
    { id:"S3", label:"13:00 - 16:00", capacity:2, assigned:[], tags:["afternoon"] },
    { id:"S4", label:"16:00 - 19:00", capacity:3, assigned:[], tags:["evening"] }
  ];

  let orders = [];
  let slots = [];

  function clone(v){return JSON.parse(JSON.stringify(v));}

  function reset(){
    orders = clone(initialOrders).map(o => ({...o, assignedTo:null}));
    slots = clone(initialSlots);
    render();
  }

  function render(){
    renderOrders();
    renderSlots();
    renderAssigned();
  }

  function renderOrders(list = orders){
    ordersList.innerHTML = "";
    list.forEach(o=>{
      const div = document.createElement("div");
      div.className="order";

      const meta = document.createElement("div");
      meta.innerHTML = `<strong>${o.id} - ${o.name}</strong>
                        <small>${o.address} • Pref: ${o.pref}</small>`;

      const right = document.createElement("div");

      if(o.assignedTo){
        const label = document.createElement("div");
        label.textContent = o.assignedTo;

        const un = document.createElement("button");
        un.textContent = "Unassign";
        un.onclick = ()=>unassign(o.id);

        right.append(label, un);
      } else {
        const sugg = suggestions(o);
        sugg.forEach(s=>{
          const b = document.createElement("button");
          b.textContent = `${s.slot.label} (${s.score}%)`;
          b.onclick = ()=>assign(o.id, s.slot.id);
          right.append(b);
        });
      }

      div.append(meta, right);
      ordersList.append(div);
    });
  }

  function renderSlots(){
    slotsGrid.innerHTML = "";
    slots.forEach(s=>{
      const box = document.createElement("div");
      box.className = "slot";

      const info = document.createElement("div");
      info.innerHTML = `<strong>${s.label}</strong>
                        <div class="capacity">Capacity: ${s.assigned.length}/${s.capacity}</div>`;

      const prog = document.createElement("div");
      prog.className = "prog";
      const bar = document.createElement("i");
      bar.style.width = `${(s.assigned.length/s.capacity)*100}%`;
      prog.append(bar);

      info.append(prog);

      const btn = document.createElement("button");
      btn.textContent="View";
      btn.onclick = ()=>alert(`Orders:\n${s.assigned.join("\n") || "None"}`);

      box.append(info, btn);
      slotsGrid.append(box);
    });
  }

  function renderAssigned(){
    assignedList.innerHTML="";
    const a = orders.filter(o=>o.assignedTo);
    a.forEach(o=>{
      const div = document.createElement("div");
      div.className="assigned";
      div.innerHTML =
        `<div>
           <strong>${o.id} - ${o.name}</strong>
           <small>${o.address} • ${o.assignedTo}</small>
         </div>`;
      const un = document.createElement("button");
      un.textContent="Unassign";
      un.onclick = ()=>unassign(o.id);
      div.append(un);
      assignedList.append(div);
    });
  }

  function assign(orderId, slotId){
    const o = orders.find(x=>x.id===orderId);
    const s = slots.find(x=>x.id===slotId);

    if(s.assigned.length >= s.capacity){
      alert("Slot full!");
      return;
    }

    o.assignedTo = s.label;
    s.assigned.push(o.id);
    render();
  }

  function unassign(orderId){
    const o = orders.find(x=>x.id===orderId);
    const s = slots.find(x=>x.label===o.assignedTo);
    if(s){
      s.assigned = s.assigned.filter(id=>id!==orderId);
    }
    o.assignedTo = null;
    render();
  }

  function suggestions(order){
    return slots.map(s=>({
        slot:s,
        score:score(order,s)
    }))
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);
  }

  function score(o,s){
    if(s.assigned.length >= s.capacity) return 0;

    const cap = (s.capacity - s.assigned.length) / s.capacity * 100;
    const pref = s.tags.includes(o.pref) ? 100 : 30;

    const zoneScore = {A:100, B:60, C:20}[o.zone] || 50;

    return Math.round(0.4*cap + 0.4*pref + 0.2*zoneScore);
  }

  function autoAssign(){
    const free = orders.filter(o=>!o.assignedTo);
    free.forEach(o=>{
      const best = suggestions(o)[0];
      if(best && best.score>0){
        assign(o.id, best.slot.id);
      }
    });
  }

  searchInput.oninput = e=>{
    const q = e.target.value.toLowerCase();
    if(!q) return renderOrders();

    const filtered = orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
    renderOrders(filtered);
  };

  autoAssignBtn.onclick = autoAssign;
  resetBtn.onclick = reset;

  document.getElementById("year").textContent = new Date().getFullYear();

  reset();
});
