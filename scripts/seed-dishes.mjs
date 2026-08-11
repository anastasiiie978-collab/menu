// Resets data/dishes.json to the original 39-item Suhbat menu and (re)downloads
// placeholder stock photos into public/uploads/dishes. Safe to re-run any time
// you want to wipe admin edits and start over from the source PPTX content.
//
// Usage: node scripts/seed-dishes.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT, "public", "uploads", "dishes");
const DATA_FILE = path.join(ROOT, "data", "dishes.json");

const categories = [
  { id: "c1", slug: "birinchi-taomlar", name: "Birinchi taomlar", sortOrder: 1 },
  { id: "c2", slug: "ikkinchi-taomlar", name: "Ikkinchi taomlar", sortOrder: 2 },
  { id: "c3", slug: "shashliklar", name: "Shashliklar", sortOrder: 3 },
  { id: "c4", slug: "salatlar", name: "Salatlar", sortOrder: 4 },
];

// unsplashId: photo id picked from Unsplash search results (free to use, no
// attribution required under the Unsplash license) matched to each dish.
const dishes = [
  // Birinchi taomlar (soups)
  { slug: "qoy-shorva", categoryId: "c1", name: "Qo'y sho'rva", description: "Qo'y go'shti, kartoshka, sabzi, ko'kat", price: 38000, unsplashId: "1608500219063-e5164085cd6f" },
  { slug: "mol-shorva", categoryId: "c1", name: "Mol sho'rva", description: "Mol go'shti, tozalangan bulyon", price: 36000, unsplashId: "1608500218861-01091cdc501e" },
  { slug: "mosh-xorda", categoryId: "c1", name: "Mosh xo'rda", description: "Mosh, guruch va mayda sabzavotlar", price: 28000, unsplashId: "1648455320791-a667c8aab7e4" },
  { slug: "qozi-shorva", categoryId: "c1", name: "Qo'zi sho'rva", description: "Yosh qo'zi go'shtidan, yengil", price: 45000, unsplashId: "1741796105489-33ea406ac1b7" },
  { slug: "mastava", categoryId: "c1", name: "Mastava", description: "Guruchli sho'rva, suzma bilan", price: 30000, unsplashId: "1702096393822-4da65b6a65c1" },
  { slug: "tushonka-shorva", categoryId: "c1", name: "Tushonka sho'rva", description: "Uy usulida, quyultirilgan go'sht", price: 32000, unsplashId: "1627054886476-0cdee47fde3d" },

  // Ikkinchi taomlar (mains)
  { slug: "jiz-qoy-goshti", categoryId: "c2", name: "Jiz — qo'y go'shti", description: "Qozonda cho'g'da qovurilgan qo'y go'shti", price: 95000, unsplashId: "1608500218882-986df81d55fc" },
  { slug: "qozon-kabob", categoryId: "c2", name: "Qozon kabob", description: "Qozonda pishirilgan go'sht va sabzavotlar", price: 85000, unsplashId: "1591386767153-987783380885" },
  { slug: "dimlama", categoryId: "c2", name: "Dimlama", description: "Go'sht va sabzavotlar, sekin dimlangan", price: 78000, unsplashId: "1534939561126-855b8675edd7" },
  { slug: "buglama", categoryId: "c2", name: "Bug'lama", description: "Bug'da pishirilgan go'sht va sabzavot", price: 88000, unsplashId: "1600180786608-28d06391d25c" },
  { slug: "qanot-dimlama", categoryId: "c2", name: "Qanot dimlama", description: "Tovuq qanoti, dimlangan", price: 62000, unsplashId: "1445979323117-80453f573b71" },
  { slug: "tabaka", categoryId: "c2", name: "Tabaka", description: "Presslangan tovuq, qovurilgan", price: 70000, unsplashId: "1606728035253-49e8a23146de" },
  { slug: "qovurma-lagmon", categoryId: "c2", name: "Qovurma lag'mon", description: "Qo'lda tortilgan lag'mon, go'sht va sabzavot bilan qovurilgan", price: 55000, unsplashId: "1607328874071-45a9cd600644" },
  { slug: "manti", categoryId: "c2", name: "Manti", description: "Bug'da pishirilgan go'shtli xamir", price: 48000, unsplashId: "1783699373378-4232eab55fba" },
  { slug: "bifshteks", categoryId: "c2", name: "Bifshteks", description: "Qiyma go'shtidan tayyorlangan steyk", price: 72000, unsplashId: "1664741319755-920c2c616bdb" },
  { slug: "bifstroganov", categoryId: "c2", name: "Bifstroganov", description: "Ingichka to'g'ralgan mol go'shti, sousda", price: 75000, unsplashId: "1644592219048-5c070fd3c91c" },

  // Shashliklar (priced per skewer)
  { slug: "qoy-shashlik", categoryId: "c3", name: "Qo'y shashlik", description: "", price: 32000, priceUnit: "1 sixga", unsplashId: "1603360946369-dc9bb6258143" },
  { slug: "mol-shashlik", categoryId: "c3", name: "Mol shashlik", description: "", price: 28000, priceUnit: "1 sixga", unsplashId: "1532636875304-0c89119d9b4d" },
  { slug: "qanot-shashlik", categoryId: "c3", name: "Qanot", description: "", price: 25000, priceUnit: "1 sixga", unsplashId: "1626323109252-0adb3b46692b" },
  { slug: "qiyma-shashlik", categoryId: "c3", name: "Qiyma", description: "", price: 22000, priceUnit: "1 sixga", unsplashId: "1595777216528-071e0127ccbf" },
  { slug: "jigar-shashlik", categoryId: "c3", name: "Jigar", description: "", price: 24000, priceUnit: "1 sixga", unsplashId: "1620167790054-de54f34308bb" },
  { slug: "tovuq-shashlik", categoryId: "c3", name: "Tovuq shashlik", description: "", price: 26000, priceUnit: "1 sixga", unsplashId: "1599487488170-d11ec9c172f0" },
  { slug: "dumba-shashlik", categoryId: "c3", name: "Dumba shashlik", description: "", price: 20000, priceUnit: "1 sixga", unsplashId: "1629117407975-d3bdfd26aa86" },
  { slug: "otbivnoy", categoryId: "c3", name: "Otbivnoy", description: "", price: 45000, priceUnit: "1 sixga", unsplashId: "1692106914421-e04e1066bd62" },
  { slug: "korejka", categoryId: "c3", name: "Korejka", description: "", price: 48000, priceUnit: "1 sixga", unsplashId: "1432139555190-58524dae6a55" },
  { slug: "shashlik-assorti", categoryId: "c3", name: "Shashlik assorti", description: "Turli xil shashliklar aralashmasi", price: 145000, unsplashId: "1676471980189-08de3e001215" },

  // Salatlar
  { slug: "achchiq-chuchuk", categoryId: "c4", name: "Achchiq-chuchuk", description: "Pomidor, piyoz", price: 22000, unsplashId: "1660991016747-b083fe0b0db4" },
  { slug: "sveji-salat", categoryId: "c4", name: "Sveji", description: "Yangi sabzavotlar", price: 24000, unsplashId: "1512621776951-a57141f2eefd" },
  { slug: "vilochki-salat", categoryId: "c4", name: "Vilochki", description: "", price: 22000, unsplashId: "1540420773420-3366772f4999" },
  { slug: "suzma-salat", categoryId: "c4", name: "Suzma", description: "", price: 20000, unsplashId: "1546069901-ba9599a7e63c" },
  { slug: "yozgi-assorti", categoryId: "c4", name: "Yozgi assorti", description: "Fasliy sabzavotlar aralashmasi", price: 38000, unsplashId: "1568158879083-c42860933ed7" },
  { slug: "mujskoy-kapriz", categoryId: "c4", name: "Mujskoy kapriz", description: "Go'sht, pishloq va sabzavot qatlamlari", price: 46000, unsplashId: "1692311358804-34b31f6ef43c" },
  { slug: "yaponcha-salat", categoryId: "c4", name: "Yaponcha", description: "", price: 44000, unsplashId: "1568158958563-c13c713d69f1" },
  { slug: "sezar-salat", categoryId: "c4", name: "Sezar", description: "", price: 42000, unsplashId: "1607532941433-304659e8198a" },
  { slug: "grecheskiy-salat", categoryId: "c4", name: "Grecheskiy", description: "", price: 40000, unsplashId: "1505253716362-afaea1d3d1af" },
  { slug: "olivye", categoryId: "c4", name: "Olivye", description: "", price: 30000, unsplashId: "1593895648796-9139c6bee45c" },
  { slug: "goshtli-assorti", categoryId: "c4", name: "Go'shtli assorti", description: "Sovuq go'sht taomlari aralashmasi", price: 85000, unsplashId: "1677476154977-f4cb9b772e67" },
  { slug: "mevali-assorti", categoryId: "c4", name: "Mevali assorti", description: "Fasliy mevalar aralashmasi", price: 55000, unsplashId: "1641642399576-487909d0ddbc" },
  { slug: "qirgovul-uyasi", categoryId: "c4", name: "Qirg'ovul uyasi", description: "", price: 52000, unsplashId: "1569760142069-bc6838de16c1" },
];

function unsplashUrl(id) {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&fm=jpg&fit=crop&crop=entropy`;
}

async function downloadPhoto(unsplashId, destPath) {
  const res = await fetch(unsplashUrl(unsplashId));
  if (!res.ok) throw new Error(`Failed to download ${unsplashId}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
}

async function main() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  const now = new Date().toISOString();
  const finalDishes = [];

  let i = 0;
  for (const d of dishes) {
    i += 1;
    const filename = `${d.slug}.jpg`;
    const destPath = path.join(UPLOADS_DIR, filename);
    process.stdout.write(`(${i}/${dishes.length}) ${d.name}... `);
    try {
      await downloadPhoto(d.unsplashId, destPath);
      console.log("ok");
    } catch (err) {
      console.log("FAILED: " + err.message);
    }
    finalDishes.push({
      id: d.slug,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description ?? "",
      price: d.price,
      priceUnit: d.priceUnit ?? null,
      photoUrl: `/uploads/dishes/${filename}`,
      soldOut: false,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    });
  }

  const menuData = { categories, dishes: finalDishes };
  await writeFile(DATA_FILE, JSON.stringify(menuData, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${finalDishes.length} dishes to ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
