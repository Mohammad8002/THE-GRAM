import multer from "multer";

// Multer middleware configuration for handling image uploads in memory
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
});

export default upload;