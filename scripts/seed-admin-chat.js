const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

const Account = require("../models/AccountModel");
const Conservation = require("../models/ConservationModel");
const Message = require("../models/MessageModel");

async function seed() {
  const DB_URI = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD || ""
  );
  await mongoose.connect(DB_URI);

  // 1. Promote admin
  const admin = await Account.findOneAndUpdate(
    { email: "admin@gmail.com" },
    { role: "admin" },
    { new: true }
  );
  console.log("Admin account:", admin ? `${admin.name} (${admin._id}) role=${admin.role}` : "Not found");

  const adminId = admin._id.toString();

  // 2. Create customer if not exists
  let customer = await Account.findOne({ email: "customer@gmail.com" });
  if (!customer) {
    customer = await Account.create({
      name: "Trần Minh Anh",
      email: "customer@gmail.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "user",
      photo: "/images/resource/avatar-2.jpg"
    });
    console.log("Created customer:", customer.name, customer._id);
  }

  const customerId = customer._id.toString();

  // 3. Fix existing conversations where member had null
  const allConvs = await Conservation.find();
  for (const c of allConvs) {
    if (c.member && c.member.includes(null)) {
      c.member = [c.member[0], adminId].filter(Boolean);
      await c.save();
      console.log(`Fixed null in conversation ${c._id} -> [${c.member.join(", ")}]`);
    }
  }

  // 4. Ensure conversation between customer and admin exists with messages
  let conv = await Conservation.findOne({
    member: { $all: [customerId, adminId] }
  });

  if (!conv) {
    conv = await Conservation.create({ member: [customerId, adminId] });
    console.log("Created sample conversation:", conv._id);

    await Message.create({
      conservationID: conv._id,
      senderID: customer._id,
      content: "Xin chào nha khoa! Em muốn tư vấn gói bọc răng sứ thẩm mỹ và đặt lịch hẹn khám vào thứ 7 tuần này ạ.",
      messageType: "text"
    });

    await Message.create({
      conservationID: conv._id,
      senderID: admin._id,
      content: "Chào bạn Minh Anh! Nha khoa rất hân hạnh được tư vấn. Gói răng sứ thẩm mỹ hiện đang có ưu đãi 20%, bạn có thể chọn ca sáng 9h hoặc chiều 14h nhé!",
      messageType: "text"
    });
    console.log("Added messages to sample conversation");
  }

  console.log("Done!");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
