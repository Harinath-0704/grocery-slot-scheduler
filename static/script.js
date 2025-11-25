// script.js - Demo logic: allocation + matching + search
document.addEventListener('DOMContentLoaded', () => {
  const ordersList = document.getElementById('orders-list');
  const slotsGrid = document.getElementById('slots-grid');
  const assignedList = document.getElementById('assigned-list');
  const autoAssignBtn = document.getElementById('auto-assign');
  const resetBtn = document.getElementById('reset-btn');
  const searchInput = document.getElementById('search-input');
  const filterPref = document.getElementById('filter-preference');

  // Example demo data (editable)
  const initialOrders = [
    { id: 'ORD-1001', name: 'Apples 1kg', address: 'MG Road', zone: 'A', pref: 'morning' },
    { id: 'ORD-1002', name: 'Milk 2L', address: 'Anna Nagar', zone: 'B', pref: 'afternoon' },
    { id: 'ORD-1003', name: 'Bread & Eggs', address: 'T Nagar', zone: 'A', pref: 'evening' },
    { id: 'ORD-1004', name: 'Rice 5kg', address: 'Velachery', zone: 'C', pref: 'afternoon' },
    { id: 'ORD-1005', name: 'Veg Pack', address: 'Adyar', zone: 'B', pref: 'morning' },
    { id: 'ORD-1006', name: 'Detergent', address: 'Porur', zone: 'C', pref: 'evening' },
    { id: 'ORD-1007', name: 'Juice 1L', address: 'Nungambakkam', zone: 'A', pref: 'afternoon' },
    { id: 'ORD-1008', name: 'Yogurt', address: 'Chromepet', zone: 'C', pref: 'morning' }
  ];

  const initialSlots = [
    { id: 'S1', label: '08:00 - 10:00', capacity: 3, assigned: [], tags: ['morning'] },
    { id: 'S2', label: '10:00 - 13:00', capacity: 3, assigned: [], tags: ['morning', 'afternoon'] },
    { id: 'S3', label: '13:00 - 16:00', capacity: 2, assigned: [], tags: ['afternoon'] },
    { id: 'S4', label: '16:00 - 19:00', capacity: 3, assigned: [], tags: ['evening'] },
  ];

  let orders = [];
  let slots = [];

  const deepClone = v => JSON.parse(JSON.stringify(v));

  function resetDemo() {
    orders = deepClone(initialOrders).map(o => ({ ...o, assignedTo: null }));
    slots = deepClone(initialSlots);
    renderAll();
  }

  function renderAll() {
    renderOrders();
    renderSlots();
    renderAssigned();
  }

  function renderOrders(filtered = null) {
    const list = filtered || orders;
    ordersList.innerHTML = '';
    if (!list.length) {
      ordersList.innerHTML = '<div class="muted">No orders</div>';
      return;
    }
    list.forEach(order => {
      const el = document.createElement('div'); el.className = 'order';
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<strong>${order.id} • ${order.name}</strong><small>${order.address} — Pref: ${order.pref}</small>`;

      const right = document.createElement('div');
      if (order.assignedTo) {
        const lbl = document.createElement('div'); lbl.textContent = order.assignedTo;
        const unassign = document.createElement('button'); unassign.textContent = 'Unassign';
        unassign.addEventListener('click', () => unassignOrder(order.id));
        right.append(lbl, unassign);
      } else {
        const sugWrap = document.createElement('div');
        const suggestions = suggestSlotsForOrder(order, 3);
        if (!suggestions.length) {
          const none = document.createElement('small'); none.textContent = 'No slots available';
          sugWrap.appendChild(none);
        } else {
          suggestions.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = `${s.slot.label} (${s.score}%)`;
            btn.title = `Assign to ${s.slot.label}`;
            btn.addEventListener('click', () => assign(order.id, s.slot.id));
            sugWrap.appendChild(btn);
          });
        }
        right.appendChild(sugWrap);
      }

      el.appendChild(meta);
      el.appendChild(right);
      ordersList.appendChild(el);
    });
  }

  function renderSlots() {
    slotsGrid.innerHTML = '';
    slots.forEach(slot => {
      const el = document.createElement('div'); el.className = 'slot';
      const info = document.createElement('div'); info.className = 'info';
      info.innerHTML = `<div class="label">${slot.label}</div><div class="capacity">Capacity: ${slot.assigned.length}/${slot.capacity}</div>`;
      const prog = document.createElement('div'); prog.className = 'prog';
      const inner = document.createElement('i'); inner.style.width = `${Math.round((slot.assigned.length / slot.capacity) * 100)}%`;
      prog.appendChild(inner);
      info.appendChild(prog);

      const right = document.createElement('div');
      const view = document.createElement('button'); view.textContent = 'View';
      view.addEventListener('click', () => alert(`Assigned:\n${slot.assigned.join('\n') || '— none —'}`));
      const clear = document.createElement('button'); clear.textContent = 'Clear';
      clear.style.marginLeft = '8px';
      clear.addEventListener('click', () => clearSlot(slot.id));
      right.appendChild(view); right.appendChild(clear);

      el.appendChild(info); el.appendChild(right);
      slotsGrid.appendChild(el);
    });
  }

  function renderAssigned() {
    assignedList.innerHTML = '';
    const assigned = orders.filter(o => o.assignedTo).sort((a,b)=>a.assignedTo.localeCompare(b.assignedTo));
    if (!assigned.length) {
      assignedList.innerHTML = '<div class="muted">No assigned orders</div>';
      return;
    }
    assigned.forEach(o => {
      const el = document.createElement('div'); el.className = 'assigned';
      el.innerHTML = `<div><strong>${o.id} • ${o.name}</strong><small>${o.address} — ${o.assignedTo}</small></div>`;
      const un = document.createElement('button'); un.textContent = 'Unassign';
      un.addEventListener('click', ()=>unassignOrder(o.id));
      el.appendChild(un);
      assignedList.appendChild(el);
    });
  }

  // Assignment & rebalancing logic
  function assign(orderId, slotId) {
    const order = orders.find(o => o.id === orderId);
    const slot = slots.find(s => s.id === slotId);
    if (!order || !slot) return;
    if (slot.assigned.length >= slot.capacity) {
      alert('Slot full — attempting rebalancing...');
      if (!rebalanceForSlot(slotId)) {
        alert('No room to rebalance.');
        return;
      }
    }
    slot.assigned.push(order.id);
    order.assignedTo = slot.label;
    renderAll();
  }

  function unassignOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const slot = slots.find(s => s.assigned.includes(orderId));
    if (slot) slot.assigned = slot.assigned.filter(x => x !== orderId);
    order.assignedTo = null;
    renderAll();
  }

  function clearSlot(slotId) {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    slot.assigned.forEach(oid => {
      const od = orders.find(o => o.id === oid);
      if (od) od.assignedTo = null;
    });
    slot.assigned = [];
    renderAll();
  }

  function rebalanceForSlot(targetSlotId) {
    const target = slots.find(s => s.id === targetSlotId);
    if (!target) return false;
    // try to move least preferred assigned order
    for (let i = target.assigned.length - 1; i >= 0; i--) {
      const oid = target.assigned[i];
      const order = orders.find(o => o.id === oid);
      const alt = findBestSlotForOrder(order, targetSlotId);
      if (alt && alt.slot.assigned.length < alt.slot.capacity) {
        target.assigned = target.assigned.filter(x => x !== oid);
        alt.slot.assigned.push(oid);
        order.assignedTo = alt.slot.label;
        return true;
      }
    }
    return false;
  }

  // Matching and scoring
  function suggestSlotsForOrder(order, topN = 3) {
    const candidates = slots.map(s => ({ slot: s, score: computeMatchScore(order, s) }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);
    return candidates.slice(0, topN);
  }

  function findBestSlotForOrder(order, excludeSlotId = null) {
    const candidates = slots
      .filter(s => s.id !== excludeSlotId)
      .map(s => ({ slot: s, score: computeMatchScore(order, s) }))
      .sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function computeMatchScore(order, slot) {
    const capacityLeft = Math.max(0, slot.capacity - slot.assigned.length);
    if (capacityLeft <= 0) return 0;
    const capScore = Math.min(1, capacityLeft / slot.capacity) * 100;
    const tagMatch = slot.tags.includes(order.pref) ? 1 : 0;
    const zoneRank = ({A: 2, B: 1, C: 0}[order.zone] || 0);
    const score = Math.round(0.4 * capScore + 0.4 * (tagMatch ? 100 : 30) + 0.2 * (zoneRank / 2 * 100));
    return score;
  }

  // Auto assign
  function autoAssignAll() {
    const prefOrder = { morning: 0, afternoon: 1, evening: 2 };
    const unassigned = orders.filter(o => !o.assignedTo).sort((a, b) => prefOrder[a.pref] - prefOrder[b.pref]);
    unassigned.forEach(order => {
      const best = findBestSlotForOrder(order);
      if (best && best.score > 0 && best.slot.assigned.length < best.slot.capacity) {
        best.slot.assigned.push(order.id);
        order.assignedTo = best.slot.label;
      }
    });
    // defensive rebalancing
    slots.forEach(s => {
      while (s.assigned.length > s.capacity) {
        const oid = s.assigned.pop();
        const od = orders.find(o => o.id === oid);
        od.assignedTo = null;
        const alt = findBestSlotForOrder(od, s.id);
        if (alt && alt.slot.assigned.length < alt.slot.capacity) {
          alt.slot.assigned.push(oid);
          od.assignedTo = alt.slot.label;
        } else {
          s.assigned.push(oid);
          break;
        }
      }
    });
    renderAll();
  }

  // Search
  function doSearch(term) {
    const q = (term || '').trim().toLowerCase();
    if (!q) {
      renderOrders();
      return;
    }
    const results = orders.map(o => {
      let score = 0;
      if (o.id.toLowerCase().includes(q)) score += 50;
      if (o.name.toLowerCase().includes(q)) score += 30;
      if (o.address.toLowerCase().includes(q)) score += 20;
      if (!o.assignedTo) score += 5;
      return { o, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).map(r => r.o);
    renderOrders(results);
  }

  // Events
  autoAssignBtn.addEventListener('click', () => autoAssignAll());
  resetBtn.addEventListener('click', () => resetDemo());
  searchInput.addEventListener('input', (e) => doSearch(e.target.value));
  filterPref.addEventListener('change', (e) => {
    const pref = e.target.value;
    if (pref === 'any') renderOrders();
    else {
      const filtered = orders.filter(o => {
        if (pref === 'earliest') return o.pref === 'morning' || o.pref === 'afternoon';
        return o.pref === pref;
      });
      renderOrders(filtered);
    }
  });

  // mobile nav toggle
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav');
  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.querySelectorAll('a').forEach(a => {
      a.style.display = expanded ? 'none' : 'inline-block';
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  resetDemo();
});
