// ─────────────────────────────────────────────────────────────────────────────
// prisma/seed.ts — TheKhatuMart complete database seed
// Run: npx ts-node prisma/seed.ts  OR  npm run seed
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🪔 Seeding TheKhatuMart database...\n");

  // ── 1. CATEGORIES ──────────────────────────────────────────────────────────
  console.log("📂 Creating categories...");

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "puja-samagri" },
      update: {},
      create: {
        name: "Puja Samagri", slug: "puja-samagri",
        description: "Complete range of authentic puja materials for all Hindu ceremonies.",
        imageUrl: "/images/categories/puja-samagri.jpg",
        sortOrder: 1, isActive: true,
        seoTitle: "Buy Pure Puja Samagri Online | TheKhatuMart",
        seoDesc: "Shop authentic temple-grade puja materials delivered to your door.",
      },
    }),
    prisma.category.upsert({
      where: { slug: "ghee-oils" },
      update: {},
      create: {
        name: "Ghee & Oils", slug: "ghee-oils",
        description: "Pure A2 cow ghee, sesame oil, mustard oil for puja and havan.",
        imageUrl: "/images/categories/ghee.jpg",
        sortOrder: 2, isActive: true,
        seoTitle: "Buy Pure Cow Ghee for Puja Online | TheKhatuMart",
        seoDesc: "Bilona method A2 ghee for havan, deepak, abhishek and cooking.",
      },
    }),
    prisma.category.upsert({
      where: { slug: "hawan-materials" },
      update: {},
      create: {
        name: "Hawan Materials", slug: "hawan-materials",
        description: "Complete havan samagri including samidha, herbs, and kund.",
        imageUrl: "/images/categories/hawan.jpg",
        sortOrder: 3, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "phool-pattiya" },
      update: {},
      create: {
        name: "Phool & Pattiya", slug: "phool-pattiya",
        description: "Fresh flowers, garlands, and sacred leaves for daily puja.",
        imageUrl: "/images/categories/flowers.jpg",
        sortOrder: 4, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "prashad" },
      update: {},
      create: {
        name: "Prashad", slug: "prashad",
        description: "Ladoo, mishri, batasha and other sacred offerings.",
        imageUrl: "/images/categories/prashad.jpg",
        sortOrder: 5, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "idols-books" },
      update: {},
      create: {
        name: "Idols & Books", slug: "idols-books",
        description: "Brass and marble idols, religious books and scriptures.",
        imageUrl: "/images/categories/idols.jpg",
        sortOrder: 6, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "sugandhit" },
      update: {},
      create: {
        name: "Sugandhit", slug: "sugandhit",
        description: "Agarbatti, dhoop, guggul, camphor and incense products.",
        imageUrl: "/images/categories/agarbatti.jpg",
        sortOrder: 7, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "utensils" },
      update: {},
      create: {
        name: "Utensils", slug: "utensils",
        description: "Copper, brass and silver puja utensils — kalash, thali, diya.",
        imageUrl: "/images/categories/utensils.jpg",
        sortOrder: 8, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "festival-kits" },
      update: {},
      create: {
        name: "Festival Kits", slug: "festival-kits",
        description: "Ready-made kits for Navratri, Diwali, Janmashtami and more.",
        imageUrl: "/images/categories/festival.jpg",
        sortOrder: 9, isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "vastra-shringar" },
      update: {},
      create: {
        name: "Vastra & Shringar", slug: "vastra-shringar",
        description: "Deity clothes, sindoor, roli, moli and decorative items.",
        imageUrl: "/images/categories/vastra.jpg",
        sortOrder: 10, isActive: true,
      },
    }),
  ]);

  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.slug] = c.id; });
  console.log(`   ✓ ${categories.length} categories created`);

  // ── 2. PRODUCTS ────────────────────────────────────────────────────────────
  console.log("📦 Creating products...");

  const productsData = [
    // ── Ghee & Oils ──────────────────────────────────────────────────────────
    {
      name: "Pure A2 Cow Ghee", slug: "pure-a2-cow-ghee",
      shortDesc: "Bilona method · Temple Grade · Cold Pressed",
      description: "Made using traditional Bilona churning from free-range Gir cows. Rich golden colour, naturally grainy texture. Perfect for havan, deepak, abhishek, Panchamrit and cooking. FSSAI certified.",
      categorySlug: "ghee-oils", sku: "GHEE-A2-001",
      mrp: 349, price: 299, costPrice: 180, gstPct: 5, hsnCode: "0405",
      stock: 240, lowStockAt: 20, weight: 550, isFeatured: true, status: "active" as const,
      tags: ["best-seller", "a2-ghee", "havan", "bilona", "organic"],
      seoTitle: "Buy Pure A2 Cow Ghee for Puja Online | TheKhatuMart",
      seoDesc: "100% pure A2 Bilona ghee from Gir cows. Temple-grade quality for havan, deepak & cooking.",
      variants: [
        { label: "250ml", sku: "GHEE-A2-250", price: 179, mrp: 220, stock: 80 },
        { label: "500ml", sku: "GHEE-A2-500", price: 299, mrp: 349, stock: 120 },
        { label: "1 Litre", sku: "GHEE-A2-1L", price: 549, mrp: 649, stock: 68 },
        { label: "2 Litre", sku: "GHEE-A2-2L", price: 999, mrp: 1199, stock: 24 },
      ],
    },
    {
      name: "Til (Sesame) Oil for Puja", slug: "til-sesame-oil-puja",
      shortDesc: "Cold-pressed · Pure · Unrefined",
      description: "Pure cold-pressed sesame oil traditionally used in Shani puja, Hanuman puja, and as deepak oil. Ideal for Navratri and Saturday rituals.",
      categorySlug: "ghee-oils", sku: "OIL-TIL-001",
      mrp: 199, price: 149, costPrice: 90, gstPct: 5, hsnCode: "1515",
      stock: 180, lowStockAt: 15, weight: 260, isFeatured: false, status: "active" as const,
      tags: ["sesame-oil", "shani-puja", "deepak"],
    },
    // ── Hawan Materials ───────────────────────────────────────────────────────
    {
      name: "Complete Hawan Samagri Kit", slug: "complete-hawan-samagri-kit",
      shortDesc: "24 sacred herbs · Vedic blend · Ready to use",
      description: "Authentic blend of 24 Vedic herbs including Guggul, Loban, Kapoor, Tagar, Nagkesar, Shatavari and more. Prepared by Ayurvedic experts. Suitable for all havan ceremonies.",
      categorySlug: "hawan-materials", sku: "HAWAN-KIT-001",
      mrp: 649, price: 499, costPrice: 300, gstPct: 5, hsnCode: "1211",
      stock: 145, lowStockAt: 10, weight: 1100, isFeatured: true, status: "active" as const,
      tags: ["best-seller", "hawan", "vedic", "herbs"],
      seoTitle: "Complete Hawan Samagri Kit Online | TheKhatuMart",
      seoDesc: "24 sacred Vedic herbs for all havan ceremonies. Authentic Ayurvedic preparation.",
      variants: [
        { label: "500g Kit", sku: "HAWAN-KIT-500", price: 499, mrp: 649, stock: 80 },
        { label: "1kg Kit",  sku: "HAWAN-KIT-1K",  price: 899, mrp: 1199, stock: 45 },
        { label: "2kg Kit",  sku: "HAWAN-KIT-2K",  price: 1699, mrp: 2199, stock: 20 },
      ],
    },
    {
      name: "Hawan Kund (Copper)", slug: "hawan-kund-copper",
      shortDesc: "Pure copper · Square · Traditional design",
      description: "Pure copper havan kund in traditional square design. Available in multiple sizes. Copper enhances the spiritual energy of the havan.",
      categorySlug: "hawan-materials", sku: "KUND-COP-001",
      mrp: 899, price: 749, costPrice: 450, gstPct: 12, hsnCode: "7419",
      stock: 65, lowStockAt: 8, weight: 800, isFeatured: false, status: "active" as const,
      tags: ["copper", "hawan-kund", "ceremony"],
      variants: [
        { label: "Small (6 inch)",  sku: "KUND-COP-S", price: 749,  mrp: 899,  stock: 30 },
        { label: "Medium (9 inch)", sku: "KUND-COP-M", price: 1249, mrp: 1499, stock: 25 },
        { label: "Large (12 inch)", sku: "KUND-COP-L", price: 1999, mrp: 2399, stock: 10 },
      ],
    },
    {
      name: "Aam (Mango) Samidha", slug: "aam-samidha-hawan",
      shortDesc: "Dried mango wood · 108 sticks · Pure",
      description: "Dried mango wood sticks (samidha) for havan. Mango wood is considered most auspicious for all fire rituals. 108 sticks per pack.",
      categorySlug: "hawan-materials", sku: "SAMIDHA-AAM-001",
      mrp: 149, price: 99, costPrice: 55, gstPct: 5, hsnCode: "4401",
      stock: 320, lowStockAt: 30, weight: 600, isFeatured: false, status: "active" as const,
      tags: ["samidha", "mango-wood", "hawan"],
    },
    // ── Puja Samagri ──────────────────────────────────────────────────────────
    {
      name: "Satyanarayan Puja Kit", slug: "satyanarayan-puja-kit",
      shortDesc: "Complete kit · All materials included · Ready to use",
      description: "Complete Satyanarayan Puja kit with all required materials: panchamrit ingredients, flowers, fruits, dhoop, agarbatti, roli, moli, and more. Everything in one box.",
      categorySlug: "puja-samagri", sku: "PUJA-SAT-001",
      mrp: 599, price: 449, costPrice: 270, gstPct: 5, hsnCode: "3307",
      stock: 95, lowStockAt: 10, weight: 1500, isFeatured: true, status: "active" as const,
      tags: ["satyanarayan", "puja-kit", "complete", "festival"],
      seoTitle: "Satyanarayan Puja Kit Online | Complete Materials | TheKhatuMart",
      seoDesc: "Complete Satyanarayan Puja kit with all required materials. Delivered to your door.",
    },
    {
      name: "Rudrabhishek Puja Kit", slug: "rudrabhishek-puja-kit",
      shortDesc: "Shiva abhishek · All 11 ingredients · Authentic",
      description: "Complete Rudrabhishek kit with all 11 abhishek materials: milk, curd, ghee, honey, sugar, gangajal, rosewater, belpatra, datura, dhatura seeds, camphor.",
      categorySlug: "puja-samagri", sku: "PUJA-RUD-001",
      mrp: 499, price: 349, costPrice: 210, gstPct: 5, hsnCode: "3307",
      stock: 85, lowStockAt: 8, weight: 1200, isFeatured: true, status: "active" as const,
      tags: ["rudrabhishek", "shiva", "puja-kit"],
    },
    {
      name: "Navratri Puja Kit", slug: "navratri-puja-kit",
      shortDesc: "9-day puja · Mata rani special · Complete",
      description: "Special Navratri kit for 9-day puja including Durga Saptashati book, red dupatta, 9 chunri, sindoor, roli, akshat, coconut, camphor, dhoop, and agarbatti.",
      categorySlug: "festival-kits", sku: "FEST-NAV-001",
      mrp: 1099, price: 799, costPrice: 480, gstPct: 5, hsnCode: "3307",
      stock: 60, lowStockAt: 8, weight: 2000, isFeatured: true, status: "active" as const,
      tags: ["navratri", "festival", "mata-rani", "9-days"],
      seoTitle: "Navratri Puja Kit 2026 | Complete 9-Day Puja Package",
      seoDesc: "Complete Navratri kit for 9-day Mata puja. All materials in one box.",
    },
    {
      name: "Griha Pravesh Puja Kit", slug: "griha-pravesh-puja-kit",
      shortDesc: "New home ceremony · Complete samagri · Auspicious",
      description: "Complete samagri for Griha Pravesh ceremony. Includes havan samagri, kalash, mango leaves, coconut, rice, turmeric, kumkum, ghee, and all required puja materials.",
      categorySlug: "festival-kits", sku: "FEST-GP-001",
      mrp: 1299, price: 999, costPrice: 600, gstPct: 5, hsnCode: "3307",
      stock: 45, lowStockAt: 5, weight: 3000, isFeatured: true, status: "active" as const,
      tags: ["griha-pravesh", "new-home", "ceremony", "complete"],
    },
    // ── Sugandhit ─────────────────────────────────────────────────────────────
    {
      name: "Mangaldeep Agarbatti (Chandan)", slug: "mangaldeep-agarbatti-chandan",
      shortDesc: "Pure sandalwood · 40 sticks · Long burning",
      description: "Pure chandan (sandalwood) agarbatti with natural fragrance. 40 sticks per pack. Burns for 45 minutes each. Made with natural ingredients, no harmful chemicals.",
      categorySlug: "sugandhit", sku: "AGARB-CHAND-001",
      mrp: 99, price: 79, costPrice: 45, gstPct: 12, hsnCode: "3307",
      stock: 480, lowStockAt: 50, weight: 150, isFeatured: false, status: "active" as const,
      tags: ["agarbatti", "sandalwood", "chandan", "daily-puja"],
      variants: [
        { label: "40 sticks",  sku: "AGARB-CHAND-40",  price: 79,  mrp: 99,  stock: 200 },
        { label: "100 sticks", sku: "AGARB-CHAND-100", price: 179, mrp: 219, stock: 180 },
        { label: "200 sticks", sku: "AGARB-CHAND-200", price: 329, mrp: 399, stock: 100 },
      ],
    },
    {
      name: "Pure Camphor Tablets (Kapur)", slug: "pure-camphor-tablets-kapur",
      shortDesc: "100% pure · No additives · Long burning",
      description: "Pure camphor tablets for aarti and havan. Made from natural camphor without any added chemicals. Each tablet burns cleanly without leaving residue.",
      categorySlug: "sugandhit", sku: "KAPUR-001",
      mrp: 85, price: 65, costPrice: 38, gstPct: 12, hsnCode: "2914",
      stock: 560, lowStockAt: 50, weight: 100, isFeatured: false, status: "active" as const,
      tags: ["camphor", "kapur", "aarti", "havan"],
      variants: [
        { label: "50g",  sku: "KAPUR-50",  price: 65,  mrp: 85,  stock: 200 },
        { label: "100g", sku: "KAPUR-100", price: 119, mrp: 149, stock: 200 },
        { label: "250g", sku: "KAPUR-250", price: 249, mrp: 319, stock: 160 },
      ],
    },
    {
      name: "Guggul Dhoop Sticks", slug: "guggul-dhoop-sticks",
      shortDesc: "Traditional resin · Purifying · 20 sticks",
      description: "Traditional Guggul dhoop sticks for home purification and puja. Guggul resin is known for its air-purifying and spiritual benefits. No charcoal added.",
      categorySlug: "sugandhit", sku: "DHOOP-GUG-001",
      mrp: 120, price: 89, costPrice: 52, gstPct: 12, hsnCode: "3307",
      stock: 290, lowStockAt: 30, weight: 200, isFeatured: false, status: "active" as const,
      tags: ["guggul", "dhoop", "purification", "resin"],
    },
    // ── Phool & Pattiya ───────────────────────────────────────────────────────
    {
      name: "Tulsi Mala (108 Beads)", slug: "tulsi-mala-108-beads",
      shortDesc: "Holy basil · 108 beads · Handmade",
      description: "Handmade Tulsi (holy basil) mala with 108 genuine tulsi beads. Used for Vishnu, Krishna and Ram japa meditation. Blessed and energized.",
      categorySlug: "phool-pattiya", sku: "MALA-TUL-001",
      mrp: 199, price: 149, costPrice: 85, gstPct: 0, hsnCode: "4602",
      stock: 180, lowStockAt: 20, weight: 80, isFeatured: false, status: "active" as const,
      tags: ["tulsi", "mala", "japa", "108-beads", "krishna"],
    },
    {
      name: "Rudraksha Mala (5 Mukhi, 108 Beads)", slug: "rudraksha-mala-5-mukhi",
      shortDesc: "Natural · 5 Mukhi · Certified authentic",
      description: "Genuine 5 Mukhi Rudraksha mala with 108 beads. Lab certified for authenticity. 5 Mukhi represents Lord Shiva and is ideal for health, peace and meditation.",
      categorySlug: "phool-pattiya", sku: "MALA-RUD-5M-001",
      mrp: 499, price: 349, costPrice: 200, gstPct: 0, hsnCode: "4602",
      stock: 95, lowStockAt: 10, weight: 120, isFeatured: true, status: "active" as const,
      tags: ["rudraksha", "5-mukhi", "shiva", "mala", "certified"],
      variants: [
        { label: "5 Mukhi",  sku: "MALA-RUD-5M",  price: 349,  mrp: 499,  stock: 40 },
        { label: "7 Mukhi",  sku: "MALA-RUD-7M",  price: 699,  mrp: 999,  stock: 30 },
        { label: "9 Mukhi",  sku: "MALA-RUD-9M",  price: 1499, mrp: 1999, stock: 25 },
      ],
    },
    // ── Utensils ──────────────────────────────────────────────────────────────
    {
      name: "Copper Kalash with Lid", slug: "copper-kalash-with-lid",
      shortDesc: "Pure copper · 500ml · Auspicious",
      description: "Pure copper kalash (pitcher) with copper lid. Used in all major puja ceremonies as the sacred water vessel. Comes with 5 mango leaves and coconut arrangement.",
      categorySlug: "utensils", sku: "KALS-COP-001",
      mrp: 499, price: 399, costPrice: 240, gstPct: 12, hsnCode: "7419",
      stock: 120, lowStockAt: 10, weight: 450, isFeatured: false, status: "active" as const,
      tags: ["kalash", "copper", "ceremony", "auspicious"],
      variants: [
        { label: "Small (250ml)",  sku: "KALS-COP-S", price: 299, mrp: 399, stock: 50 },
        { label: "Medium (500ml)", sku: "KALS-COP-M", price: 399, mrp: 499, stock: 40 },
        { label: "Large (1L)",     sku: "KALS-COP-L", price: 599, mrp: 749, stock: 30 },
      ],
    },
    {
      name: "Brass Puja Thali Set (7-piece)", slug: "brass-puja-thali-set",
      shortDesc: "7 items · Pure brass · Engraved",
      description: "Complete 7-piece brass puja thali set: thali, kalash, diya (2), incense holder, bell, and sindoor dani. Beautiful floral engravings. Gift-box packaging.",
      categorySlug: "utensils", sku: "THALI-BRS-001",
      mrp: 999, price: 799, costPrice: 480, gstPct: 12, hsnCode: "8306",
      stock: 75, lowStockAt: 8, weight: 900, isFeatured: true, status: "active" as const,
      tags: ["thali", "brass", "gift", "set", "diya"],
    },
    {
      name: "Copper Diya Set (6 pieces)", slug: "copper-diya-set-6pcs",
      shortDesc: "Pure copper · 6 diyas · Traditional",
      description: "Set of 6 pure copper diyas for puja and aarti. Pure copper enhances positive energy. Each diya holds ghee or oil for at least 2 hours.",
      categorySlug: "utensils", sku: "DIYA-COP-6",
      mrp: 349, price: 249, costPrice: 150, gstPct: 12, hsnCode: "7419",
      stock: 195, lowStockAt: 20, weight: 350, isFeatured: false, status: "active" as const,
      tags: ["diya", "copper", "aarti", "set"],
    },
    // ── Prashad ───────────────────────────────────────────────────────────────
    {
      name: "Boondi Ladoo (Prashad Quality)", slug: "boondi-ladoo-prashad",
      shortDesc: "Temple quality · Fresh · 500g",
      description: "Fresh boondi ladoo prepared in pure ghee without any artificial colors or flavors. Temple-grade prashad quality. Best-before 7 days.",
      categorySlug: "prashad", sku: "PRASH-LAD-001",
      mrp: 220, price: 180, costPrice: 110, gstPct: 0, hsnCode: "1905",
      stock: 40, lowStockAt: 5, weight: 520, isFeatured: false, status: "active" as const,
      tags: ["ladoo", "prashad", "ghee", "fresh", "temple"],
      variants: [
        { label: "250g", sku: "PRASH-LAD-250", price: 100, mrp: 120, stock: 20 },
        { label: "500g", sku: "PRASH-LAD-500", price: 180, mrp: 220, stock: 15 },
        { label: "1kg",  sku: "PRASH-LAD-1K",  price: 340, mrp: 420, stock: 5  },
      ],
    },
    // ── Vastra & Shringar ──────────────────────────────────────────────────────
    {
      name: "Laddo Gopal Kapde (Size 2)", slug: "laddo-gopal-kapde-size-2",
      shortDesc: "Cotton silk · Hand-embroidered · Yellow",
      description: "Beautifully hand-embroidered cotton-silk dress set for Laddo Gopal (Bal Gopal). Includes top, dhoti, pagdi, and dupatta. Machine washable.",
      categorySlug: "vastra-shringar", sku: "VSTR-LG-S2",
      mrp: 299, price: 199, costPrice: 120, gstPct: 5, hsnCode: "6211",
      stock: 85, lowStockAt: 10, weight: 150, isFeatured: false, status: "active" as const,
      tags: ["laddo-gopal", "kapde", "dress", "krishna"],
      variants: [
        { label: "Size 0",  sku: "VSTR-LG-S0", price: 149, mrp: 199, stock: 20 },
        { label: "Size 2",  sku: "VSTR-LG-S2", price: 199, mrp: 299, stock: 30 },
        { label: "Size 4",  sku: "VSTR-LG-S4", price: 249, mrp: 349, stock: 25 },
        { label: "Size 6",  sku: "VSTR-LG-S6", price: 299, mrp: 399, stock: 10 },
      ],
    },
  ];

  let productCount = 0;
  for (const pd of productsData) {
    const { variants, categorySlug, ...data } = pd;
    await prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: {
        ...data,
        categoryId: catMap[categorySlug],
        variants: variants ? { create: variants.map(v => ({ ...v, isActive: true })) } : undefined,
      },
    });
    productCount++;
  }
  console.log(`   ✓ ${productCount} products created with variants`);

  // ── 3. USERS ───────────────────────────────────────────────────────────────
  console.log("👥 Creating users...");

  const hashedPassword = await bcrypt.hash("KhatuMart@2026", 12);

  const users = await Promise.all([
    // Super Admin
    prisma.user.upsert({
      where: { phone: "+919999000001" },
      update: {},
      create: {
        name: "Super Admin", phone: "+919999000001",
        email: "admin@thekhatumart.com",
        password: hashedPassword, role: "super_admin",
        isVerified: true, status: "active",
        loyaltyPoints: 0, loyaltyTier: "platinum",
      },
    }),
    // Admin
    prisma.user.upsert({
      where: { phone: "+919999000002" },
      update: {},
      create: {
        name: "Store Manager", phone: "+919999000002",
        email: "manager@thekhatumart.com",
        password: hashedPassword, role: "admin",
        isVerified: true, status: "active",
        loyaltyPoints: 0,
      },
    }),
    // Sample Customer 1 — Gold tier
    prisma.user.upsert({
      where: { phone: "+919876543210" },
      update: {},
      create: {
        name: "Rahul Sharma", phone: "+919876543210",
        email: "rahul.sharma@gmail.com",
        password: hashedPassword, role: "customer",
        isVerified: true, status: "active",
        loyaltyPoints: 2450, loyaltyTier: "gold",
        referralCode: "RAHUL50",
      },
    }),
    // Sample Customer 2 — Silver tier
    prisma.user.upsert({
      where: { phone: "+918765432109" },
      update: {},
      create: {
        name: "Priya Verma", phone: "+918765432109",
        email: "priya.verma@gmail.com",
        password: hashedPassword, role: "customer",
        isVerified: true, status: "active",
        loyaltyPoints: 850, loyaltyTier: "silver",
        referralCode: "PRIYA100",
      },
    }),
    // Sample Customer 3 — Platinum tier
    prisma.user.upsert({
      where: { phone: "+917654321098" },
      update: {},
      create: {
        name: "Amit Singh", phone: "+917654321098",
        email: "amit.singh@gmail.com",
        password: hashedPassword, role: "customer",
        isVerified: true, status: "active",
        loyaltyPoints: 12400, loyaltyTier: "platinum",
        referralCode: "AMIT200",
      },
    }),
    // Pandit User 1
    prisma.user.upsert({
      where: { phone: "+919111000001" },
      update: {},
      create: {
        name: "Pt. Ramesh Sharma", phone: "+919111000001",
        email: "pandit.ramesh@gmail.com",
        password: hashedPassword, role: "pandit",
        isVerified: true, status: "active",
        loyaltyPoints: 0,
      },
    }),
    // Pandit User 2
    prisma.user.upsert({
      where: { phone: "+919111000002" },
      update: {},
      create: {
        name: "Pt. Suresh Mishra", phone: "+919111000002",
        email: "pandit.suresh@gmail.com",
        password: hashedPassword, role: "pandit",
        isVerified: true, status: "active",
        loyaltyPoints: 0,
      },
    }),
    // Pandit User 3
    prisma.user.upsert({
      where: { phone: "+919111000003" },
      update: {},
      create: {
        name: "Pt. Vijay Pandey", phone: "+919111000003",
        email: "pandit.vijay@gmail.com",
        password: hashedPassword, role: "pandit",
        isVerified: true, status: "active",
        loyaltyPoints: 0,
      },
    }),
  ]);
  console.log(`   ✓ ${users.length} users created`);

  // ── 4. ADDRESSES ──────────────────────────────────────────────────────────
  console.log("📍 Creating addresses...");
  const rahulUser = users.find(u => u.phone === "+919876543210")!;
  await prisma.address.upsert({
    where: { id: "addr-rahul-home" },
    update: {},
    create: {
      id: "addr-rahul-home",
      userId: rahulUser.id,
      label: "Home", name: "Rahul Sharma",
      phone: "+919876543210",
      line1: "B-204, Palam Vihar", line2: "Vasant Kunj",
      city: "New Delhi", state: "Delhi",
      pin: "110070", isDefault: true,
    },
  });
  console.log("   ✓ Sample addresses created");

  // ── 5. PANDIT PROFILES ────────────────────────────────────────────────────
  console.log("🙏 Creating pandit profiles...");

  const panditUsers = users.filter(u => u.role === "pandit");

  const panditProfiles = [
    {
      userId: panditUsers[0].id,
      bio: "18+ years performing sacred ceremonies across Delhi NCR. Trained at Kashi Vishwanath temple under Pandit Shivprasad Tiwari. Known for punctuality and clear vidhi narration.",
      experience: 18, languages: ["Hindi", "Sanskrit"],
      specializations: ["Satyanarayan Katha", "Griha Pravesh", "Navgrah Shanti", "Vastu Puja"],
      city: "Delhi", serviceRadius: 40, basePrice: 2000,
      rating: 4.9, totalReviews: 412, totalBookings: 1820,
      commissionPct: 10, isVerified: true, isActive: true,
      upiId: "ramesh.sharma@hdfc",
    },
    {
      userId: panditUsers[1].id,
      bio: "24 years of Vedic practice specialising in Shiva rituals and marriage ceremonies. Fluent in English for NRI families. Served at Birla Mandir, Jaipur for 8 years.",
      experience: 24, languages: ["Hindi", "Sanskrit", "English"],
      specializations: ["Rudrabhishek", "Vivah Sanskar", "Maha Mrityunjaya Jaap", "Bhoomi Pujan"],
      city: "Jaipur", serviceRadius: 50, basePrice: 3000,
      rating: 5.0, totalReviews: 287, totalBookings: 1350,
      commissionPct: 10, isVerified: true, isActive: true,
      upiId: "suresh.mishra@sbi",
    },
    {
      userId: panditUsers[2].id,
      bio: "12 years specialising in child Sanskars. Creates a calm, joyful atmosphere. Based in Noida, available across NCR.",
      experience: 12, languages: ["Hindi", "Sanskrit"],
      specializations: ["Mundan Sanskar", "Namkaran", "Annaprashana", "Satyanarayan Katha"],
      city: "Noida", serviceRadius: 35, basePrice: 1500,
      rating: 4.8, totalReviews: 198, totalBookings: 890,
      commissionPct: 10, isVerified: true, isActive: true,
      upiId: "vijay.pandey@icici",
    },
  ];

  for (const profile of panditProfiles) {
    const created = await prisma.panditProfile.upsert({
      where: { userId: profile.userId },
      update: {},
      create: profile,
    });

    // Create services for each pandit
    const serviceTemplates: Record<number, Array<{name:string;description:string;duration:string;price:number;samagri:"platform"|"pandit"|"customer"}>> = {
      0: [
        { name: "Satyanarayan Katha",    description: "Complete Satyanarayan Puja with vidhi narration.", duration: "3-4 hrs", price: 2500, samagri: "platform" },
        { name: "Griha Pravesh",         description: "Auspicious home inauguration ceremony.",           duration: "2-3 hrs", price: 3500, samagri: "platform" },
        { name: "Navgrah Shanti Havan",  description: "Vedic havan to pacify all 9 planets.",            duration: "4-5 hrs", price: 4500, samagri: "pandit"   },
        { name: "Vastu Puja",            description: "Vastu correction puja for home/office.",          duration: "2 hrs",   price: 2000, samagri: "customer"  },
      ],
      1: [
        { name: "Rudrabhishek",          description: "Sacred Shiva abhishek with all 11 ingredients.",  duration: "2-3 hrs", price: 3500, samagri: "platform" },
        { name: "Vivah Sanskar",         description: "Complete Hindu wedding ceremony.",                 duration: "5-6 hrs", price: 11000, samagri: "platform" },
        { name: "Maha Mrityunjaya Jaap", description: "1008 or 11000 Mahamrityunjaya mantra jaap.",      duration: "3 hrs",   price: 4000, samagri: "pandit"   },
        { name: "Bhoomi Pujan",          description: "Ground-breaking ceremony for construction.",      duration: "1-2 hrs", price: 2500, samagri: "customer"  },
      ],
      2: [
        { name: "Mundan Sanskar",        description: "Child's first hair cutting ceremony.",             duration: "1-2 hrs", price: 2000, samagri: "platform" },
        { name: "Namkaran Ceremony",     description: "Baby naming ceremony with full vidhi.",           duration: "1 hr",    price: 1500, samagri: "platform" },
        { name: "Annaprashana",          description: "First rice feeding ceremony for baby.",           duration: "1 hr",    price: 1200, samagri: "customer"  },
        { name: "Satyanarayan Katha",    description: "Satyanarayan puja for special occasions.",        duration: "3 hrs",   price: 2000, samagri: "platform" },
      ],
    };

    const idx = panditProfiles.indexOf(profile);
    for (const svc of serviceTemplates[idx] || []) {
      await prisma.panditService.create({
        data: { panditId: created.id, ...svc, isActive: true },
      }).catch(() => {}); // ignore if already exists
    }
  }
  console.log(`   ✓ ${panditProfiles.length} pandit profiles with services created`);

  // ── 6. COUPONS ────────────────────────────────────────────────────────────
  console.log("🏷️  Creating coupons...");

  const coupons = [
    { code: "WELCOME100", type: "flat"    as const, value: 100, maxDiscount: 100,  minOrderValue: 299,  description: "₹100 off on your first order", usageLimit: 1,    isActive: true, expiresAt: new Date("2026-12-31") },
    { code: "DIWALI20",   type: "percent" as const, value: 20,  maxDiscount: 200,  minOrderValue: 500,  description: "20% off (max ₹200) — Diwali special", usageLimit: 500, isActive: true, expiresAt: new Date("2026-11-05") },
    { code: "NAVRATRI25", type: "percent" as const, value: 25,  maxDiscount: 300,  minOrderValue: 699,  description: "25% off for Navratri", usageLimit: 300, isActive: false, expiresAt: new Date("2026-10-11") },
    { code: "FREESHIP",   type: "shipping"as const, value: 0,   maxDiscount: 0,    minOrderValue: 0,    description: "Free shipping on any order", usageLimit: 1000, isActive: true, expiresAt: new Date("2026-12-31") },
    { code: "FIRST100",   type: "flat"    as const, value: 100, maxDiscount: 100,  minOrderValue: 300,  description: "₹100 off for first-time users", usageLimit: null, isActive: true, expiresAt: new Date("2026-12-31") },
    { code: "HAWAN30",    type: "percent" as const, value: 30,  maxDiscount: 150,  minOrderValue: 499,  description: "30% off on hawan products", usageLimit: 200, isActive: true, expiresAt: new Date("2026-12-31") },
    { code: "PANDIT50",   type: "flat"    as const, value: 50,  maxDiscount: 50,   minOrderValue: 1500, description: "₹50 off on pandit booking", usageLimit: null, isActive: true, expiresAt: new Date("2026-12-31") },
    { code: "BULK499",    type: "flat"    as const, value: 499, maxDiscount: 499,  minOrderValue: 2999, description: "₹499 off on orders above ₹2999", usageLimit: 100, isActive: true, expiresAt: new Date("2026-12-31") },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: coupon,
    });
  }
  console.log(`   ✓ ${coupons.length} coupons created`);

  // ── 7. SUMMARY ─────────────────────────────────────────────────────────────
  console.log("\n✅ Seeding complete!\n");
  console.log("─────────────────────────────────────");
  console.log("📊 Database Summary:");
  console.log(`   Categories : ${categories.length}`);
  console.log(`   Products   : ${productCount} (with variants)`);
  console.log(`   Users      : ${users.length}`);
  console.log(`   Pandits    : ${panditProfiles.length} (with services)`);
  console.log(`   Coupons    : ${coupons.length}`);
  console.log("─────────────────────────────────────\n");
  console.log("🔑 Login credentials (all users):");
  console.log("   Password: KhatuMart@2026\n");
  console.log("   Super Admin : +919999000001");
  console.log("   Admin       : +919999000002");
  console.log("   Customer 1  : +919876543210  (Rahul Sharma — Gold)");
  console.log("   Customer 2  : +918765432109  (Priya Verma — Silver)");
  console.log("   Customer 3  : +917654321098  (Amit Singh — Platinum)");
  console.log("   Pandit 1    : +919111000001  (Pt. Ramesh Sharma)");
  console.log("   Pandit 2    : +919111000002  (Pt. Suresh Mishra)");
  console.log("   Pandit 3    : +919111000003  (Pt. Vijay Pandey)");
  console.log("\n🏷️  Active Coupons:");
  console.log("   WELCOME100  — ₹100 off first order");
  console.log("   DIWALI20    — 20% off (max ₹200)");
  console.log("   FREESHIP    — Free shipping");
  console.log("   FIRST100    — ₹100 off any order");
  console.log("   HAWAN30     — 30% off hawan products");
  console.log("   PANDIT50    — ₹50 off pandit booking");
  console.log("   BULK499     — ₹499 off orders above ₹2999\n");
}

main()
  .catch(e => { console.error("❌ Seeding failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
  