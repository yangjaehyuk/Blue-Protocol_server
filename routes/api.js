import express from "express";
import { client } from "../db.js";
import { s3 } from "../aws.js";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
dotenv.config();

const apiRouter = express.Router();

const uploadImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, callback) => {
      callback(null, `${Date.now()}_${file.originalname}}`);
    },
  }),
});

apiRouter.post(
  "/uploadImage",
  uploadImage.single("image"),
  async (req, res) => {
    res.json(req.file.location);
  }
);

apiRouter.post("/uploadNews", async (req, res) => {
  const { title, outline, category, thumbnail, content } = req.body;
  const date = new Date();

  const db = client.db("BP");
  const getNewsCount = await db.collection("counter").findOne({ name: "news" });
  const newsId = parseInt(getNewsCount.total);

  await db
    .collection("news")
    .insertOne({
      id: newsId + 1,
      title: title,
      outline: outline,
      category: category,
      thumbnail: thumbnail,
      content: content,
      date: date.toLocaleString(),
    })
    .catch((err) => console.err(err));

  db.collection("counter").updateOne({ name: "news" }, { $inc: { total: 1 } });
});

apiRouter.get("/getNews", async (req, res) => {
  const db = client.db("BP");
  const allNews = await db.collection("news").find().sort({ id: -1 }).toArray();
  res.json(allNews);
  console.log(allNews);
});

apiRouter.get("/getLatestNews", async (req, res) => {
  const db = client.db("BP");
  const news = await db
    .collection("news")
    .find()
    .sort({ id: -1 })
    .limit(3)
    .toArray();
  res.json(news);
  // console.log(news);
});

export default apiRouter;
