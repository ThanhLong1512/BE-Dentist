const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const Facility = require("../models/FacilityModel");

const sampleFacilities = [
  {
    name: "Nha khoa Smile - Trụ sở Quận 1",
    code: "CS-Q1",
    address: "120 Hai Bà Trưng, Phường Đa Kao, Quận 1",
    city: "TP. Hồ Chí Minh",
    phoneNumber: "028 7300 1234",
    email: "chinhanh.q1@dentist.com",
    workingHours: "08:00 - 20:00 (Thứ 2 - CN)",
    chairCount: 8,
    managerName: "TS. BS. Nguyễn Thành Long",
    status: "active",
    image: "/images/resource/image-1.png",
    description: "Trụ sở chính hiện đại trang bị máy chụp CT Cone Beam 3D, phòng phẫu thuật Implant vô trùng chuẩn quốc tế.",
    latitude: 10.7865,
    longitude: 106.6998
  },
  {
    name: "Nha khoa Smile - Chi nhánh Phú Mỹ Hưng",
    code: "CS-Q7",
    address: "45 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7",
    city: "TP. Hồ Chí Minh",
    phoneNumber: "028 7300 5678",
    email: "chinhanh.q7@dentist.com",
    workingHours: "08:30 - 20:30 (Thứ 2 - CN)",
    chairCount: 6,
    managerName: "ThS. BS. Sarah Nguyen",
    status: "active",
    image: "/images/resource/image-2.png",
    description: "Cơ sở chuyên sâu niềng răng trong suốt Invisalign, thẩm mỹ răng sứ nụ cười chuẩn tỷ lệ vàng.",
    latitude: 10.7291,
    longitude: 106.7218
  },
  {
    name: "Nha khoa Smile - Chi nhánh Bình Thạnh",
    code: "CS-BT",
    address: "215 Điện Biên Phủ, Phường 15, Quận Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    phoneNumber: "028 7300 9999",
    email: "chinhanh.bt@dentist.com",
    workingHours: "08:00 - 18:00 (Thứ 2 - Thứ 7)",
    chairCount: 5,
    managerName: "BS. CKI. David Kim",
    status: "maintenance",
    image: "/images/resource/image-4.png",
    description: "Chi nhánh đang trong giai đoạn nâng cấp hệ thống phòng khám và trang bị thêm công nghệ Laser nha khoa.",
    latitude: 10.7989,
    longitude: 106.7082
  },
  {
    name: "Nha khoa Smile - Chi nhánh Cầu Giấy",
    code: "CS-HN",
    address: "88 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy",
    city: "Hà Nội",
    phoneNumber: "024 7300 8888",
    email: "chinhanh.hn@dentist.com",
    workingHours: "08:00 - 20:00 (Thứ 2 - CN)",
    chairCount: 10,
    managerName: "BS. Robert Wang",
    status: "active",
    image: "/images/resource/image-5.jpg",
    description: "Trung tâm nha khoa kỹ thuật cao khu vực miền Bắc, diện tích hơn 500m2 với đầy đủ chuyên khoa sâu.",
    latitude: 21.0336,
    longitude: 105.7955
  }
];

const seedFacilities = async () => {
  try {
    const dbUrl = process.env.DATABASE || "mongodb://127.0.0.1:27017/dentist?directConnection=true";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB for seeding facilities...");

    const count = await Facility.countDocuments();
    if (count > 0) {
      console.log(`Facilities collection already has ${count} records. Updating/verifying...`);
      for (const item of sampleFacilities) {
        await Facility.findOneAndUpdate({ code: item.code }, item, { upsert: true, new: true });
      }
    } else {
      await Facility.insertMany(sampleFacilities);
      console.log("Successfully seeded sample facilities!");
    }

    const all = await Facility.find().select("name code city chairCount status");
    console.log("Current Facilities:", all);

    await mongoose.disconnect();
    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding facilities:", error);
    process.exit(1);
  }
};

seedFacilities();
