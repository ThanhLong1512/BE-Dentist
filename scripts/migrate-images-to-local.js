const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const UPLOAD_ROOT = path.join(__dirname, "..", "public", "uploads");
const SERVICES_UPLOAD_DIR = path.join(UPLOAD_ROOT, "services");
const AVATARS_UPLOAD_DIR = path.join(UPLOAD_ROOT, "avatars");
const CHAT_UPLOAD_DIR = path.join(UPLOAD_ROOT, "chat");

const FE_RESOURCE_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "FE-Dentist",
  "public",
  "images",
  "resource"
);

// Ensure upload directories exist
[UPLOAD_ROOT, SERVICES_UPLOAD_DIR, AVATARS_UPLOAD_DIR, CHAT_UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Copy available service images from FE to BE public/uploads/services
console.log("Copying resource images from FE to BE uploads...");
if (fs.existsSync(FE_RESOURCE_DIR)) {
  const files = fs.readdirSync(FE_RESOURCE_DIR);
  files.forEach(file => {
    if (file.startsWith("service-") && file.endsWith(".jpg")) {
      const src = path.join(FE_RESOURCE_DIR, file);
      const dest = path.join(SERVICES_UPLOAD_DIR, file);
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} -> uploads/services/${file}`);
    }
  });

  const productsDir = path.join(FE_RESOURCE_DIR, "products");
  if (fs.existsSync(productsDir)) {
    const pFiles = fs.readdirSync(productsDir);
    pFiles.forEach(file => {
      if (file.endsWith(".jpg") || file.endsWith(".png")) {
        const src = path.join(productsDir, file);
        const dest = path.join(SERVICES_UPLOAD_DIR, `product-${file}`);
        fs.copyFileSync(src, dest);
      }
    });
  }
}

// Service to local file mapping
const SERVICE_IMAGE_MAPPING = {
  "Laboratory Tests": "service-5.jpg",
  "Dental Checkup": "service-8.jpg",
  "Eye Examination": "service-6.jpg",
  "Physiotherapy": "service-2.jpg",
  "Nutrition Consultation": "service-7.jpg",
  "Vaccination": "service-3.jpg",
  "Mental Health Counseling": "service-1.jpg",
  "ENT Examination": "service-9.jpg",
  "Ultrasound Scan": "service-4.jpg",
  "Cardiology Assessment": "service-10.jpg"
};

const host = process.env.LOCAL_DEV_APP_HOST || "127.0.0.1";
const port = process.env.LOCAL_DEV_APP_PORT || 8080;
const baseUrl = `http://${host}:${port}`;

async function runMigration() {
  console.log("Connecting to MongoDB...");
  const DB_URI = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD || ""
  );

  await mongoose.connect(DB_URI);
  console.log("Connected to MongoDB!");

  require("../models/ReviewModel");
  const Service = require("../models/ServicesModel");
  const Account = require("../models/AccountModel");

  const services = await Service.find();
  console.log(`Found ${services.length} services in database.`);

  for (const svc of services) {
    const imageName = SERVICE_IMAGE_MAPPING[svc.nameService] || "service-1.jpg";
    const localUrl = `${baseUrl}/uploads/services/${imageName}`;
    const publicId = `services/${imageName}`;

    svc.photoService = {
      public_id: publicId,
      url: localUrl
    };
    await svc.save();
    console.log(`Updated service "${svc.nameService}" -> ${localUrl}`);
  }

  // Update default account avatars in database if still pointing to dead Cloudinary
  const accountsToUpdate = await Account.updateMany(
    { photo: { $regex: /cloudinary/i } },
    { $set: { photo: "/images/resource/avatar-1.jpg", photoPublicId: "default_avatar" } }
  );
  console.log(`Updated ${accountsToUpdate.modifiedCount} accounts with local avatar.`);

  // Update seed data in services.json
  const seedPath = path.join(__dirname, "..", "data", "services.json");
  if (fs.existsSync(seedPath)) {
    try {
      const seedServices = JSON.parse(fs.readFileSync(seedPath, "utf8"));
      seedServices.forEach(svc => {
        const imageName = SERVICE_IMAGE_MAPPING[svc.nameService] || "service-1.jpg";
        svc.photoService = {
          public_id: `services/${imageName}`,
          url: `${baseUrl}/uploads/services/${imageName}`
        };
      });
      fs.writeFileSync(seedPath, JSON.stringify(seedServices, null, 2), "utf8");
      console.log("Updated BE-Dentist/data/services.json seed file.");
    } catch (e) {
      console.warn("Failed to update services.json seed:", e.message);
    }
  }

  console.log("Migration complete!");
  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
