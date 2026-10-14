import {
  ChannelType,
  InventoryTransactionType,
  InvoiceStatus,
  OrderStatus,
  PaymentMethod,
  PaymentType,
  PrismaClient,
  PurchaseOrderStatus,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Fixed UUIDs for deterministic upserts
const ORG_ID = '00000000-0000-0000-0000-000000000001';

const USER_IDS = {
  admin: '10000000-0000-0000-0000-000000000001',
  sales: '10000000-0000-0000-0000-000000000002',
  warehouse: '10000000-0000-0000-0000-000000000003',
  finance: '10000000-0000-0000-0000-000000000004',
};

const WAREHOUSE_IDS = {
  kundli: '20000000-0000-0000-0000-000000000001',
  bhiwandi: '20000000-0000-0000-0000-000000000002',
};

const CATEGORY_IDS = {
  packagedFoods: '30000000-0000-0000-0000-000000000001',
  beverages: '30000000-0000-0000-0000-000000000002',
  personalCare: '30000000-0000-0000-0000-000000000003',
  homeCare: '30000000-0000-0000-0000-000000000004',
  dairyBakery: '30000000-0000-0000-0000-000000000005',
};

const VENDOR_IDS = {
  hul: '40000000-0000-0000-0000-000000000001',
  nestle: '40000000-0000-0000-0000-000000000002',
  itc: '40000000-0000-0000-0000-000000000003',
  dabur: '40000000-0000-0000-0000-000000000004',
  britannia: '40000000-0000-0000-0000-000000000005',
};

const CUSTOMER_IDS = {
  blinkit: '50000000-0000-0000-0000-000000000001',
  zepto: '50000000-0000-0000-0000-000000000002',
  swiggy: '50000000-0000-0000-0000-000000000003',
  amazon: '50000000-0000-0000-0000-000000000004',
  flipkart: '50000000-0000-0000-0000-000000000005',
  reliance: '50000000-0000-0000-0000-000000000006',
  dmart: '50000000-0000-0000-0000-000000000007',
  krishnaKirana: '50000000-0000-0000-0000-000000000008',
};

async function main() {
  console.log('Seeding Nudge ERP deterministic demo data...');

  const passwordHash = await bcrypt.hash('NudgeDemo2024!', 10);

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: {
      name: 'Sharma FMCG Distributors',
      legalName: 'Sharma FMCG Distribution Private Limited',
      gstin: '07AAACS1420P1ZP',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Plot 42, Okhla Industrial Area Phase-III',
      pincode: '110020',
      phone: '+91 11 4123 4567',
      email: 'contact@sharmafmcg.in',
      isDemo: true,
      isActive: true,
    },
    create: {
      id: ORG_ID,
      name: 'Sharma FMCG Distributors',
      legalName: 'Sharma FMCG Distribution Private Limited',
      gstin: '07AAACS1420P1ZP',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Plot 42, Okhla Industrial Area Phase-III',
      pincode: '110020',
      phone: '+91 11 4123 4567',
      email: 'contact@sharmafmcg.in',
      isDemo: true,
      isActive: true,
    },
  });

  // 2. Users & Memberships
  const usersData = [
    {
      id: USER_IDS.admin,
      email: 'admin@nudge-demo.com',
      firstName: 'Vikram',
      lastName: 'Sharma',
      role: UserRole.ORG_ADMIN,
    },
    {
      id: USER_IDS.sales,
      email: 'sales@nudge-demo.com',
      firstName: 'Pooja',
      lastName: 'Mehta',
      role: UserRole.SALES,
    },
    {
      id: USER_IDS.warehouse,
      email: 'warehouse@nudge-demo.com',
      firstName: 'Ramesh',
      lastName: 'Yadav',
      role: UserRole.WAREHOUSE,
    },
    {
      id: USER_IDS.finance,
      email: 'finance@nudge-demo.com',
      firstName: 'Neha',
      lastName: 'Agarwal',
      role: UserRole.FINANCE,
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        isDemoUser: true,
        isActive: true,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        isDemoUser: true,
        isActive: true,
      },
    });

    await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: org.id,
        },
      },
      update: {
        role: u.role,
        isActive: true,
      },
      create: {
        userId: user.id,
        organizationId: org.id,
        role: u.role,
        isActive: true,
      },
    });
  }

  // 3. Warehouses & Stock Locations
  const warehouses = [
    {
      id: WAREHOUSE_IDS.kundli,
      name: 'Central Distribution Center (CDC)',
      code: 'WH-DEL-01',
      address: 'Plot 104, HSIIDC Industrial Estate, Kundli',
      city: 'Sonipat',
      state: 'Haryana',
      pincode: '131028',
      isDefault: true,
      locations: ['Zone A - Fast Moving', 'Zone B - Bulk Pallets', 'Zone C - Temperature Controlled'],
    },
    {
      id: WAREHOUSE_IDS.bhiwandi,
      name: 'West Zone Hub',
      code: 'WH-MUM-01',
      address: 'Gala 12-15, Renaissance Logistics Park',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      pincode: '421302',
      isDefault: false,
      locations: ['Rack 01 - Biscuits', 'Rack 02 - Beverages', 'Dock Area'],
    },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { id: wh.id },
      update: {
        name: wh.name,
        code: wh.code,
        address: wh.address,
        city: wh.city,
        state: wh.state,
        pincode: wh.pincode,
        isDefault: wh.isDefault,
        isActive: true,
      },
      create: {
        id: wh.id,
        organizationId: org.id,
        name: wh.name,
        code: wh.code,
        address: wh.address,
        city: wh.city,
        state: wh.state,
        pincode: wh.pincode,
        isDefault: wh.isDefault,
        isActive: true,
      },
    });

    for (let i = 0; i < wh.locations.length; i++) {
      const locCode = `${wh.code}-LOC-0${i + 1}`;
      await prisma.stockLocation.upsert({
        where: {
          warehouseId_code: {
            warehouseId: wh.id,
            code: locCode,
          },
        },
        update: { name: wh.locations[i] },
        create: {
          warehouseId: wh.id,
          name: wh.locations[i],
          code: locCode,
          isActive: true,
        },
      });
    }
  }

  // 4. Product Categories
  const categories = [
    { id: CATEGORY_IDS.packagedFoods, name: 'Packaged Foods & Noodles' },
    { id: CATEGORY_IDS.beverages, name: 'Tea, Coffee & Beverages' },
    { id: CATEGORY_IDS.personalCare, name: 'Personal Care & Soaps' },
    { id: CATEGORY_IDS.homeCare, name: 'Home Care & Detergents' },
    { id: CATEGORY_IDS.dairyBakery, name: 'Biscuits, Bakery & Dairy' },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: {
        id: cat.id,
        organizationId: org.id,
        name: cat.name,
        isActive: true,
      },
    });
  }

  // 5. 5 Vendors
  const vendors = [
    {
      id: VENDOR_IDS.nestle,
      legalName: 'Nestle India Limited',
      tradingName: 'Nestle',
      contactPerson: 'Arun Kulkarni',
      email: 'arun.kulkarni@in.nestle.com',
      phone: '+91 124 4567890',
      address: 'Nestle House, Jacaranda Marg, DLF Phase II',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      gstin: '06AAACN0142A1ZG',
      panNumber: 'AAACN0142A',
      paymentTermDays: 30,
      leadTimeDays: 5,
    },
    {
      id: VENDOR_IDS.hul,
      legalName: 'Hindustan Unilever Limited',
      tradingName: 'HUL',
      contactPerson: 'Suresh Menon',
      email: 'orders.north@unilever.com',
      phone: '+91 22 3983 0000',
      address: 'B.D. Sawant Marg, Chakala, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400099',
      gstin: '27AAACH1111A1Z2',
      panNumber: 'AAACH1111A',
      paymentTermDays: 45,
      leadTimeDays: 7,
    },
    {
      id: VENDOR_IDS.itc,
      legalName: 'ITC Limited (Foods Division)',
      tradingName: 'ITC',
      contactPerson: 'Deepak Sen',
      email: 'supplychain.foods@itc.in',
      phone: '+91 33 2288 9371',
      address: 'Virginia House, 37 J.L. Nehru Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700071',
      gstin: '19AAACI2467F1ZN',
      panNumber: 'AAACI2467F',
      paymentTermDays: 30,
      leadTimeDays: 6,
    },
    {
      id: VENDOR_IDS.dabur,
      legalName: 'Dabur India Limited',
      tradingName: 'Dabur',
      contactPerson: 'Rajnish Goel',
      email: 'distributors@dabur.com',
      phone: '+91 120 398 2000',
      address: 'Kaushambi, Sahibabad Industrial Area',
      city: 'Ghaziabad',
      state: 'Uttar Pradesh',
      pincode: '201010',
      gstin: '09AAACD0133C1Z8',
      panNumber: 'AAACD0133C',
      paymentTermDays: 30,
      leadTimeDays: 4,
    },
    {
      id: VENDOR_IDS.britannia,
      legalName: 'Britannia Industries Limited',
      tradingName: 'Britannia',
      contactPerson: 'Mohan Bhatia',
      email: 'fmcg.orders@britindia.com',
      phone: '+91 80 3768 7100',
      address: '5/1A Hungerford Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560047',
      gstin: '29AAACB1456D1ZQ',
      panNumber: 'AAACB1456D',
      paymentTermDays: 30,
      leadTimeDays: 5,
    },
  ];

  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: { ...v, organizationId: org.id, isActive: true },
      create: { ...v, organizationId: org.id, isActive: true },
    });
  }

  // 6. 8 Customers
  const customers = [
    {
      id: CUSTOMER_IDS.blinkit,
      legalName: 'Blink Commerce Private Limited',
      tradingName: 'Blinkit Delhi Hub',
      contactPerson: 'Rohit Bansal',
      email: 'darkstores.delhi@blinkit.com',
      phone: '+91 98100 11223',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122018',
      gstin: '06AAGCB3728L1ZV',
      channelType: ChannelType.BLINKIT,
      externalId: 'BLINKIT-NCR-01',
      paymentTermDays: 15,
    },
    {
      id: CUSTOMER_IDS.zepto,
      legalName: 'KiranaKart Technologies Private Limited',
      tradingName: 'Zepto Mumbai Darkstores',
      contactPerson: 'Aditya Pal',
      email: 'procurement@zeptonow.com',
      phone: '+91 98200 44556',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      gstin: '27AAECK4509F1ZL',
      channelType: ChannelType.ZEPTO,
      externalId: 'ZEPTO-MUM-01',
      paymentTermDays: 15,
    },
    {
      id: CUSTOMER_IDS.swiggy,
      legalName: 'Bundl Technologies Private Limited',
      tradingName: 'Swiggy Instamart North',
      contactPerson: 'Kartik Varma',
      email: 'instamart.vendors@swiggy.in',
      phone: '+91 98300 77889',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110044',
      gstin: '07AAGCB2319G1ZX',
      channelType: ChannelType.SWIGGY_INSTAMART,
      externalId: 'SWIGGY-DEL-02',
      paymentTermDays: 15,
    },
    {
      id: CUSTOMER_IDS.amazon,
      legalName: 'Amazon Retail India Private Limited',
      tradingName: 'Amazon Fresh Fulfillment',
      contactPerson: 'Manoj Joshi',
      email: 'fresh-invoices@amazon.com',
      phone: '+91 80 4123 9999',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110037',
      gstin: '07AABCA7766K1ZT',
      channelType: ChannelType.AMAZON,
      externalId: 'AMZN-DEL-FC4',
      paymentTermDays: 30,
    },
    {
      id: CUSTOMER_IDS.flipkart,
      legalName: 'Flipkart India Private Limited',
      tradingName: 'Flipkart Wholesale',
      contactPerson: 'Anand Nair',
      email: 'b2b.ap@flipkart.com',
      phone: '+91 80 6787 1111',
      city: 'Faridabad',
      state: 'Haryana',
      pincode: '121003',
      gstin: '06AAACF0342M1ZP',
      channelType: ChannelType.FLIPKART,
      externalId: 'FK-WHL-FBD',
      paymentTermDays: 30,
    },
    {
      id: CUSTOMER_IDS.reliance,
      legalName: 'Reliance Retail Limited',
      tradingName: 'Smart Bazaar Supermarkets',
      contactPerson: 'Karan Singhal',
      email: 'invoicing.fmcg@relianceretail.com',
      phone: '+91 22 7967 0000',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      gstin: '09AABCR2418M1ZT',
      channelType: ChannelType.DIRECT,
      externalId: 'RRL-SMART-NOIDA',
      paymentTermDays: 45,
    },
    {
      id: CUSTOMER_IDS.dmart,
      legalName: 'Avenue Supermarts Limited',
      tradingName: 'DMart Regional Depot',
      contactPerson: 'Gopal Somani',
      email: 'orders.depot@dmartindia.com',
      phone: '+91 22 3340 0500',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '400604',
      gstin: '27AABCA2234P1Z3',
      channelType: ChannelType.DIRECT,
      externalId: 'DMART-THANE-01',
      paymentTermDays: 30,
    },
    {
      id: CUSTOMER_IDS.krishnaKirana,
      legalName: 'Krishna Kirana & General Store',
      tradingName: 'Krishna Traders',
      contactPerson: 'Radhey Shyam Gupta',
      email: 'krishna.kirana.delhi@gmail.com',
      phone: '+91 99112 33445',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110006',
      gstin: '07ABRPG3411R1ZU',
      channelType: ChannelType.WHOLESALE,
      externalId: 'TRD-DEL-601',
      paymentTermDays: 7,
    },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { ...c, organizationId: org.id, isActive: true },
      create: { ...c, organizationId: org.id, isActive: true },
    });
  }

  // 7. 22 Products with Realistic FMCG details & Pricing
  const products = [
    {
      id: '60000000-0000-0000-0000-000000000001',
      sku: 'PRD-MAGGI-70G',
      name: 'Maggi 2-Minute Masala Noodles 70g',
      brand: 'Nestle',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.nestle,
      barcode: '8901058852391',
      hsnCode: '19023010',
      gstRate: 12,
      purchaseCost: 11.2,
      sellingPrice: 12.8,
      mrp: 14.0,
      reorderLevel: 500,
      stockQty: 2400,
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      sku: 'PRD-KITKAT-38G',
      name: 'KitKat 4-Finger Milk Chocolate 38.5g',
      brand: 'Nestle',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.nestle,
      barcode: '8901058864110',
      hsnCode: '18063200',
      gstRate: 18,
      purchaseCost: 22.5,
      sellingPrice: 26.0,
      mrp: 30.0,
      reorderLevel: 200,
      stockQty: 850,
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      sku: 'PRD-NESCAFE-50G',
      name: 'Nescafe Classic Instant Coffee Jar 50g',
      brand: 'Nestle',
      categoryId: CATEGORY_IDS.beverages,
      vendorId: VENDOR_IDS.nestle,
      barcode: '8901058000426',
      hsnCode: '21011110',
      gstRate: 18,
      purchaseCost: 155.0,
      sellingPrice: 180.0,
      mrp: 205.0,
      reorderLevel: 100,
      stockQty: 320,
    },
    {
      id: '60000000-0000-0000-0000-000000000004',
      sku: 'PRD-SURF-EASY-1KG',
      name: 'Surf Excel Easy Wash Detergent Powder 1kg',
      brand: 'HUL',
      categoryId: CATEGORY_IDS.homeCare,
      vendorId: VENDOR_IDS.hul,
      barcode: '8901030713009',
      hsnCode: '34029020',
      gstRate: 18,
      purchaseCost: 118.0,
      sellingPrice: 135.0,
      mrp: 150.0,
      reorderLevel: 250,
      stockQty: 90, // LOW STOCK INTENTIONALLY
    },
    {
      id: '60000000-0000-0000-0000-000000000005',
      sku: 'PRD-DOVE-SOAP-100G',
      name: 'Dove Cream Beauty Bathing Bar 100g',
      brand: 'HUL',
      categoryId: CATEGORY_IDS.personalCare,
      vendorId: VENDOR_IDS.hul,
      barcode: '8901030678223',
      hsnCode: '34011110',
      gstRate: 18,
      purchaseCost: 46.0,
      sellingPrice: 53.0,
      mrp: 62.0,
      reorderLevel: 300,
      stockQty: 1100,
    },
    {
      id: '60000000-0000-0000-0000-000000000006',
      sku: 'PRD-REDLABEL-500G',
      name: 'Brooke Bond Red Label Tea Leaf 500g',
      brand: 'HUL',
      categoryId: CATEGORY_IDS.beverages,
      vendorId: VENDOR_IDS.hul,
      barcode: '8901030829106',
      hsnCode: '09024020',
      gstRate: 5,
      purchaseCost: 235.0,
      sellingPrice: 270.0,
      mrp: 300.0,
      reorderLevel: 150,
      stockQty: 40, // LOW STOCK INTENTIONALLY
    },
    {
      id: '60000000-0000-0000-0000-000000000007',
      sku: 'PRD-AASHIRVAAD-5KG',
      name: 'Aashirvaad Shudh Chakki Whole Wheat Atta 5kg',
      brand: 'ITC',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.itc,
      barcode: '8901725013738',
      hsnCode: '11010000',
      gstRate: 0,
      purchaseCost: 215.0,
      sellingPrice: 245.0,
      mrp: 275.0,
      reorderLevel: 200,
      stockQty: 750,
    },
    {
      id: '60000000-0000-0000-0000-000000000008',
      sku: 'PRD-DARKFANTASY-300G',
      name: 'Sunfeast Dark Fantasy Choco Fills 300g',
      brand: 'ITC',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.itc,
      barcode: '8901725132804',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 115.0,
      sellingPrice: 135.0,
      mrp: 160.0,
      reorderLevel: 180,
      stockQty: 620,
    },
    {
      id: '60000000-0000-0000-0000-000000000009',
      sku: 'PRD-BINGO-TEDHE-90G',
      name: 'Bingo Tedhe Medhe Masala Tadka 90g',
      brand: 'ITC',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.itc,
      barcode: '8901725110413',
      hsnCode: '19059040',
      gstRate: 12,
      purchaseCost: 16.0,
      sellingPrice: 18.2,
      mrp: 20.0,
      reorderLevel: 400,
      stockQty: 1800,
    },
    {
      id: '60000000-0000-0000-0000-000000000010',
      sku: 'PRD-YIPPEE-260G',
      name: 'Sunfeast Yippee Magic Masala Noodles 260g',
      brand: 'ITC',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.itc,
      barcode: '8901725121907',
      hsnCode: '19023010',
      gstRate: 12,
      purchaseCost: 40.0,
      sellingPrice: 46.0,
      mrp: 52.0,
      reorderLevel: 250,
      stockQty: 800,
    },
    {
      id: '60000000-0000-0000-0000-000000000011',
      sku: 'PRD-DABUR-HONEY-500G',
      name: 'Dabur 100% Pure Honey Squeezy Pack 500g',
      brand: 'Dabur',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.dabur,
      barcode: '8901207011030',
      hsnCode: '04090000',
      gstRate: 5,
      purchaseCost: 190.0,
      sellingPrice: 225.0,
      mrp: 265.0,
      reorderLevel: 100,
      stockQty: 340,
    },
    {
      id: '60000000-0000-0000-0000-000000000012',
      sku: 'PRD-CHYAWANPRASH-1KG',
      name: 'Dabur Chyawanprash Immunity Booster 1kg',
      brand: 'Dabur',
      categoryId: CATEGORY_IDS.personalCare,
      vendorId: VENDOR_IDS.dabur,
      barcode: '8901207005114',
      hsnCode: '30049011',
      gstRate: 12,
      purchaseCost: 320.0,
      sellingPrice: 380.0,
      mrp: 440.0,
      reorderLevel: 80,
      stockQty: 190,
    },
    {
      id: '60000000-0000-0000-0000-000000000013',
      sku: 'PRD-REAL-MIXED-1L',
      name: 'Real Fruit Power Mixed Fruit Juice 1L Tetra',
      brand: 'Dabur',
      categoryId: CATEGORY_IDS.beverages,
      vendorId: VENDOR_IDS.dabur,
      barcode: '8901207009808',
      hsnCode: '20098000',
      gstRate: 12,
      purchaseCost: 88.0,
      sellingPrice: 105.0,
      mrp: 125.0,
      reorderLevel: 200,
      stockQty: 580,
    },
    {
      id: '60000000-0000-0000-0000-000000000014',
      sku: 'PRD-DABUR-RED-150G',
      name: 'Dabur Red Ayurvedic Paste 150g',
      brand: 'Dabur',
      categoryId: CATEGORY_IDS.personalCare,
      vendorId: VENDOR_IDS.dabur,
      barcode: '8901207002441',
      hsnCode: '33061020',
      gstRate: 18,
      purchaseCost: 75.0,
      sellingPrice: 88.0,
      mrp: 102.0,
      reorderLevel: 150,
      stockQty: 420,
    },
    {
      id: '60000000-0000-0000-0000-000000000015',
      sku: 'PRD-GOODDAY-200G',
      name: 'Britannia Good Day Butter Cookies 200g',
      brand: 'Britannia',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901063141121',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 32.0,
      sellingPrice: 38.0,
      mrp: 45.0,
      reorderLevel: 300,
      stockQty: 1450,
    },
    {
      id: '60000000-0000-0000-0000-000000000016',
      sku: 'PRD-MARIEGOLD-300G',
      name: 'Britannia Marie Gold Tea Biscuits 300g',
      brand: 'Britannia',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901063012117',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 28.0,
      sellingPrice: 33.5,
      mrp: 40.0,
      reorderLevel: 350,
      stockQty: 120, // LOW STOCK INTENTIONALLY
    },
    {
      id: '60000000-0000-0000-0000-000000000017',
      sku: 'PRD-BOURBON-150G',
      name: 'Britannia Bourbon Chocolate Cream Biscuits 150g',
      brand: 'Britannia',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901063030319',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 24.0,
      sellingPrice: 28.5,
      mrp: 35.0,
      reorderLevel: 200,
      stockQty: 680,
    },
    {
      id: '60000000-0000-0000-0000-000000000018',
      sku: 'PRD-BRIT-CHEESE-200G',
      name: 'Britannia Classic Cheese Slices 10 Pack 200g',
      brand: 'Britannia',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901063071220',
      hsnCode: '04069000',
      gstRate: 12,
      purchaseCost: 125.0,
      sellingPrice: 148.0,
      mrp: 175.0,
      reorderLevel: 80,
      stockQty: 290,
    },
    {
      id: '60000000-0000-0000-0000-000000000019',
      sku: 'PRD-NUTRCHOICE-250G',
      name: 'Britannia NutriChoice Digestive High Fibre 250g',
      brand: 'Britannia',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901063084121',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 48.0,
      sellingPrice: 56.0,
      mrp: 65.0,
      reorderLevel: 120,
      stockQty: 410,
    },
    {
      id: '60000000-0000-0000-0000-000000000020',
      sku: 'PRD-TATASALT-1KG',
      name: 'Tata Salt Vacuum Evaporated Iodised Salt 1kg',
      brand: 'Tata Consumer',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.itc,
      barcode: '8901030001014',
      hsnCode: '25010010',
      gstRate: 0,
      purchaseCost: 20.0,
      sellingPrice: 24.0,
      mrp: 28.0,
      reorderLevel: 400,
      stockQty: 1600,
    },
    {
      id: '60000000-0000-0000-0000-000000000021',
      sku: 'PRD-PARLEG-800G',
      name: 'Parle-G Original Glucose Biscuits Family Pack 800g',
      brand: 'Parle',
      categoryId: CATEGORY_IDS.dairyBakery,
      vendorId: VENDOR_IDS.britannia,
      barcode: '8901719101014',
      hsnCode: '19053100',
      gstRate: 18,
      purchaseCost: 65.0,
      sellingPrice: 76.0,
      mrp: 90.0,
      reorderLevel: 300,
      stockQty: 940,
    },
    {
      id: '60000000-0000-0000-0000-000000000022',
      sku: 'PRD-KNORR-SOUP-53G',
      name: 'Knorr Mixed Vegetable Instant Soup 53g',
      brand: 'HUL',
      categoryId: CATEGORY_IDS.packagedFoods,
      vendorId: VENDOR_IDS.hul,
      barcode: '8901030388108',
      hsnCode: '21041010',
      gstRate: 18,
      purchaseCost: 42.0,
      sellingPrice: 50.0,
      mrp: 60.0,
      reorderLevel: 100,
      stockQty: 30, // LOW STOCK INTENTIONALLY
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: {
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        categoryId: p.categoryId,
        barcode: p.barcode,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        purchaseCost: p.purchaseCost,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        reorderLevel: p.reorderLevel,
        isActive: true,
      },
      create: {
        id: p.id,
        organizationId: org.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        categoryId: p.categoryId,
        barcode: p.barcode,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        purchaseCost: p.purchaseCost,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        reorderLevel: p.reorderLevel,
        isActive: true,
      },
    });

    // Link product vendor
    await prisma.productVendor.upsert({
      where: {
        productId_vendorId: {
          productId: product.id,
          vendorId: p.vendorId,
        },
      },
      update: {
        cost: p.purchaseCost,
        isPreferred: true,
      },
      create: {
        productId: product.id,
        vendorId: p.vendorId,
        cost: p.purchaseCost,
        isPreferred: true,
      },
    });

    // Inventory Batch at Central Warehouse
    const batchId = `70000000-0000-0000-0000-${p.id.substring(24)}`;
    await prisma.inventoryBatch.upsert({
      where: { id: batchId },
      update: {
        quantity: p.stockQty,
        unitCost: p.purchaseCost,
      },
      create: {
        id: batchId,
        productId: product.id,
        warehouseId: WAREHOUSE_IDS.kundli,
        batchNumber: `BAT-2024-${p.sku.substring(4, 10)}`,
        quantity: p.stockQty,
        unitCost: p.purchaseCost,
        expiryDate: new Date('2027-12-31'),
        manufacturingDate: new Date('2024-01-15'),
      },
    });

    // Opening inventory transaction
    const txId = `80000000-0000-0000-0000-${p.id.substring(24)}`;
    await prisma.inventoryTransaction.upsert({
      where: { id: txId },
      update: {
        quantity: p.stockQty,
      },
      create: {
        id: txId,
        organizationId: org.id,
        productId: product.id,
        warehouseId: WAREHOUSE_IDS.kundli,
        transactionType: InventoryTransactionType.OPENING_BALANCE,
        quantity: p.stockQty,
        unitCost: p.purchaseCost,
        notes: 'Initial opening stock balance for FY24',
      },
    });
  }

  // 8. Sales Orders across various statuses
  const order1Id = '90000000-0000-0000-0000-000000000001';
  await prisma.salesOrder.upsert({
    where: { id: order1Id },
    update: {},
    create: {
      id: order1Id,
      organizationId: org.id,
      orderNumber: 'SO-2024-00101',
      customerId: CUSTOMER_IDS.blinkit,
      status: OrderStatus.FULFILLED,
      source: 'quick-commerce-api',
      subtotal: 12800,
      taxAmount: 1536,
      totalAmount: 14336,
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: '60000000-0000-0000-0000-000000000001', // Maggi
            quantity: 1000,
            fulfilledQty: 1000,
            unitPrice: 12.8,
            taxRate: 12,
            taxAmount: 1536,
            lineTotal: 14336,
          },
        ],
      },
    },
  });

  const order2Id = '90000000-0000-0000-0000-000000000002';
  await prisma.salesOrder.upsert({
    where: { id: order2Id },
    update: {},
    create: {
      id: order2Id,
      organizationId: org.id,
      orderNumber: 'SO-2024-00102',
      customerId: CUSTOMER_IDS.zepto,
      status: OrderStatus.APPROVED,
      source: 'quick-commerce-api',
      subtotal: 13000,
      taxAmount: 2340,
      totalAmount: 15340,
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: '60000000-0000-0000-0000-000000000002', // KitKat
            quantity: 500,
            fulfilledQty: 0,
            unitPrice: 26.0,
            taxRate: 18,
            taxAmount: 2340,
            lineTotal: 15340,
          },
        ],
      },
    },
  });

  const order3Id = '90000000-0000-0000-0000-000000000003';
  await prisma.salesOrder.upsert({
    where: { id: order3Id },
    update: {},
    create: {
      id: order3Id,
      organizationId: org.id,
      orderNumber: 'SO-2024-00103',
      customerId: CUSTOMER_IDS.reliance,
      status: OrderStatus.PENDING_REVIEW,
      source: 'portal',
      subtotal: 49000,
      taxAmount: 0,
      totalAmount: 49000,
      orderDate: new Date(),
      lines: {
        create: [
          {
            productId: '60000000-0000-0000-0000-000000000007', // Aashirvaad Atta
            quantity: 200,
            fulfilledQty: 0,
            unitPrice: 245.0,
            taxRate: 0,
            taxAmount: 0,
            lineTotal: 49000,
          },
        ],
      },
    },
  });

  // 9. Customer Invoices
  const inv1Id = 'a0000000-0000-0000-0000-000000000001';
  await prisma.customerInvoice.upsert({
    where: { id: inv1Id },
    update: {},
    create: {
      id: inv1Id,
      organizationId: org.id,
      invoiceNumber: 'INV-2024-0089',
      customerId: CUSTOMER_IDS.blinkit,
      salesOrderId: order1Id,
      status: InvoiceStatus.PAID,
      subtotal: 12800,
      taxAmount: 1536,
      totalAmount: 14336,
      paidAmount: 14336,
      invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: '60000000-0000-0000-0000-000000000001',
            quantity: 1000,
            unitPrice: 12.8,
            taxRate: 12,
            taxAmount: 1536,
            lineTotal: 14336,
          },
        ],
      },
    },
  });

  // Payment for Invoice 1
  const pay1Id = 'b0000000-0000-0000-0000-000000000001';
  await prisma.payment.upsert({
    where: { id: pay1Id },
    update: {},
    create: {
      id: pay1Id,
      organizationId: org.id,
      paymentNumber: 'PAY-2024-00045',
      paymentType: PaymentType.RECEIVED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      amount: 14336,
      referenceNumber: 'NEFT-HDFC-991823719',
      paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      allocations: {
        create: [
          {
            invoiceId: inv1Id,
            amount: 14336,
          },
        ],
      },
    },
  });

  // 10. Purchase Orders
  const po1Id = 'c0000000-0000-0000-0000-000000000001';
  await prisma.purchaseOrder.upsert({
    where: { id: po1Id },
    update: {},
    create: {
      id: po1Id,
      organizationId: org.id,
      poNumber: 'PO-2024-00088',
      vendorId: VENDOR_IDS.nestle,
      status: PurchaseOrderStatus.RECEIVED,
      subtotal: 22400,
      taxAmount: 2688,
      totalAmount: 25088,
      orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: '60000000-0000-0000-0000-000000000001',
            quantity: 2000,
            receivedQty: 2000,
            unitCost: 11.2,
            taxRate: 12,
            taxAmount: 2688,
            lineTotal: 25088,
          },
        ],
      },
    },
  });

  // 11. Audit Log record
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: USER_IDS.admin,
      action: 'ORGANIZATION_INITIALIZED',
      entityType: 'Organization',
      entityId: org.id,
      changes: {
        status: 'Initialized with standard FMCG catalog and demo datasets',
        productsSeeded: 22,
        vendorsSeeded: 5,
        customersSeeded: 8,
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
