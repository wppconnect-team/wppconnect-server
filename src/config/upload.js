import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const __dirname = path.resolve(path.dirname(''));
        cb(null, path.resolve(__dirname, "uploads"))
    },
    filename: function (req, file, cb) {
        let filename = `wppConnect-${Date.now()}-${file.originalname}`;
        cb(null, filename);
    }
});

const uploads = multer({storage: storage});
export default uploads;
