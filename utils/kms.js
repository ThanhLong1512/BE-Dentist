// Tạm thời comment - không dùng AWS KMS nữa
// const AWS = require("aws-sdk");

// AWS.config.update({
//   region: "ap-southeast-1"
// });

// const kms = new AWS.KMS();

class KMSService {
  constructor() {
    // this.keyAlias = "alias/website-key";
  }

  async encrypt(plaintext) {
    // Pass-through: không mã hóa, trả về base64 để giữ interface
    return Buffer.from(plaintext, "utf8").toString("base64");
  }

  async decrypt(encryptedData) {
    // Pass-through: giải mã base64
    return Buffer.from(encryptedData, "base64").toString("utf8");
  }

  async encryptJSON(object) {
    const jsonString = JSON.stringify(object);
    return await this.encrypt(jsonString);
  }

  async decryptJSON(encryptedData) {
    const decryptedString = await this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }
}

module.exports = new KMSService();
