const AWS = require("aws-sdk");

AWS.config.update({
  region: "ap-southeast-1"
});

const kms = new AWS.KMS();

class KMSService {
  constructor() {
    this.keyAlias = "alias/website-key";
  }

  async encrypt(plaintext) {
    try {
      console.log("Encrypting data...");

      const params = {
        KeyId: this.keyAlias,
        Plaintext: Buffer.from(plaintext, "utf8")
      };

      const result = await kms.encrypt(params).promise();
      const encrypted = result.CiphertextBlob.toString("base64");

      console.log("Data encrypted successfully");
      return encrypted;
    } catch (error) {
      console.error("Encryption failed:", error.message);
      throw error;
    }
  }

  async decrypt(encryptedData) {
    try {
      console.log("Decrypting data...");

      const params = {
        CiphertextBlob: Buffer.from(encryptedData, "base64")
      };

      const result = await kms.decrypt(params).promise();
      const decrypted = result.Plaintext.toString("utf8");

      console.log("Data decrypted successfully");
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error.message);
      throw error;
    }
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
