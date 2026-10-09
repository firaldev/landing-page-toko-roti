/* ============================================================
   toko-roti/site.js — merakit halaman dari content.json.
   ES module. Tidak ada console.* di sini.
   ============================================================ */
import {
  waLink,
  loadContent,
  initFaq,
  initMobileNav,
  initCopyButtons,
  setYear,
  esc,
} from "../shared/utils.js";
import { navbarHTML } from "../shared/components/navbar.js";
import { footerHTML } from "../shared/components/footer.js";
import { sectionHeadHTML } from "../shared/components/section-head.js";

/* Cadangan bila content.json gagal dimuat — sama strukturnya. */
const FALLBACK = {
  brand: { mark: "TR", name: "Tungku Roti", tagline: "Roti segar dari oven setiap pagi." },
  whatsapp: "6281234567890",
  whatsappNote: "TODO: ganti dengan nomor WhatsApp asli toko",
  nav: {
    links: [
      { href: "#beranda", label: "Beranda" },
      { href: "#produk", label: "Produk" },
      { href: "#paket", label: "Paket" },
      { href: "#faq", label: "FAQ" },
      { href: "#kontak", label: "Kontak" },
    ],
    cta: { label: "Pesan lewat WhatsApp" },
  },
  hero: {
    eyebrow: "Toko roti rumahan — dipanggang setiap hari",
    title: "Roti hangat keluar oven, siap diantar sampai pintu.",
    desc: "Kami memanggang dua kali sehari: pagi untuk sarapan, sore untuk bekal esok.",
    ctaLabel: "Pesan lewat WhatsApp",
    note: "Pesanan hari ini tutup pukul 17.00.",
    ovenTimes: [
      { label: "Oven pagi", time: "06.00 WIB" },
      { label: "Oven sore", time: "15.00 WIB" },
    ],
  },
  products: {
    index: "01", eyebrow: "MENU HARIAN", title: "Roti andalan kami",
    desc: "Dipanggang fresh setiap hari.",
    items: [{ badge: "Terlaris", name: "Roti Sobek Cokelat", desc: "Lembut dengan isian cokelat lumer.", price: 18000, unit: "loyang" }],
  },
  packages: {
    index: "02", eyebrow: "ACARA & HADIAH", title: "Paket ulang tahun & hampers",
    desc: "Untuk ulang tahun, hajatan, atau bingkisan.",
    items: [{ name: "Paket Kue Ulang Tahun", desc: "Kue bolu 20 cm lengkap dengan lilin dan kartu ucapan.", price: 150000, unit: "paket", includes: ["Kue bolu 20 cm", "Lilin + kartu ucapan"] }],
  },
  preorder: {
    index: "03", eyebrow: "CARA PESAN", title: "Pre-order H-2 untuk acara",
    desc: "Roti acara dan kue ulang tahun dibuat sesuai pesanan.",
    deadline: "Batas pemesanan: maksimal H-2, pukul 17.00 WIB.",
    steps: [{ title: "Chat WhatsApp", desc: "Klik tombol Pesan, pesan otomatis terisi." }],
  },
  testimonials: {
    index: "04", eyebrow: "KATA PELANGGAN", title: "Yang sudah mencoba",
    items: [{ name: "Pelanggan", role: "", text: "Rotinya enak dan selalu segar." }],
  },
  faq: {
    index: "05", eyebrow: "TANYA JAWAB", title: "Sering ditanyakan",
    items: [{ q: "Apakah bisa pesan dadakan?", a: "Bisa untuk menu harian selama stok ada." }],
  },
  contact: {
    index: "06", eyebrow: "KONTAK & LOKASI", title: "Mampir atau pesan dari rumah",
    note: "Balasan tercepat pada jam buka toko.",
    address: "Jl. Mawar No. 12, Cipinang, Jakarta Timur (TODO: ganti alamat asli)",
    hours: "Senin–Sabtu 07.00–19.00 · Minggu 07.00–15.00",
    mapQuery: "Toko Roti",
    ctaLabel: "Chat WhatsApp",
  },
  footer: {
    note: "Dipanggang dengan resep keluarga sejak 2014.",
    socials: [{ href: "https://instagram.com/", label: "Instagram" }],
  },
};

/* Format harga ala Indonesia: Rp18.000 */
function formatIDR(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}

/* Ikon roti dekoratif (SVG inline, bukan foto orang). */
const breadSVG = `
<svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">
  <ellipse cx="48" cy="62" rx="34" ry="20" fill="#a5581f"/>
  <ellipse cx="48" cy="56" rx="34" ry="20" fill="#d99a4e"/>
  <ellipse cx="48" cy="50" rx="30" ry="16" fill="#e8b568"/>
  <path d="M32 46c6-6 12-8 18-8M48 40c7 2 12 6 15 12M24 50c4-5 9-8 14-9" stroke="#8a4d1c" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`;

const ovenSVG = `
<svg viewBox="0 0 120 130" aria-hidden="true" focusable="false">
  <g stroke="#fff8ee" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.85">
    <path d="M40 28c-4-7 4-11 0-18"/>
    <path d="M60 28c-4-7 4-11 0-18"/>
    <path d="M80 28c-4-7 4-11 0-18"/>
  </g>
  <ellipse cx="60" cy="98" rx="42" ry="24" fill="#5b3413"/>
  <ellipse cx="60" cy="90" rx="42" ry="24" fill="#a5581f"/>
  <ellipse cx="60" cy="82" rx="36" ry="19" fill="#d99a4e"/>
  <path d="M38 74c8-8 16-10 24-10M62 66c9 2 15 8 18 15" stroke="#8a4d1c" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`;

/* ---------- Perakit seksi ---------- */

function heroHTML(c, wa) {
  const title = esc(c.hero.title).replace("hangat", "<em>hangat</em>");
  const chips = (c.hero.ovenTimes || [])
    .map(
      (t, i) =>
        `<span class="oven-chip oven-chip--${i === 0 ? "am" : "pm"}"><span class="flame" aria-hidden="true">🔥</span>${esc(t.label)} · <strong>${esc(t.time)}</strong></span>`
    )
    .join("");
  return `
  <div class="wrap hero-grid">
    <div>
      <p class="hero-eyebrow">${esc(c.hero.eyebrow)}</p>
      <h1 class="hero-title">${title}</h1>
      <p class="hero-desc">${esc(c.hero.desc)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${esc(waLink(wa, `Halo ${c.brand.name}! Saya mau pesan roti.`))}" target="_blank" rel="noopener noreferrer">${esc(c.hero.ctaLabel)}</a>
      </div>
      <p class="hero-note"><span class="dot" aria-hidden="true"></span>${esc(c.hero.note)}</p>
    </div>
    <div class="hero-art">
      <div class="oven-blob" role="img" aria-label="Ilustrasi roti hangat yang baru keluar dari oven">${ovenSVG}</div>
      ${chips}
    </div>
  </div>`;
}

function productsHTML(c, wa) {
  const cards = c.products.items
    .map((p) => {
      const msg = `Halo ${c.brand.name}! Saya mau pesan *${p.name}* (${formatIDR(p.price)}/${p.unit}).`;
      return `
      <article class="product-card">
        <div class="product-visual" aria-hidden="true">${breadSVG}</div>
        <div class="product-body">
          ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ""}
          <h3 class="product-name">${esc(p.name)}</h3>
          <p class="product-desc">${esc(p.desc)}</p>
          <div class="product-foot">
            <p class="product-price">${formatIDR(p.price)} <small>/${esc(p.unit)}</small></p>
            <a class="btn btn-primary" href="${esc(waLink(wa, msg))}" target="_blank" rel="noopener noreferrer">Pesan</a>
          </div>
        </div>
      </article>`;
    })
    .join("");
  return sectionHeadHTML({ index: c.products.index, eyebrow: c.products.eyebrow, title: "Roti andalan kami", desc: esc(c.products.desc) }) + `
  <div class="product-grid">${cards}</div>`;
}

function packagesHTML(c, wa) {
  const cards = c.packages.items
    .map((p) => {
      const msg = `Halo ${c.brand.name}! Saya mau pesan *${p.name}* (${formatIDR(p.price)}/${p.unit}).`;
      const list = (p.includes || []).map((i) => `<li>${esc(i)}</li>`).join("");
      return `
      <article class="card package-card">
        <h3>${esc(p.name)}</h3>
        <p class="section-desc">${esc(p.desc)}</p>
        <ul>${list}</ul>
        <p class="package-price">${formatIDR(p.price)} <small>/${esc(p.unit)}</small></p>
        <a class="btn btn-primary" href="${esc(waLink(wa, msg))}" target="_blank" rel="noopener noreferrer">Pesan paket ini</a>
      </article>`;
    })
    .join("");
  return sectionHeadHTML({ index: c.packages.index, eyebrow: c.packages.eyebrow, title: "Paket ulang tahun <em>&amp;</em> hampers", desc: esc(c.packages.desc) }) + `
  <div class="package-grid">${cards}</div>`;
}

function preorderHTML(c, wa) {
  const steps = c.preorder.steps
    .map(
      (s, i) => `
      <li>
        <p class="step-num">LANGKAH ${i + 1}</p>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </li>`
    )
    .join("");
  return `
  <div class="preorder-box">
    ${sectionHeadHTML({ index: c.preorder.index, eyebrow: c.preorder.eyebrow, title: "Pre-order H-2 untuk acara", desc: esc(c.preorder.desc) })}
    <p class="preorder-deadline"><span aria-hidden="true">⏰</span> ${esc(c.preorder.deadline)}</p>
    <ol class="steps">${steps}</ol>
  </div>`;
}

function testimonialsHTML(c) {
  const cards = c.testimonials.items
    .map(
      (t) => `
      <figure class="testi-card">
        <div class="testi-stars" aria-label="Penilaian 5 dari 5">★★★★★</div>
        <blockquote class="testi-text"><p>“${esc(t.text)}”</p></blockquote>
        <figcaption class="testi-who"><strong>${esc(t.name)}</strong>${t.role ? `<span>${esc(t.role)}</span>` : ""}</figcaption>
      </figure>`
    )
    .join("");
  return sectionHeadHTML({ index: c.testimonials.index, eyebrow: c.testimonials.eyebrow, title: "Yang sudah mencoba" }) + `
  <div class="testi-grid">${cards}</div>`;
}

function faqHTML(c) {
  const items = c.faq.items
    .map(
      (f, i) => `
      <div class="faq-item" data-faq-item>
        <button class="faq-q" data-faq-q aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${esc(f.q)}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </button>
        <div class="faq-a" data-faq-a id="faq-a-${i}">
          <p>${esc(f.a)}</p>
        </div>
      </div>`
    )
    .join("");
  return sectionHeadHTML({ index: c.faq.index, eyebrow: c.faq.eyebrow, title: "Sering ditanyakan" }) + `
  <div class="faq-list" data-faq>${items}</div>`;
}

function contactHTML(c, wa) {
  const mapURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.contact.mapQuery || c.contact.address)}`;
  return sectionHeadHTML({ index: c.contact.index, eyebrow: c.contact.eyebrow, title: "Mampir atau pesan dari rumah" }) + `
  <div class="contact-grid">
    <div class="contact-card">
      <h3>Kunjungi toko</h3>
      <address>
        <span><strong>Alamat:</strong> ${esc(c.contact.address)}</span>
        <span><strong>Jam buka:</strong> ${esc(c.contact.hours)}</span>
      </address>
      <div class="contact-actions">
        <a class="btn btn-outline" href="${esc(mapURL)}" target="_blank" rel="noopener noreferrer">Lihat di Google Maps</a>
      </div>
    </div>
    <div class="contact-card">
      <h3>Pesan dari rumah</h3>
      <p class="section-desc">${esc(c.contact.note)}</p>
      <div class="contact-actions">
        <a class="btn btn-primary" href="${esc(waLink(wa, `Halo ${c.brand.name}! Saya mau bertanya tentang pesanan.`))}" target="_blank" rel="noopener noreferrer">${esc(c.contact.ctaLabel)}</a>
        <button class="btn btn-outline" type="button" data-copy="${esc(wa)}">Salin nomor WA</button>
      </div>
    </div>
  </div>`;
}

/* Data terstruktur untuk SEO lokal. */
function injectJsonLd(c) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: c.brand.name,
    description: c.hero.desc,
    telephone: `+${String(c.whatsapp).replace(/\D/g, "")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.contact.address,
    },
    openingHours: ["Mo-Sa 07:00-19:00", "Su 07:00-15:00"],
    priceRange: "Rp",
    servesCuisine: "Roti & Kue",
  };
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

/* ---------- Jalankan ---------- */
async function init() {
  const notice = document.getElementById("content-notice");
  const c = await loadContent("content.json", FALLBACK, notice);
  const wa = c.whatsapp;

  document.getElementById("navbar-root").innerHTML = navbarHTML({
    brand: c.brand,
    links: c.nav.links,
    cta: {
      href: waLink(wa, `Halo ${c.brand.name}! Saya mau pesan roti.`),
      label: c.nav.cta.label,
    },
  });
  initMobileNav();

  document.getElementById("beranda").innerHTML = heroHTML(c, wa);
  document.getElementById("produk").innerHTML = `<div class="wrap">${productsHTML(c, wa)}</div>`;
  document.getElementById("paket").innerHTML = `<div class="wrap">${packagesHTML(c, wa)}</div>`;
  document.getElementById("preorder").innerHTML = `<div class="wrap">${preorderHTML(c, wa)}</div>`;
  document.getElementById("testimoni").innerHTML = `<div class="wrap">${testimonialsHTML(c)}</div>`;
  document.getElementById("faq").innerHTML = `<div class="wrap">${faqHTML(c)}</div>`;
  document.getElementById("kontak").innerHTML = `<div class="wrap">${contactHTML(c, wa)}</div>`;

  document.getElementById("footer-root").innerHTML = footerHTML({
    brand: c.brand,
    contact: {
      address: c.contact.address,
      hours: c.contact.hours,
      phone: String(wa),
    },
    socials: c.footer.socials,
    note: c.footer.note,
  });

  initFaq();
  initCopyButtons();
  setYear();
  injectJsonLd(c);
}

init();
