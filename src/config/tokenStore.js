const mongoose = require("mongoose");

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Conectado ao MongoDB para armazenar sessões.");
  } catch (err) {
    console.error("❌ Falha ao conectar ao MongoDB:", err.message);
  }
};

module.exports = connectMongo;
