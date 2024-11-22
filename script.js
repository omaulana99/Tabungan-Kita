const tabunganList = JSON.parse(localStorage.getItem('tabunganList')) || [];

// Simpan data ke localStorage
function saveToLocalStorage() {
  localStorage.setItem('tabunganList', JSON.stringify(tabunganList));
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message) {
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = message;
  document.body.appendChild(notification);

  // Hapus notifikasi setelah 3 detik
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Fungsi untuk pratinjau gambar bukti yang di-upload
function previewBukti(event) {
  const reader = new FileReader();
  reader.onload = function() {
    const preview = document.getElementById('previewBukti');
    preview.src = reader.result;
    preview.style.display = 'block'; // Menampilkan gambar pratinjau
  };
  reader.readAsDataURL(event.target.files[0]); // Mengonversi file gambar menjadi base64
}

// Fungsi untuk hanya menerima angka dan format ribuan
function hanyaAngka(event) {
  // Menghapus karakter non-angka dan mengganti titik untuk format ribuan
  event.target.value = event.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Menambahkan event listener pada input target dan amount untuk hanya menerima angka
document.getElementById('target').addEventListener('input', hanyaAngka);
document.getElementById('amount').addEventListener('input', hanyaAngka);

// Tambahkan tabungan baru
function addTabungan() {
  const name = document.getElementById('name').value;
  const target = parseInt(document.getElementById('target').value.replace(/\./g, '')) || 0;
  const amount = parseInt(document.getElementById('amount').value.replace(/\./g, '')) || 0;
  const type = document.getElementById('type').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const description = document.getElementById('description').value;
  const buktiInput = document.getElementById('bukti');
  const buktiFile = buktiInput.files[0];

  // Cek apakah ada bukti yang di-upload
  let bukti = null;
  if (buktiFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      bukti = e.target.result; // Mengonversi gambar menjadi base64
      saveTabunganToLocalStorage(name, target, amount, type, date, time, description, bukti);
    };
    reader.readAsDataURL(buktiFile); // Membaca file sebagai base64
  } else {
    saveTabunganToLocalStorage(name, target, amount, type, date, time, description, null);
  }

  // Menampilkan notifikasi setelah tabungan berhasil ditambahkan
  showNotification('Tabungan berhasil ditambahkan!');
}

function saveTabunganToLocalStorage(name, target, amount, type, date, time, description, bukti) {
  // Menentukan nomor urut untuk setoran
  const historyLength = amount > 0 ? tabunganList.reduce((count, tabungan) => {
    return count + (tabungan.name === name ? 1 : 0);
  }, 0) + 1 : 0;

  // Menyusun history dengan setoran yang sudah ada
  const newHistory = amount > 0 ? [{ amount, note: `Setoran ke-${historyLength}`, date, time }] : [];

  const newTabungan = {
    id: Date.now(),
    name,
    target,
    terkumpul: amount,
    type,
    date,
    time,
    description,
    bukti, // Menyimpan bukti sebagai base64
    history: newHistory
  };

  tabunganList.push(newTabungan);
  saveToLocalStorage();
  renderTabunganList();
  resetForm();
}

// Fungsi untuk merender daftar tabungan
// Fungsi untuk merender daftar tabungan
function renderTabunganList() {
    const tabunganContainer = document.getElementById('tabunganList');
    tabunganContainer.innerHTML = '';

    tabunganList.forEach((tabungan) => {
        const progress = Math.min((tabungan.terkumpul / tabungan.target) * 100, 100).toFixed(0);

        const tabunganElement = document.createElement('div');
        tabunganElement.className = 'tabungan-item';
        tabunganElement.innerHTML = `
            <h3>${tabungan.name}</h3>
            <p>Target: Rp ${tabungan.target.toLocaleString()}</p>
            <p>Terkumpul: Rp ${tabungan.terkumpul.toLocaleString()}</p>
            <p>Progress: ${progress}%</p>
            <p>Tipe: ${tabungan.type}</p>
            <p>Keterangan: ${tabungan.description}</p>

            <!-- Menambahkan spasi dan teks bold -->
            <p><strong>Riwayat Menabung:</strong></p>
            <ul style="padding-left: 20px; margin-top: 10px;"> <!-- Spasi dengan padding dan margin -->
                ${tabungan.history
                    .map(entry => {
                        const formattedDate = new Date(entry.date).toLocaleDateString('id-ID');
                        return `<li><strong>${formattedDate}</strong> - ${entry.time} - Rp ${entry.amount.toLocaleString()} (${entry.note})</li>`;
                    })
                    .join('')}
            </ul>
            
            ${tabungan.bukti ? `<img src="${tabungan.bukti}" style="max-width: 100px; margin-top: 10px;" />` : ''}

            <!-- Tombol Hapus Tabungan -->
            <button onclick="hapusTabungan(${tabungan.id})">Hapus Tabungan</button>

            <!-- Tombol Ambil Tabungan -->
            <button onclick="ambilTabungan(${tabungan.id})">Ambil Tabungan</button>

            <!-- Input untuk mengambil jumlah -->
            <input type="text" id="ambilAmount${tabungan.id}" placeholder="Masukkan jumlah yang ingin diambil" />
            <input type="text" id="ambilKeterangan${tabungan.id}" placeholder="Masukkan keterangan (opsional)" />
        `;

        tabunganContainer.appendChild(tabunganElement);

        // Menambahkan format angka otomatis pada input "ambilAmount"
        const ambilAmountInput = document.getElementById(`ambilAmount${tabungan.id}`);
        
        // Fungsi untuk memformat angka
        ambilAmountInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Menghapus karakter non-digit
            if (value.length > 3) {
                value = value.replace(/(\d)(\d{3})$/, '$1.$2'); // Menambahkan titik tiap 3 digit
            }
            e.target.value = value;
        });
    });
}
// Cek apakah mode gelap sudah diaktifkan sebelumnya
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    document.getElementById('modeIcon').classList.remove('fa-sun');
    document.getElementById('modeIcon').classList.add('fa-moon');
  }
  
  document.getElementById('darkModeToggle').addEventListener('click', function() {
    // Toggle mode gelap
    document.body.classList.toggle('dark-mode');
    
    // Simpan pilihan mode gelap di localStorage
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('darkMode', 'enabled');
      document.getElementById('modeIcon').classList.remove('fa-sun');
      document.getElementById('modeIcon').classList.add('fa-moon');
    } else {
      localStorage.setItem('darkMode', 'disabled');
      document.getElementById('modeIcon').classList.remove('fa-moon');
      document.getElementById('modeIcon').classList.add('fa-sun');
    }
  });
  



// Fungsi untuk mengambil tabungan
function ambilTabungan(id) {
    const tabungan = tabunganList.find((t) => t.id === id);
    const ambilAmount = parseInt(document.getElementById(`ambilAmount${id}`).value.replace(/\./g, '')) || 0;
    const ambilKeterangan = document.getElementById(`ambilKeterangan${id}`).value || 'Tidak ada keterangan'; // Keterangan default jika kosong

    if (ambilAmount <= 0 || isNaN(ambilAmount)) {
        alert('Jumlah yang ingin diambil tidak valid!');
        return;
    }

    if (ambilAmount > tabungan.terkumpul) {
        alert('Jumlah yang ingin diambil melebihi jumlah terkumpul!');
        return;
    }

    // Mengurangi jumlah terkumpul
    tabungan.terkumpul -= ambilAmount;

    // Menambahkan riwayat pengambilan
    tabungan.history.push({
        amount: ambilAmount,
        note: `Ambil Tabungan - ${ambilKeterangan}`, // Menambahkan keterangan ke dalam riwayat
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    saveToLocalStorage();
    renderTabunganList();
    showNotification('Tabungan berhasil diambil!');
}

  

// Fungsi untuk menambah tabungan
function tambahTabungan(id) {
  const tabungan = tabunganList.find((t) => t.id === id);
  const addAmount = parseInt(document.getElementById(`addAmount${id}`).value.replace(/\./g, '')) || 0;

  if (!addAmount || isNaN(addAmount)) {
    alert('Jumlah tabungan tidak valid!');
    return;
  }

  let note = 'Tambah Tabungan';
  if (tabungan.history.length > 0) {
    const count = tabungan.history.length + 1;
    note = `Setoran ke-${count}`;
  }

  tabungan.terkumpul += addAmount;
  tabungan.history.push({
    amount: addAmount,
    note,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  });

  saveToLocalStorage();
  renderTabunganList();
}

// Fungsi untuk menghapus tabungan
let tabunganToDelete = null;

function hapusTabungan(id) {
  tabunganToDelete = id;
  document.getElementById('modalKonfirmasi').style.display = 'flex';
}

function hapusTabunganConfirm() {
  if (tabunganToDelete !== null) {
    const index = tabunganList.findIndex((tabungan) => tabungan.id === tabunganToDelete);
    if (index !== -1) {
      tabunganList.splice(index, 1);
      saveToLocalStorage();
      renderTabunganList();
    }
  }
  closeModal();
  tabunganToDelete = null;
}

function closeModal() {
  document.getElementById('modalKonfirmasi').style.display = 'none';
}

function resetForm() {
  document.getElementById('name').value = '';
  document.getElementById('target').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('type').value = 'harian';
  document.getElementById('date').value = '';
  document.getElementById('time').value = '';
  document.getElementById('description').value = '';
  document.getElementById('bukti').value = '';
  document.getElementById('previewBukti').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', renderTabunganList);
