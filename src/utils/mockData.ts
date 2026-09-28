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
    const hour = Math.floor(Math.random() * 12) + 8;
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const date = new Date(year, month, day, hour, minute, second);

    transactions.push({
      id: `INV-TERRA-${1790000000 + currentId++}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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

  const productList = [
    { id: "terragis_sub_monthly", name: "Paket Perbulan", amount: 49000 },
    { id: "terragis_sub_yearly", name: "Paket Pertahun", amount: 150000 },
    { id: "terragis_sub_lifetime", name: "Paket Selamanya", amount: 350000 },
    { id: "terragis_sub_group", name: "Paket Bersama (5 User)", amount: 500000 },
  ];

  // Generate realistic monthly transactions across the year
  for (let month = 0; month < 12; month++) {
    const daysInMonth = 28;
    // Monthly subscriptions
    for (let i = 0; i < 25; i++) {
      addTx("terragis_sub_monthly", "Paket Perbulan", 49000, "Success", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
    // Yearly subscriptions
    for (let i = 0; i < 10; i++) {
      addTx("terragis_sub_yearly", "Paket Pertahun", 150000, "Success", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
    // Lifetime subscriptions
    for (let i = 0; i < 4; i++) {
      addTx("terragis_sub_lifetime", "Paket Selamanya", 350000, "Success", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
    // Group subscriptions
    for (let i = 0; i < 2; i++) {
      addTx("terragis_sub_group", "Paket Bersama (5 User)", 500000, "Success", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
    // Non-success statuses
    for (let i = 0; i < 4; i++) {
      const p = productList[Math.floor(Math.random() * productList.length)];
      addTx(p.id, p.name, p.amount, "Pending", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
    for (let i = 0; i < 2; i++) {
      const p = productList[Math.floor(Math.random() * productList.length)];
      addTx(p.id, p.name, p.amount, "Failed", month, Math.floor(Math.random() * daysInMonth) + 1);
    }
  }

  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
