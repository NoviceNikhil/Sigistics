const multer = require("multer");

const storage = multer.memoryStorage(); // keeps file in memory as a Buffer

const fileFilter = (req, file, cb) => {
  // Only allow Excel specific mimetypes
  const allowedExcelTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv" // Added CSV just in case, feel free to remove if strictly .xlsx
  ];

  if (allowedExcelTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Corrected error message to match your specific domain
    cb(new Error("Invalid file type. Please upload an Excel spreadsheet (.xlsx or .xls)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB is plenty for thousands of rows of shipment data
});

module.exports = upload;