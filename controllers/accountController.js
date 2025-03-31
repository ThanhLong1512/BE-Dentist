const Account = require("../models/AccountModel");

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    if (!accounts || accounts.length === 0)
      return res.status(404).json({ message: "No employees found" });

    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
