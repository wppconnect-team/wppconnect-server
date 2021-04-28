import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, "..", "..", "files"));
    },
    filename: function (req, file, cb) {
        let filename = `wppConnect-${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const uploads = multer({storage: storage});
export default uploads;
