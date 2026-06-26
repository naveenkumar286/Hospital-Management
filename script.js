/* ═══════════════════════════════════════════════
   MediCare HMS – script.js
   ═══════════════════════════════════════════════ */

/* ── SESSION GUARD – redirect to login if not authenticated ── */
if (localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'login.html';
}

/* ══════════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════════ */
const store = {
  get: key => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

/* ══════════════════════════════════════
   SEED DEMO DATA (first load only)
══════════════════════════════════════ */
function seedData() {
  if (localStorage.getItem('seeded')) return;

  store.set('patients', [
    { id: 1, name: 'Ali Hassan',    age: 34, gender: 'Male',   blood: 'B+',  phone: '0300-1234567', email: 'ali@mail.com',   address: 'Lahore' },
    { id: 2, name: 'Sara Khan',     age: 28, gender: 'Female', blood: 'A+',  phone: '0311-9876543', email: 'sara@mail.com',  address: 'Karachi' },
    { id: 3, name: 'Usman Tariq',   age: 45, gender: 'Male',   blood: 'O+',  phone: '0321-5556677', email: 'usman@mail.com', address: 'Islamabad' },
  ]);
  store.set('doctors', [
    { id: 1, name: 'Dr. Ayesha Malik',  spec: 'Cardiology',    phone: '0300-1112233', email: 'ayesha@hospital.com', avail: 'Available', exp: 10 },
    { id: 2, name: 'Dr. Bilal Ahmed',   spec: 'Neurology',     phone: '0311-4445566', email: 'bilal@hospital.com',  avail: 'Busy',      exp: 7  },
    { id: 3, name: 'Dr. Nadia Farooq',  spec: 'Orthopedics',   phone: '0321-7778899', email: 'nadia@hospital.com',  avail: 'Available', exp: 12 },
  ]);
  store.set('appointments', [
    { id: 1, patientId: 1, doctorId: 1, date: '2025-07-20', time: '10:00', reason: 'Chest pain',      status: 'Scheduled' },
    { id: 2, patientId: 2, doctorId: 3, date: '2025-07-21', time: '14:30', reason: 'Knee injury',     status: 'Completed' },
    { id: 3, patientId: 3, doctorId: 2, date: '2025-07-22', time: '09:00', reason: 'Headache',        status: 'Scheduled' },
  ]);
  store.set('bills', [
    { id: 1, patientId: 1, service: 'Consultation', amount: 3000, date: '2025-07-18', status: 'Paid',    notes: '' },
    { id: 2, patientId: 2, service: 'X-Ray',        amount: 5000, date: '2025-07-19', status: 'Pending', notes: 'Follow-up needed' },
  ]);

  localStorage.setItem('seeded', '1');
}

/* ══════════════════════════════════════
   UTILITY
══════════════════════════════════════ */
const uid = () => Date.now();

// Show toast notification
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${msg}`;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

// Badge HTML helper
function badge(text) {
  const map = {
    'Available': 'green', 'Completed': 'green', 'Paid': 'green',
    'Scheduled': 'blue',  'Partial': 'orange',
    'Busy': 'orange',
    'Cancelled': 'red',   'Pending': 'red',
    'On Leave': 'gray',
  };
  return `<span class="badge badge-${map[text] || 'gray'}">${text}</span>`;
}

// Get patient/doctor name by id
const getName = (arr, id) => (arr.find(x => x.id === +id) || {}).name || '—';

/* ══════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

/* ══════════════════════════════════════
   FORM VALIDATION
══════════════════════════════════════ */
function validate(fields) {
  let ok = true;
  fields.forEach(({ el, check }) => {
    const valid = check ? check(el.value.trim()) : el.value.trim() !== '';
    el.classList.toggle('error', !valid);
    if (!valid) ok = false;
  });
  return ok;
}

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
const pageTitles = { dashboard: 'Dashboard', patients: 'Patient Management', doctors: 'Doctor Management', appointments: 'Appointment Booking', billing: 'Billing' };

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.getElementById('pageTitle').textContent = pageTitles[page];
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('mobile-open');
    // Refresh relevant table
    if (page === 'dashboard')    refreshDashboard();
    if (page === 'patients')     renderPatients();
    if (page === 'doctors')      renderDoctors();
    if (page === 'appointments') renderAppointments();
    if (page === 'billing')      renderBills();
  });
});

/* ── Sidebar Toggle ── */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const mainWrap = document.querySelector('.main-wrap');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    mainWrap.classList.toggle('expanded');
  }
});

/* ── Dark / Light Mode ── */
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
// Restore theme
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
function refreshDashboard() {
  const patients     = store.get('patients');
  const doctors      = store.get('doctors');
  const appointments = store.get('appointments');
  const bills        = store.get('bills');

  document.getElementById('statPatients').textContent     = patients.length;
  document.getElementById('statDoctors').textContent      = doctors.length;
  document.getElementById('statAppointments').textContent = appointments.length;
  document.getElementById('statBills').textContent        = bills.length;

  // Recent appointments (last 5)
  const apptBody = document.querySelector('#dashApptTable tbody');
  const recent = [...appointments].reverse().slice(0, 5);
  apptBody.innerHTML = recent.length
    ? recent.map(a => `<tr>
        <td>${getName(patients, a.patientId)}</td>
        <td>${getName(doctors, a.doctorId)}</td>
        <td>${a.date} ${a.time}</td>
        <td>${badge(a.status)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="4">No appointments yet</td></tr>';

  // Available doctors
  const docBody = document.querySelector('#dashDocTable tbody');
  docBody.innerHTML = doctors.length
    ? doctors.map(d => `<tr>
        <td>${d.name}</td>
        <td>${d.spec}</td>
        <td>${badge(d.avail)}</td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="3">No doctors added</td></tr>';
}

/* ══════════════════════════════════════
   PATIENTS
══════════════════════════════════════ */
function renderPatients(filter = '') {
  let data = store.get('patients');
  if (filter) data = data.filter(p => p.name.toLowerCase().includes(filter) || p.phone.includes(filter));
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = data.length
    ? data.map((p, i) => `<tr>
        <td>${i + 1}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.age}</td>
        <td>${p.gender}</td>
        <td><span class="badge badge-red">${p.blood || '—'}</span></td>
        <td>${p.phone}</td>
        <td><div class="action-btns">
          <button class="btn-edit" onclick="editPatient(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-del"  onclick="deleteRecord('patients', ${p.id}, renderPatients)"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="7">No patients found</td></tr>';
}

document.getElementById('patientSearch').addEventListener('input', e => renderPatients(e.target.value.toLowerCase()));

// Add / Edit Patient
document.getElementById('patientForm').addEventListener('submit', e => {
  e.preventDefault();
  const fields = [
    { el: document.getElementById('pName') },
    { el: document.getElementById('pAge'),   check: v => v !== '' && +v >= 0 && +v <= 150 },
    { el: document.getElementById('pGender') },
    { el: document.getElementById('pPhone') },
  ];
  if (!validate(fields)) { toast('Please fill all required fields correctly', 'error'); return; }

  const patients = store.get('patients');
  const id = document.getElementById('patientId').value;
  const record = {
    id:      id ? +id : uid(),
    name:    document.getElementById('pName').value.trim(),
    age:     +document.getElementById('pAge').value,
    gender:  document.getElementById('pGender').value,
    blood:   document.getElementById('pBlood').value,
    phone:   document.getElementById('pPhone').value.trim(),
    email:   document.getElementById('pEmail').value.trim(),
    address: document.getElementById('pAddress').value.trim(),
  };

  if (id) {
    const idx = patients.findIndex(p => p.id === +id);
    patients[idx] = record;
    toast('Patient updated successfully');
  } else {
    patients.push(record);
    toast('Patient added successfully');
  }
  store.set('patients', patients);
  closeModal('patientModal');
  renderPatients();
  refreshDashboard();
});

function editPatient(id) {
  const p = store.get('patients').find(x => x.id === id);
  document.getElementById('patientModalTitle').textContent = 'Edit Patient';
  document.getElementById('patientId').value  = p.id;
  document.getElementById('pName').value      = p.name;
  document.getElementById('pAge').value       = p.age;
  document.getElementById('pGender').value    = p.gender;
  document.getElementById('pBlood').value     = p.blood;
  document.getElementById('pPhone').value     = p.phone;
  document.getElementById('pEmail').value     = p.email;
  document.getElementById('pAddress').value   = p.address;
  openModal('patientModal');
}

// Reset patient form when opening for add
document.querySelector('[onclick="openModal(\'patientModal\')"]')?.addEventListener('click', () => {
  document.getElementById('patientModalTitle').textContent = 'Add Patient';
  document.getElementById('patientForm').reset();
  document.getElementById('patientId').value = '';
  document.querySelectorAll('#patientForm .error').forEach(el => el.classList.remove('error'));
});

/* ══════════════════════════════════════
   DOCTORS
══════════════════════════════════════ */
function renderDoctors(filter = '') {
  let data = store.get('doctors');
  if (filter) data = data.filter(d => d.name.toLowerCase().includes(filter) || d.spec.toLowerCase().includes(filter));
  const tbody = document.querySelector('#doctorTable tbody');
  tbody.innerHTML = data.length
    ? data.map((d, i) => `<tr>
        <td>${i + 1}</td>
        <td><strong>${d.name}</strong></td>
        <td>${d.spec}</td>
        <td>${d.phone}</td>
        <td>${badge(d.avail)}</td>
        <td><div class="action-btns">
          <button class="btn-edit" onclick="editDoctor(${d.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-del"  onclick="deleteRecord('doctors', ${d.id}, renderDoctors)"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="6">No doctors found</td></tr>';
}

document.getElementById('doctorSearch').addEventListener('input', e => renderDoctors(e.target.value.toLowerCase()));

document.getElementById('doctorForm').addEventListener('submit', e => {
  e.preventDefault();
  const fields = [
    { el: document.getElementById('dName') },
    { el: document.getElementById('dSpec') },
    { el: document.getElementById('dPhone') },
    { el: document.getElementById('dAvail') },
  ];
  if (!validate(fields)) { toast('Please fill all required fields', 'error'); return; }

  const doctors = store.get('doctors');
  const id = document.getElementById('doctorId').value;
  const record = {
    id:    id ? +id : uid(),
    name:  document.getElementById('dName').value.trim(),
    spec:  document.getElementById('dSpec').value.trim(),
    phone: document.getElementById('dPhone').value.trim(),
    email: document.getElementById('dEmail').value.trim(),
    avail: document.getElementById('dAvail').value,
    exp:   +document.getElementById('dExp').value || 0,
  };

  if (id) {
    const idx = doctors.findIndex(d => d.id === +id);
    doctors[idx] = record;
    toast('Doctor updated successfully');
  } else {
    doctors.push(record);
    toast('Doctor added successfully');
  }
  store.set('doctors', doctors);
  closeModal('doctorModal');
  renderDoctors();
  refreshDashboard();
});

function editDoctor(id) {
  const d = store.get('doctors').find(x => x.id === id);
  document.getElementById('doctorModalTitle').textContent = 'Edit Doctor';
  document.getElementById('doctorId').value = d.id;
  document.getElementById('dName').value    = d.name;
  document.getElementById('dSpec').value    = d.spec;
  document.getElementById('dPhone').value   = d.phone;
  document.getElementById('dEmail').value   = d.email;
  document.getElementById('dAvail').value   = d.avail;
  document.getElementById('dExp').value     = d.exp;
  openModal('doctorModal');
}

document.querySelector('[onclick="openModal(\'doctorModal\')"]')?.addEventListener('click', () => {
  document.getElementById('doctorModalTitle').textContent = 'Add Doctor';
  document.getElementById('doctorForm').reset();
  document.getElementById('doctorId').value = '';
  document.querySelectorAll('#doctorForm .error').forEach(el => el.classList.remove('error'));
});

/* ══════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════ */
function populateSelects() {
  const patients = store.get('patients');
  const doctors  = store.get('doctors');

  ['apptPatient', 'billPatient'].forEach(id => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = '<option value="">Select Patient</option>' +
      patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (cur) sel.value = cur;
  });

  const apptDoc = document.getElementById('apptDoctor');
  const cur = apptDoc.value;
  apptDoc.innerHTML = '<option value="">Select Doctor</option>' +
    doctors.map(d => `<option value="${d.id}">${d.name} – ${d.spec}</option>`).join('');
  if (cur) apptDoc.value = cur;
}

function renderAppointments(filter = '') {
  const patients = store.get('patients');
  const doctors  = store.get('doctors');
  let data = store.get('appointments');
  if (filter) {
    data = data.filter(a =>
      getName(patients, a.patientId).toLowerCase().includes(filter) ||
      getName(doctors, a.doctorId).toLowerCase().includes(filter)
    );
  }
  const tbody = document.querySelector('#apptTable tbody');
  tbody.innerHTML = data.length
    ? data.map((a, i) => `<tr>
        <td>${i + 1}</td>
        <td>${getName(patients, a.patientId)}</td>
        <td>${getName(doctors, a.doctorId)}</td>
        <td>${a.date} <span style="color:var(--text-muted)">${a.time}</span></td>
        <td>${a.reason || '—'}</td>
        <td>${badge(a.status)}</td>
        <td><div class="action-btns">
          <button class="btn-edit" onclick="editAppt(${a.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-del"  onclick="deleteRecord('appointments', ${a.id}, renderAppointments)"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="7">No appointments found</td></tr>';
}

document.getElementById('apptSearch').addEventListener('input', e => renderAppointments(e.target.value.toLowerCase()));

document.getElementById('apptForm').addEventListener('submit', e => {
  e.preventDefault();
  const fields = [
    { el: document.getElementById('apptPatient') },
    { el: document.getElementById('apptDoctor') },
    { el: document.getElementById('apptDate') },
    { el: document.getElementById('apptTime') },
  ];
  if (!validate(fields)) { toast('Please fill all required fields', 'error'); return; }

  const appointments = store.get('appointments');
  const id = document.getElementById('apptId').value;
  const record = {
    id:        id ? +id : uid(),
    patientId: +document.getElementById('apptPatient').value,
    doctorId:  +document.getElementById('apptDoctor').value,
    date:      document.getElementById('apptDate').value,
    time:      document.getElementById('apptTime').value,
    reason:    document.getElementById('apptReason').value.trim(),
    status:    document.getElementById('apptStatus').value,
  };

  if (id) {
    const idx = appointments.findIndex(a => a.id === +id);
    appointments[idx] = record;
    toast('Appointment updated');
  } else {
    appointments.push(record);
    toast('Appointment booked successfully');
  }
  store.set('appointments', appointments);
  closeModal('apptModal');
  renderAppointments();
  refreshDashboard();
});

function editAppt(id) {
  const a = store.get('appointments').find(x => x.id === id);
  populateSelects();
  document.getElementById('apptModalTitle').textContent = 'Edit Appointment';
  document.getElementById('apptId').value       = a.id;
  document.getElementById('apptPatient').value  = a.patientId;
  document.getElementById('apptDoctor').value   = a.doctorId;
  document.getElementById('apptDate').value     = a.date;
  document.getElementById('apptTime').value     = a.time;
  document.getElementById('apptReason').value   = a.reason;
  document.getElementById('apptStatus').value   = a.status;
  openModal('apptModal');
}

document.querySelector('[onclick="openModal(\'apptModal\')"]')?.addEventListener('click', () => {
  populateSelects();
  document.getElementById('apptModalTitle').textContent = 'Book Appointment';
  document.getElementById('apptForm').reset();
  document.getElementById('apptId').value = '';
  document.querySelectorAll('#apptForm .error').forEach(el => el.classList.remove('error'));
});

/* ══════════════════════════════════════
   BILLING
══════════════════════════════════════ */
function renderBills(filter = '') {
  const patients = store.get('patients');
  let data = store.get('bills');
  if (filter) data = data.filter(b => getName(patients, b.patientId).toLowerCase().includes(filter) || b.service.toLowerCase().includes(filter));
  const tbody = document.querySelector('#billTable tbody');
  tbody.innerHTML = data.length
    ? data.map((b, i) => `<tr>
        <td>${i + 1}</td>
        <td>${getName(patients, b.patientId)}</td>
        <td>${b.service}</td>
        <td><strong>PKR ${Number(b.amount).toLocaleString()}</strong></td>
        <td>${b.date}</td>
        <td>${badge(b.status)}</td>
        <td><div class="action-btns">
          <button class="btn-edit" onclick="editBill(${b.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn-del"  onclick="deleteRecord('bills', ${b.id}, renderBills)"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="7">No bills found</td></tr>';
}

document.getElementById('billSearch').addEventListener('input', e => renderBills(e.target.value.toLowerCase()));

document.getElementById('billForm').addEventListener('submit', e => {
  e.preventDefault();
  const fields = [
    { el: document.getElementById('billPatient') },
    { el: document.getElementById('billService') },
    { el: document.getElementById('billAmount'), check: v => v !== '' && +v >= 0 },
    { el: document.getElementById('billDate') },
  ];
  if (!validate(fields)) { toast('Please fill all required fields', 'error'); return; }

  const bills = store.get('bills');
  const id = document.getElementById('billId').value;
  const record = {
    id:        id ? +id : uid(),
    patientId: +document.getElementById('billPatient').value,
    service:   document.getElementById('billService').value.trim(),
    amount:    +document.getElementById('billAmount').value,
    date:      document.getElementById('billDate').value,
    status:    document.getElementById('billStatus').value,
    notes:     document.getElementById('billNotes').value.trim(),
  };

  if (id) {
    const idx = bills.findIndex(b => b.id === +id);
    bills[idx] = record;
    toast('Bill updated successfully');
  } else {
    bills.push(record);
    toast('Bill generated successfully');
  }
  store.set('bills', bills);
  closeModal('billModal');
  renderBills();
  refreshDashboard();
});

function editBill(id) {
  const b = store.get('bills').find(x => x.id === id);
  populateSelects();
  document.getElementById('billModalTitle').textContent = 'Edit Bill';
  document.getElementById('billId').value       = b.id;
  document.getElementById('billPatient').value  = b.patientId;
  document.getElementById('billService').value  = b.service;
  document.getElementById('billAmount').value   = b.amount;
  document.getElementById('billDate').value     = b.date;
  document.getElementById('billStatus').value   = b.status;
  document.getElementById('billNotes').value    = b.notes;
  openModal('billModal');
}

document.querySelector('[onclick="openModal(\'billModal\')"]')?.addEventListener('click', () => {
  populateSelects();
  document.getElementById('billModalTitle').textContent = 'Generate Bill';
  document.getElementById('billForm').reset();
  document.getElementById('billId').value = '';
  // Set today's date
  document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
  document.querySelectorAll('#billForm .error').forEach(el => el.classList.remove('error'));
});

/* ══════════════════════════════════════
   DELETE (shared confirm modal)
══════════════════════════════════════ */
function deleteRecord(storeKey, id, renderFn) {
  openModal('confirmModal');
  document.getElementById('confirmDeleteBtn').onclick = () => {
    const data = store.get(storeKey).filter(x => x.id !== id);
    store.set(storeKey, data);
    closeModal('confirmModal');
    renderFn();
    refreshDashboard();
    toast('Record deleted');
  };
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
seedData();
refreshDashboard();

/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */
function logoutUser() {
  localStorage.removeItem('isLoggedIn');
  window.location.href = 'login.html';
}
