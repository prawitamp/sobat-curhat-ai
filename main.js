/**
 * ============================================================
 * SOBAT CURHAT AI — main.js
 * Proyek Akhir Perempuan Inovasi × IBM SkillsBuild 2026
 * ------------------------------------------------------------
 * Deskripsi:
 *   File ini menangani semua logika interaktif chatbot, mulai dari:
 *   1. Penangkapan input pengguna (siswa SMP)
 *   2. Manipulasi DOM untuk menampilkan balon chat
 *   3. Pemanggilan Gemini API (gemini-3.1-flash-lite) dengan fetch()
 *   4. Sistem safeguarding otomatis untuk situasi darurat
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// BAGIAN 1: KONFIGURASI API GEMINI
// ─────────────────────────────────────────────────────────────

/**
 * Placeholder ini akan OTOMATIS diganti oleh GitHub Actions
 * dengan API Key asli dari GitHub Repository Secret saat deploy.
 * Jangan ubah teks __GEMINI_API_KEY__ ini secara manual.
 */
const INJECTED_API_KEY = "__GEMINI_API_KEY__";

/**
 * Menggunakan key yang disuntikkan oleh GitHub Actions.
 */
function getGeminiAPIKey() {
  // Gunakan startsWith("__") untuk cek placeholder — aman dari sed yang mengganti semua teks
  const injected = INJECTED_API_KEY.startsWith("__") ? "" : INJECTED_API_KEY;
  return localStorage.getItem("SOBAT_CURHAT_GEMINI_API_KEY") || injected;
}

/**
 * Daftar model fallback yang akan dicoba secara berurutan
 * jika kuota model sebelumnya habis (error 429).
 * - gemini-3.1-flash-lite : 500 RPD (utama)
 * - gemini-2.5-flash-lite : 20 RPD (cadangan)
 * - gemini-1.5-flash      : standard free tier (terakhir)
 */
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];
let currentModelIndex = 0;

/**
 * Mendapatkan URL Endpoint Gemini berdasarkan model yang aktif saat ini.
 */
function getGeminiAPIURL() {
  const key = getGeminiAPIKey();
  const model = FALLBACK_MODELS[currentModelIndex];
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

// ─────────────────────────────────────────────────────────────
// REVISI BAGIAN 2: SYSTEM INSTRUCTION (ALUR SESI KONSELING REAL)
// ─────────────────────────────────────────────────────────────

/**
 * System Instruction yang telah direvisi agar AI bertindak sebagai 
 * konselor profesional dengan pendekatan konseling berpusat pada siswa 
 * (Student-Centered Counseling). AI akan menahan diri dari memberikan 
 * tips instan, melainkan mengeksplorasi akar masalah lewat pertanyaan 
 * reflektif yang mendalam hingga masalah clear.
 */
const SYSTEM_INSTRUCTION = `
Kamu adalah "Sobat Curhat AI", seorang Konselor Bimbingan Konseling (BK) virtual yang hangat, sabar, empatik, dan terlatih.
Kamu sedang melayani sesi konseling individu secara mandiri dan anonim dengan siswa SMP berusia 12–15 tahun di Indonesia yang sedang mengalami stres, cemas, akademik tertekan, atau peer pressure.

MISI UTAMA KAMU:
Bukan sekadar memberi jawaban instan, melainkan membangun sesi konseling yang sesungguhnya (deep counseling session) agar siswa merasa didengar secara utuh, terbantu menemukan akar masalahnya sendiri, dan mencapai resolusi/solusi yang benar-benar bersih (clear dari akarnya).

KEPRIBADIAN & GAYA KOMUNIKASI KAMU:
- Selalu gunakan sapaan "Kamu" (bukan "Anda") agar setara, akrab, dan mengurangi ketakutan siswa.
- Gunakan bahasa Indonesia yang ringan, kasual, santun, dan sangat menenangkan. Jangan pernah menggurui atau menceramahi.
- Gunakan maksimal 1-2 emoji yang hangat (seperti: 😊, ✨, 💙, 🥺) di setiap akhir respons agar terasa manusiawi.
- Buat respons yang ringkas dan fokus (maksimal 2-3 paragraf pendek) agar siswa tidak lelah membaca teks panjang. Jangan pernah memberikan daftar poin (bullet points) solusi di awal percakapan!

TAHAPAN SESI KONSELING (Wajib kamu ikuti secara berurutan seiring berjalannya chat):

Tahap 1: VALIDASI & REFLEKSI EMOSI (Awal Sesi)
- Saat siswa pertama kali cerita, fokus UTAMA kamu adalah memvalidasi perasaan mereka (misal: "Wajar banget kalau kamu merasa sedih/takut setelah kejadian itu...").
- Lakukan teknik refleksi perasaan agar siswa tahu bahwa emosinya dihargai dan dipahami secara utuh.

Tahap 2: EKSPLORASI MANDIRI & TANYA BALIK (Tengah Sesi - SANGAT PENTING)
- JANGAN langsung memberikan tips atau solusi komparatif. Tahan diri kamu.
- Ajukan SATU (1) pertanyaan terbuka yang reflektif di setiap respons untuk menggali akar masalah lebih dalam, membantu siswa mengenali pemicunya, atau mengecek apa yang sudah mereka lakukan.
- Contoh gaya bertanya balik layaknya konselor:
  * "Kalau boleh tahu, sejak kapan perasaan mengganjal ini mulai sering muncul?"
  * "Dari semua hal yang kamu ceritakan tadi, bagian mana yang rasanya paling berat atau paling bikin kamu kepikiran?"
  * "Sebelumnya, apa hal yang biasanya kamu lakukan kalau rasa cemas itu lagi datang menyerang?"
- Tanggapi dulu jawaban siswa dengan hangat, baru ajukan pertanyaan eksplorasi berikutnya. Jangan melompat ke tips sebelum siswa merasa siap.

Tahap 3: FASILITASI PROBLEM-SOLVING MANDIRI (Menuju Akhir Sesi)
- Setelah akar masalahnya mulai terlihat jelas (biasanya setelah 3-4 kali berbalas pesan), bantu siswa memikirkan solusinya sendiri terlebih dahulu (Insight).
- Tanyakan: "Menurut kamu pribadi, kira-kira langkah kecil apa yang bisa kita lakuin biar perasaan kamu agak enakan?"
- Jika siswa bingung, kamu baru boleh menawarkan 1 (satu) saran atau teknik regulasi emosi secara halus sebagai alternatif (misal: teknik pernapasan, menulis perasaan, atau teknik belajar pomodoro) dan tanyakan apakah tips itu masuk akal bagi mereka.

Tahap 4: EVALUASI & PENUTUP SESI (Masalah Clear)
- Sebelum menutup sesi, pastikan masalah sudah clear dengan bertanya: "Gimana perasaan kamu sekarang setelah kita ngobrol sejauh ini? Apakah masih ada hal lain yang mengganjal di hati kamu?"
- Jika siswa menyatakan sudah merasa lega, terbantu, atau mengucapkan penutup (seperti "makasih", "udah mendingan", "cukup", "oke"), berikan penguatan positif (reinforcement), puji keberanian mereka, dan tutup sesi dengan kalimat hangat bahwa pintu BK digital ini selalu terbuka kapan saja untuk mereka.

SAFEGUARDING (SANGAT PENTING - BATAS AMAN):
Jika di tengah sesi siswa menyebutkan kata kunci atau indikasi bahaya fisik/mental yang serius seperti:
- Bullying fisik: "dipukul", "dihajar", "diancam", "dipukuli", "dibully parah"
- Self-harm / Keinginan menyakiti diri sendiri atau mengakhiri hidup.
- Kekerasan domestik atau seksual.

Maka kamu wajib melakukan validasi krisis dengan sangat lembut, lalu pasang pesan eskalasi ini secara mutlak di akhir respons kamu:
"⚠️ PENTING: Kamu tidak harus menghadapi masalah seberat ini sendirian. Tolong klik tombol **'Chat Guru BK via WhatsApp'** di bagian bawah halaman ini sekarang juga ya. Guru BK di sekolah adalah orang dewasa terpercaya yang siap melindungi dan membantumu secara langsung tanpa menghakimi. Kamu sangat berharga, dan bantuan nyata ada untukmu. 💙"
`;


// ─────────────────────────────────────────────────────────────
// BAGIAN 3: PENYIMPANAN RIWAYAT PERCAKAPAN
// ─────────────────────────────────────────────────────────────

/**
 * Array ini menyimpan seluruh riwayat pesan dalam format yang
 * dimengerti oleh Gemini API (multi-turn conversation).
 * Setiap elemen adalah objek { role: "user"|"model", parts: [{text: "..."}] }
 */
const chatHistory = [];

// ─────────────────────────────────────────────────────────────
// BAGIAN 4: REFERENSI ELEMEN DOM
// Mengambil referensi ke komponen HTML yang akan dimanipulasi
// ─────────────────────────────────────────────────────────────
const chatMessagesEl = document.getElementById("chat-messages");
const userInputEl = document.getElementById("user-input");
const sendBtnEl = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");
const hamburgerBtn = document.getElementById("hamburger");
const navbarMenu = document.getElementById("navbar-menu");

// Elemen Modal Pengaturan API Key
const settingsBtnEl = document.getElementById("settings-btn");
const apiModalEl = document.getElementById("api-modal");
const closeModalBtnEl = document.getElementById("close-modal-btn");
const apiKeyInputEl = document.getElementById("api-key-input");
const saveKeyBtnEl = document.getElementById("save-key-btn");
const resetKeyBtnEl = document.getElementById("reset-key-btn");

// ─────────────────────────────────────────────────────────────
// BAGIAN 5: FUNGSI UTILITAS
// ─────────────────────────────────────────────────────────────

/**
 * Menggulir area chat ke posisi paling bawah secara otomatis.
 * Dipanggil setiap kali pesan baru ditambahkan agar siswa
 * selalu melihat pesan terbaru tanpa perlu scroll manual.
 */
function scrollToBottom() {
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

/**
 * Mendapatkan waktu saat ini dalam format jam:menit (contoh: 14:32).
 * Digunakan sebagai timestamp pada setiap balon chat.
 * @returns {string} Waktu dalam format HH:MM
 */
function getCurrentTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Mengonversi teks Markdown sederhana menjadi HTML.
 * Mendukung: **bold**, *italic*, dan baris baru.
 * Ini memastikan respons AI yang terformat tampil dengan benar.
 * @param {string} text - Teks mentah dari API
 * @returns {string} HTML yang sudah diformat
 */
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
    .replace(/\*(.*?)\*/g, "<em>$1</em>")              // *italic*
    .replace(/\n/g, "<br>");                            // baris baru
}

// ─────────────────────────────────────────────────────────────
// BAGIAN 6: MANIPULASI DOM — MENAMPILKAN BALON CHAT
// ─────────────────────────────────────────────────────────────

/**
 * Membuat dan menambahkan elemen balon chat baru ke dalam DOM.
 *
 * Fungsi ini adalah inti dari manipulasi DOM interaktif:
 * - Membuat elemen <div> secara dinamis dengan JavaScript
 * - Menambahkan kelas CSS yang sesuai (user-message / ai-message)
 * - Menyisipkan konten teks/HTML ke dalam elemen
 * - Menambahkan elemen ke dalam wadah chat
 * - Otomatis menggulir ke bawah
 *
 * @param {string} text    - Isi pesan yang akan ditampilkan
 * @param {string} sender  - "user" atau "ai"
 * @param {boolean} isHtml - Apakah teks sudah diformat sebagai HTML
 */
function appendMessage(text, sender, isHtml = false) {
  // Buat elemen container pesan utama
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  if (sender === "user") {
    // ── Balon Chat PENGGUNA (kanan, biru) ──
    messageDiv.classList.add("user-message");

    // Buat elemen balon teks
    const bubbleDiv = document.createElement("div");
    bubbleDiv.classList.add("message-bubble", "user-bubble");
    bubbleDiv.textContent = text; // User input ditampilkan apa adanya (plain text)

    // Buat timestamp
    const timeSpan = document.createElement("span");
    timeSpan.classList.add("message-time");
    timeSpan.textContent = getCurrentTime();

    // Susun elemen: balon chat + timestamp
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeSpan);

  } else {
    // ── Balon Chat AI (kiri, putih) ──
    messageDiv.classList.add("ai-message");

    // Buat avatar AI
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("message-avatar");
    avatarDiv.textContent = "🤖";

    // Buat elemen balon teks
    const bubbleDiv = document.createElement("div");
    bubbleDiv.classList.add("message-bubble", "ai-bubble");

    // Respons AI bisa berisi HTML (dari formatMarkdown)
    if (isHtml) {
      const para = document.createElement("p");
      para.innerHTML = text;
      bubbleDiv.appendChild(para);
    } else {
      bubbleDiv.textContent = text;
    }

    // Buat timestamp
    const timeSpan = document.createElement("span");
    timeSpan.classList.add("message-time");
    timeSpan.textContent = getCurrentTime();

    // Susun elemen: avatar + balon chat + timestamp
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeSpan);
  }

  // Tambahkan elemen pesan ke dalam area chat
  chatMessagesEl.appendChild(messageDiv);

  // Gulir ke bawah otomatis agar pesan terbaru terlihat
  scrollToBottom();
}

/**
 * Menampilkan animasi "mengetik..." (typing indicator) saat
 * AI sedang memproses permintaan ke Gemini API.
 * @param {boolean} show - true untuk tampilkan, false untuk sembunyikan
 */
function setTypingVisible(show) {
  typingIndicator.style.display = show ? "flex" : "none";
  if (show) scrollToBottom();
}

// ─────────────────────────────────────────────────────────────
// BAGIAN 7: PANGGILAN GEMINI API (INTI INTEGRASI AI)
// ─────────────────────────────────────────────────────────────

/**
 * Fungsi asinkronus utama yang mengirim pesan pengguna ke Gemini API
 * dan mengembalikan respons AI.
 *
 * Alur kerja:
 * 1. Simpan pesan pengguna ke riwayat chat (multi-turn)
 * 2. Susun payload JSON sesuai format Gemini API
 * 3. Kirim HTTP POST menggunakan Fetch API
 * 4. Ekstrak teks respons dari JSON
 * 5. Simpan respons AI ke riwayat chat
 * 6. Kembalikan teks respons
 *
 * @param {string} userMessage - Pesan yang diketik oleh pengguna
 * @returns {Promise<string>} Respons teks dari Gemini AI
 */
async function callGeminiAPI(userMessage) {
  // Tambahkan pesan pengguna ke riwayat percakapan
  chatHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  /**
   * Susun body request sesuai format Gemini API.
   * - systemInstruction: Kepribadian AI yang sudah kita definisikan
   * - contents: Seluruh riwayat percakapan (untuk konteks multi-turn)
   * - generationConfig: Pengaturan output AI
   */
  const requestBody = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: chatHistory,
    generationConfig: {
      temperature: 0.85,    // Tingkat kreativitas (0=deterministik, 1=kreatif)
      maxOutputTokens: 2048, // Naikkan agar respons tidak terpotong
      topP: 0.9,
      thinkingConfig: {
        thinkingBudget: 0,  // Matikan thinking tokens agar hemat kuota & respons lebih cepat
      },
    },
    safetySettings: [
      // Atur ambang batas konten berbahaya — BLOCK_NONE agar AI tetap bisa
      // merespons topik sensitif seperti self-harm dengan tepat (safeguarding)
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const apiKey = getGeminiAPIKey();
  if (!apiKey) {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }

  // Coba kirim ke model yang aktif, fallback ke model berikutnya jika kuota habis (429)
  while (currentModelIndex < FALLBACK_MODELS.length) {
    const response = await fetch(getGeminiAPIURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429 && currentModelIndex < FALLBACK_MODELS.length - 1) {
      // Kuota model saat ini habis — coba model berikutnya
      currentModelIndex++;
      console.warn(`⚠️ Kuota ${FALLBACK_MODELS[currentModelIndex - 1]} habis. Beralih ke ${FALLBACK_MODELS[currentModelIndex]}...`);
      continue;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error ${response.status}: ${errorData?.error?.message || response.statusText}`
      );
    }

    // Parsing respons JSON dari Gemini API
    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error("Respons AI kosong atau tidak valid.");
    }

    // Simpan respons AI ke riwayat percakapan untuk konteks multi-turn
    chatHistory.push({
      role: "model",
      parts: [{ text: aiText }],
    });

    return aiText;
  }

  throw new Error("Semua model AI sedang tidak tersedia karena kuota habis. Coba lagi besok.");
}

// ─────────────────────────────────────────────────────────────
// BAGIAN 8: HANDLER UTAMA PENGIRIMAN PESAN
// ─────────────────────────────────────────────────────────────

/**
 * Fungsi utama yang menangani keseluruhan alur pengiriman pesan:
 * 1. Validasi input (tidak boleh kosong)
 * 2. Tampilkan balon chat pengguna di DOM
 * 3. Nonaktifkan tombol kirim (hindari double-submit)
 * 4. Tampilkan typing indicator
 * 5. Panggil Gemini API
 * 6. Tampilkan respons AI di DOM
 * 7. Aktifkan kembali tombol kirim
 */
async function handleSendMessage() {
  // Ambil dan bersihkan nilai input pengguna
  const userText = userInputEl.value.trim();

  // Validasi: jangan proses jika input kosong
  if (!userText) return;

  // Bersihkan kolom input dan reset tinggi textarea ke default
  userInputEl.value = "";
  userInputEl.style.height = "auto";

  // Tampilkan pesan pengguna sebagai balon chat di sisi kanan (biru)
  appendMessage(userText, "user");

  // Nonaktifkan tombol kirim selama menunggu respons AI
  // Ini mencegah pengguna mengirim banyak pesan sebelum AI merespons
  sendBtnEl.disabled = true;

  // Tampilkan animasi "mengetik..."
  setTypingVisible(true);

  try {
    // Panggil Gemini API secara asinkronus dan tunggu responsnya
    const aiResponse = await callGeminiAPI(userText);

    // Sembunyikan typing indicator setelah respons diterima
    setTypingVisible(false);

    // Format teks Markdown dari AI menjadi HTML, lalu tampilkan
    const formattedResponse = formatMarkdown(aiResponse);
    appendMessage(formattedResponse, "ai", true);

  } catch (error) {
    // Tangani error dan tampilkan pesan ramah kepada pengguna
    setTypingVisible(false);
    console.error("Terjadi error saat memanggil Gemini API:", error);

    // Tampilkan pesan error yang informatif namun tetap ramah
    const errorMessage = error.message === "API_KEY_NOT_CONFIGURED"
      ? "Halo! Sepertinya Sobat Curhat AI belum dikonfigurasi oleh Guru BK. 🔧 Guru BK bisa mengatur API Key dengan klik tombol <strong>⚙️</strong> di pojok kanan atas kotak obrolan ini. Tenang ya, ini bukan salah kamu! 😊"
      : error.message.includes("API_KEY_INVALID") || error.message.includes("400")
        ? "Maaf, API Key yang dimasukkan tidak valid atau kuota habis. 🔧 Guru BK dapat memeriksa kembali API Key melalui tombol ⚙️ di atas ya!"
        : `Maaf, aku sedang mengalami gangguan teknis. Coba kirim pesanmu lagi sebentar ya! 😊 (Error: ${error.message})`;

    appendMessage(errorMessage, "ai", true);
  } finally {
    // Aktifkan kembali tombol kirim setelah proses selesai (berhasil maupun gagal)
    sendBtnEl.disabled = false;
    // Kembalikan fokus ke kolom input untuk kenyamanan pengguna
    userInputEl.focus();
  }
}

/**
 * Menampilkan Modal API Key
 */
function showApiModal() {
  apiModalEl.style.display = "flex";
  apiKeyInputEl.value = getGeminiAPIKey();
  apiKeyInputEl.focus();
}

/**
 * Menyembunyikan Modal API Key
 */
function hideApiModal() {
  apiModalEl.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
// BAGIAN 9: EVENT LISTENERS
// Menghubungkan interaksi pengguna dengan fungsi-fungsi di atas
// ─────────────────────────────────────────────────────────────

/**
 * Event Listener 1: Tombol Kirim diklik
 * Memicu pengiriman pesan saat tombol kirim (ikon pesawat) diklik.
 */
sendBtnEl.addEventListener("click", handleSendMessage);

/**
 * Event Listener 7: Pengaturan API Key (Modal) — opsional jika tombol ada
 */
if (settingsBtnEl) {
  settingsBtnEl.addEventListener("click", showApiModal);
}
closeModalBtnEl.addEventListener("click", hideApiModal);

// Tutup modal jika mengklik di luar area konten modal
apiModalEl.addEventListener("click", function (event) {
  if (event.target === apiModalEl) {
    hideApiModal();
  }
});

// Simpan API Key ke localStorage
saveKeyBtnEl.addEventListener("click", function () {
  const value = apiKeyInputEl.value.trim();
  if (!value) {
    alert("API Key tidak boleh kosong!");
    return;
  }
  localStorage.setItem("SOBAT_CURHAT_GEMINI_API_KEY", value);
  alert("API Key berhasil disimpan!");
  hideApiModal();
});

// Hapus API Key dari localStorage
resetKeyBtnEl.addEventListener("click", function () {
  if (confirm("Apakah Anda yakin ingin menghapus API Key?")) {
    localStorage.removeItem("SOBAT_CURHAT_GEMINI_API_KEY");
    apiKeyInputEl.value = "";
    alert("API Key telah dihapus!");
    hideApiModal();
  }
});

/**
 * Event Listener 2: Tombol Enter di keyboard
 * Memungkinkan pengguna mengirim pesan dengan menekan Enter.
 * Shift+Enter digunakan untuk baris baru (tidak mengirim pesan).
 */
userInputEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Cegah baris baru akibat Enter
    handleSendMessage();
  }
});

/**
 * Event Listener 3: Auto-resize textarea
 * Membuat kolom input membesar secara otomatis saat pengguna
 * mengetik teks yang panjang (multi-baris), hingga batas maksimum.
 */
userInputEl.addEventListener("input", function () {
  this.style.height = "auto"; // Reset tinggi terlebih dahulu
  this.style.height = Math.min(this.scrollHeight, 120) + "px"; // Terapkan tinggi baru
});

/**
 * Event Listener 4: Hamburger Menu (Mobile Navigation)
 * Membuka dan menutup menu navigasi pada tampilan ponsel.
 */
hamburgerBtn.addEventListener("click", function () {
  navbarMenu.classList.toggle("open");
  // Aksesibilitas: ubah aria-expanded
  const isOpen = navbarMenu.classList.contains("open");
  this.setAttribute("aria-expanded", isOpen.toString());
});

/**
 * Event Listener 5: Tutup menu mobile saat link nav diklik
 * Memastikan menu tertutup setelah pengguna memilih tujuan navigasi.
 */
document.querySelectorAll(".nav-link").forEach(function (link) {
  link.addEventListener("click", function () {
    navbarMenu.classList.remove("open");
  });
});

/**
 * Event Listener 6: Efek transparan/putih pada Navbar saat scroll
 * Navbar akan menambahkan bayangan lebih kuat saat halaman discroll ke bawah.
 */
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 30) {
    navbar.style.boxShadow = "0 4px 24px rgba(74,144,226,0.18)";
  } else {
    navbar.style.boxShadow = "0 2px 16px rgba(142,197,252,0.15)";
  }
});

// ─────────────────────────────────────────────────────────────
// BAGIAN 10: INISIALISASI (DIJALANKAN SAAT HALAMAN PERTAMA DIMUAT)
// ─────────────────────────────────────────────────────────────

/**
 * Fungsi inisialisasi yang dipanggil satu kali saat halaman dimuat.
 * - Memberi fokus pada kolom input agar siap diketik
 * - Memastikan semua komponen dalam keadaan siap
 */
(function init() {
  // Beri fokus pada input setelah halaman siap (opsional, hanya jika di atas fold)
  // userInputEl.focus();

  // Log singkat untuk debugging (akan muncul di Console browser)
  console.log("✅ Sobat Curhat AI berhasil dimuat.");
  if (!getGeminiAPIKey()) {
    console.log("💡 API Key belum dikonfigurasi. Guru BK dapat mengatur melalui tombol ⚙️ di chatbox.");
  }
})();
