const express = require("express");
const router = express.Router();
const PatientController = require("../controllers/PatientController"); // Kiểm tra đường dẫn

router.get("/", PatientController.getPatients);
router.post("/", PatientController.createPatient);
router.get("/:id", PatientController.getPatientById);
router.put("/:id", PatientController.updatePatient);
router.delete("/:id", PatientController.deletePatient);

// Đảm bảo xuất đúng kiểu `router`
module.exports = router;
