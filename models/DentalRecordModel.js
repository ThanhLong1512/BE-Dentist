const mongoose = require("mongoose");

const ALL_FDI_TEETH = [
  // Hàm trên (Upper)
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  // Hàm dưới (Lower)
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
];

const toothSchema = new mongoose.Schema(
  {
    toothNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: [
        "healthy",
        "cavity",
        "filled",
        "root_canal",
        "crown",
        "missing",
        "implant",
        "impacted",
        "bridge",
        "orthodontic"
      ],
      default: "healthy"
    },
    surfaces: {
      type: [String],
      enum: ["M", "D", "O", "B", "L"],
      default: []
    },
    notes: {
      type: String,
      default: ""
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const prescriptionItemSchema = new mongoose.Schema(
  {
    drugName: {
      type: String,
      required: [true, "Drug name is required"]
    },
    dosage: {
      type: String,
      default: ""
    },
    frequency: {
      type: String,
      default: ""
    },
    duration: {
      type: String,
      default: ""
    },
    instructions: {
      type: String,
      default: ""
    }
  },
  { _id: true }
);

const procedureSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    },
    serviceName: {
      type: String,
      default: ""
    },
    teeth: {
      type: [Number],
      default: []
    },
    price: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { _id: true }
);

const treatmentSessionSchema = new mongoose.Schema(
  {
    sessionDate: {
      type: Date,
      default: Date.now
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },
    diagnosis: {
      type: String,
      default: ""
    },
    clinicalNotes: {
      type: String,
      default: ""
    },
    procedures: [procedureSchema],
    prescription: [prescriptionItemSchema]
  },
  {
    timestamps: true
  }
);

const dentalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Dental record must belong to a patient"],
      unique: true
    },
    medicalHistory: {
      allergies: {
        type: [String],
        default: []
      },
      systemicConditions: {
        type: [String],
        default: []
      },
      notes: {
        type: String,
        default: ""
      }
    },
    dentalChart: {
      type: [toothSchema],
      default: () =>
        ALL_FDI_TEETH.map(num => ({
          toothNumber: num,
          status: "healthy",
          surfaces: [],
          notes: ""
        }))
    },
    treatmentSessions: [treatmentSessionSchema]
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Populate doctor and service on treatmentSessions if needed
dentalRecordSchema.pre(/^find/, function(next) {
  this.populate({
    path: "treatmentSessions.doctor",
    select: "name phoneNumber experience service"
  }).populate({
    path: "treatmentSessions.procedures.service",
    select: "nameService priceService priceDiscount"
  });
  next();
});

const DentalRecord = mongoose.model("DentalRecord", dentalRecordSchema);
module.exports = {
  DentalRecord,
  ALL_FDI_TEETH
};
