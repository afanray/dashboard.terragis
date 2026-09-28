export interface DonationTransaction {
  id: string;
  productId: string;
  name: string;
  amount: number;
  currency: string;
  status: "Success" | "Pending" | "Failed" | "Cancelled";
  userName: string;
  userEmail: string;
  createdAt: string; // ISO String
}

const INDONESIAN_NAMES = [
  "Aditya Pratama", "Budi Santoso", "Dewi Lestari", "Eko Prasetyo", "Fitriani",
  "Hendra Wijaya", "Indah Permatasari", "Joko Susilo", "Kartika Sari", "Lukman Hakim",
  "Mega Utami", "Novi Ariyanti", "Oki Rahardjo", "Putri Wulandari", "Rian Hidayat",
  "Siti Aminah", "Taufik Hidayat", "Wahyu Hidayat", "Yudi Setiawan", "Zainal Abidin",
  "Amalia Putri", "Bambang Pamungkas", "Citra Kirana", "Dian Sastrowardoyo", "Ervan Kurniawan",
  "Farhan Halim", "Gita Gutawa", "Herianto", "Ika Nurjanah", "Joni Iskandar"
];

function getRandomName() {
  return INDONESIAN_NAMES[Math.floor(Math.random() * INDONESIAN_NAMES.length)];
}

function getEmailFromName(name: string) {
  const clean = name.toLowerCase().replace(/\s+/g, ".");
  const providers = ["gmail.com", "yahoo.com", "outlook.com", "terragis.io"];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  return `${clean}@${provider}`;
}

export function generateMockTransactions(): DonationTransaction[] {
  const transactions: DonationTransaction[] = [];
  let currentId = 1000;

  const addTx = (
    productId: string,
    name: string,
    amount: number,
    status: "Success" | "Pending" | "Failed" | "Cancelled",
    month: number, // 0-indexed: 0 = Jan, 11 = Dec
    day: number
  ) => {
    const txName = getRandomName();
    const txEmail = getEmailFromName(txName);
    
    // Construct valid timestamp for 2026
    const year = 2026;
    const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const date = new Date(year, month, day, hour, minute, second);

    transactions.push({
      id: `TX-${currentId++}`,
      productId,
      name,
      amount,
      currency: "IDR",
      status,
      userName: txName,
      userEmail: txEmail,
      createdAt: date.toISOString(),
    });
  };

  // We need to generate 1,245 successful transactions matching the mathematical distribution:
  // - 10k: 630 Success (100 in July, 530 in other months)
  // - 25k: 514 Success (90 in July, 424 in other months)
  // - 50k: 76 Success (10 in July, 66 in other months)
  // - 100k: 25 Success (5 in July, 20 in other months)

  // 1. July (Month = 6 in JS Date, i.e., July)
  // July total support = Rp4,250,000 (100*10k, 90*25k, 10*50k, 5*100k)
  for (let i = 0; i < 100; i++) {
    addTx("support_10000", "Dukungan Rp10.000", 10000, "Success", 6, Math.floor(Math.random() * 22) + 1);
  }
  for (let i = 0; i < 90; i++) {
    addTx("support_25000", "Dukungan Rp25.000", 25000, "Success", 6, Math.floor(Math.random() * 22) + 1);
  }
  for (let i = 0; i < 10; i++) {
    addTx("support_50000", "Dukungan Rp50.000", 50000, "Success", 6, Math.floor(Math.random() * 22) + 1);
  }
  for (let i = 0; i < 5; i++) {
    addTx("support_100000", "Dukungan Rp100.000", 100000, "Success", 6, Math.floor(Math.random() * 22) + 1);
  }

  // 2. Other months (Jan to Dec, excluding July)
  // Remaining successful distributions to allocate across Jan (0), Feb (1), Mar (2), Apr (3), May (4), Jun (5), Aug (7), Sep (8), Oct (9), Nov (10), Dec (11)
  const otherMonths = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11];

  // Rp10,000: 530 items
  for (let i = 0; i < 530; i++) {
    const m = otherMonths[i % otherMonths.length];
    addTx("support_10000", "Dukungan Rp10.000", 10000, "Success", m, Math.floor(Math.random() * 28) + 1);
  }

  // Rp25,000: 424 items
  for (let i = 0; i < 424; i++) {
    const m = otherMonths[i % otherMonths.length];
    addTx("support_25000", "Dukungan Rp25.000", 25000, "Success", m, Math.floor(Math.random() * 28) + 1);
  }

  // Rp50,000: 66 items
  for (let i = 0; i < 66; i++) {
    const m = otherMonths[i % otherMonths.length];
    addTx("support_50000", "Dukungan Rp50.000", 50000, "Success", m, Math.floor(Math.random() * 28) + 1);
  }

  // Rp100,000: 20 items
  for (let i = 0; i < 20; i++) {
    const m = otherMonths[i % otherMonths.length];
    addTx("support_100000", "Dukungan Rp100.000", 100000, "Success", m, Math.floor(Math.random() * 28) + 1);
  }

  // Add some Non-Successful transactions (Pending, Failed, Cancelled) to make filters and analytics realistic
  // Let's add:
  // - 60 Pending transactions
  // - 40 Failed transactions
  // - 35 Cancelled transactions
  const statuses: ("Pending" | "Failed" | "Cancelled")[] = ["Pending", "Failed", "Cancelled"];
  const counts = [60, 40, 35];
  const products = [
    { id: "support_10000", name: "Dukungan Rp10.000", val: 10000 },
    { id: "support_25000", name: "Dukungan Rp25.000", val: 25000 },
    { id: "support_50000", name: "Dukungan Rp50.000", val: 50000 },
    { id: "support_100000", name: "Dukungan Rp100.000", val: 100000 }
  ];

  for (let sIdx = 0; sIdx < statuses.length; sIdx++) {
    const status = statuses[sIdx];
    const count = counts[sIdx];
    for (let i = 0; i < count; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const month = Math.floor(Math.random() * 12);
      addTx(prod.id, prod.name, prod.val, status, month, Math.floor(Math.random() * 28) + 1);
    }
  }

  // Sort all transactions chronologically (latest first)
  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
