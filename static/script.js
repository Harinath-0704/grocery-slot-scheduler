document.addEventListener("DOMContentLoaded", () => {

    const ordersList = document.getElementById("ordersList");
    const slotsGrid = document.getElementById("slotsGrid");
    const assignedList = document.getElementById("assignedList");

    const search = document.getElementById("search");
    const prefFilter = document.getElementById("prefFilter");
    const autoAssign = document.getElementById("autoAssign");
    const resetBtn = document.getElementById("reset");

    // Simple realistic demo data
    let orders = [
        { id: "ORD1001", name: "Milk 2L", pref: "morning", assigned: null },
        { id: "ORD1002", name: "Apples 1kg", pref: "afternoon", assigned: null },
        { id: "ORD1003", name: "Veg Pack", pref: "evening", assigned: null },
        { id: "ORD1004", name: "Rice Bags", pref: "afternoon", assigned: null }
    ];

    let slots = [
        { id: "S1", label: "8 AM - 10 AM", capacity: 2, assigned: [] },
        { id: "S2", label: "10 AM - 1 PM", capacity: 2, assigned: [] },
        { id: "S3", label: "1 PM - 4 PM", capacity: 2, assigned: [] },
        { id: "S4", label: "4 PM - 7 PM", capacity: 2, assigned: [] }
    ];

    function renderOrders() {
        ordersList.innerHTML = "";
        orders.forEach(o => {
            const div = document.createElement("div");
            div.className = "order";

            div.innerHTML = `
                <div>
                    <strong>${o.id}</strong><br>
                    ${o.name} (${o.pref})
                </div>
                <div>
                    ${
                        o.assigned 
                        ? `<span>${o.assigned}</span>`
                        : `<button class='btn-primary small' onclick="assignManually('${o.id}')">Assign</button>`
                    }
                </div>
            `;

            ordersList.appendChild(div);
        });
    }

    window.assignManually = function(orderId){
        let order = orders.find(o => o.id === orderId);
        let available = slots.filter(s => s.assigned.length < s.capacity);

        if(!available.length){
            alert("No available slots!");
            return;
        }

        let best = available[0];
        best.assigned.push(order.id);
        order.assigned = best.label;

        renderAll();
    }

    function renderSlots() {
        slotsGrid.innerHTML = "";
        slots.forEach(s => {
            const div = document.createElement("div");
            div.className = "slot";
            div.innerHTML = `
                <div>
                    <strong>${s.label}</strong><br>
                    ${s.assigned.length}/${s.capacity} used
                </div>
            `;
            slotsGrid.appendChild(div);
        });
    }

    function renderAssigned() {
        assignedList.innerHTML = "";
        orders
            .filter(o => o.assigned)
            .forEach(o => {
                const div = document.createElement("div");
                div.className = "assigned";
                div.innerHTML = `
                    <div><strong>${o.id}</strong> - ${o.name}</div>
                    <div>${o.assigned}</div>
                `;
                assignedList.appendChild(div);
            });
    }

    function renderAll() {
        renderOrders();
        renderSlots();
        renderAssigned();
    }

    autoAssign.addEventListener("click", () => {
        orders.forEach(o => {
            if(!o.assigned){
                let slot = slots.find(s => s.assigned.length < s.capacity);
                if(slot){
                    slot.assigned.push(o.id);
                    o.assigned = slot.label;
                }
            }
        });
        renderAll();
    });

    resetBtn.addEventListener("click", () => {
        orders.forEach(o => o.assigned = null);
        slots.forEach(s => s.assigned = []);
        renderAll();
    });

    document.getElementById("year").textContent = new Date().getFullYear();

    renderAll();
});
