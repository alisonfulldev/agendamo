const sharp = require("sharp");
const fs = require("fs");
const OUT = "public/examples/gallery";
const G = {
  acupuncture: [8313427, 6076112, 4353249, 8312859, 6076130, 8312889],
  aesthetics: [4586741, 5069612, 5069494, 7446659, 37229301, 30809943],
  "auto-detailing": [17623850, 29504462, 37809565, 17029940, 20042048, 32667420],
  barber: [1836983, 2076932, 7518731, 897265, 4625648, 7697224],
  beauty: [3993312, 3065171, 7755223, 7440054, 34885844, 7446659],
  chiropractic: [9558629, 4506109, 4506111, 4506217, 5473223, 5794021],
  consulting: [7979447, 5816300, 36765718, 7181178, 36733331, 36765719],
  dentistry: [16903641, 3946829, 6627447, 8413334, 3881296, 7800669],
  "integrative-therapy": [6998269, 6998280, 6998272, 19666192, 9146381, 6628649],
  "lash-brow": [8554941, 4207234, 7755531, 18186944],
  "massage-therapy": [6187653, 9146381, 18120174, 19666192, 19641818, 6628649],
  medical: [8460095, 7108327, 7108319, 7578797, 39192358],
  nails: [34835304, 34835283, 34885844, 34885842, 34871553, 7066298],
  nutrition: [15319047, 15319021, 15319019, 8844563, 8844553, 8844387],
  "occupational-therapy": [30483024, 30483021, 339619, 4506166, 30483061, 20860618],
  osteopathy: [4506169, 4506168, 4506074, 4506213, 4506216, 4506206],
  "personal-trainer": [40211337, 7444444, 6455906, 6455771, 6392833, 39219677],
  "pet-grooming": [19145894, 6130997, 6131161, 6131580, 19145879, 19145893],
  photography: [12811291, 20419519, 17094508, 1716835, 7206220],
  physio: [20860588, 20860610, 20860585, 29807423, 20860595, 20860616],
  pilates: [25599821, 18136885, 31509828],
  podiatry: [6448562, 5240641, 6628700, 4005311],
  psychoanalysis: [4100661, 4098221, 4098151, 23496443],
  psychology: [6255877, 7176318, 9065249, 7176319, 23496577, 7176288],
  psychopedagogy: [8923079, 8923156, 5212336, 8088087, 7156103, 8087853],
  "speech-therapy": [8088097, 30483031, 6990427, 7943971, 18512832, 16098693],
  "sports-court": [31012869, 35248286, 35248259, 38155778, 32897040, 35248469],
  tattoo: [428105, 5088459, 20832654, 2177016, 9676078, 6593479],
  tutoring: [6929208, 6502728, 6929206, 7079148, 5311407, 7979767],
  veterinary: [6234618, 7470634, 7469222, 6235231, 6234616, 7468978],
  yoga: [8436589, 8436725, 8436691, 3822668, 3984351],
};
(async () => {
  const sheets = {};
  let total = 0;
  for (const [key, ids] of Object.entries(G)) {
    const tiles = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const res = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop`);
      if (!res.ok) { console.log("FAIL", key, id, res.status); continue; }
      const webp = await sharp(Buffer.from(await res.arrayBuffer())).resize(700, 700, { fit: "cover" }).webp({ quality: 70 }).toBuffer();
      fs.writeFileSync(`${OUT}/${key}-${i + 1}.webp`, webp);
      total += webp.length;
      tiles.push(await sharp(webp).resize(120, 120).toBuffer());
    }
    sheets[key] = tiles;
  }
  // Review sheets: one row per niche, label at the left.
  const keys = Object.keys(sheets);
  for (let part = 0; part < Math.ceil(keys.length / 8); part++) {
    const rows = keys.slice(part * 8, part * 8 + 8);
    const comps = [];
    rows.forEach((key, r) => {
      comps.push({ input: Buffer.from(`<svg width="150" height="120"><text x="4" y="64" font-size="15" font-family="Arial">${key}</text></svg>`), left: 0, top: r * 124 });
      sheets[key].forEach((t, c) => comps.push({ input: t, left: 150 + c * 124, top: r * 124 }));
    });
    await sharp({ create: { width: 150 + 6 * 124, height: rows.length * 124, channels: 3, background: "#fff" } })
      .composite(comps).jpeg({ quality: 75 }).toFile(`${process.env.D}/gallery-${part + 1}.jpg`);
  }
  console.log("total", Math.round(total / 1024) + "KB");
})();
