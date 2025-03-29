const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ!"] 
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        match: [/^\d{10,11}$/, "Số điện thoại không hợp lệ!"] 
    },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Đảm bảo tên collection nhất quán (nếu database có "Employees" thì giữ nguyên)
module.exports = mongoose.model('Employee', EmployeeSchema, 'Employee');
