import { Router } from "express";

const router = Router();

// GET /api/upload/config — يرجع إعدادات Cloudinary للموبايل
// الموبايل يستخدمها لرفع الملفات مباشرةً على Cloudinary بدون المرور بالسيرفر
router.get("/upload/config", (_req, res) => {
  const cloudName = process.env.CLOUD_NAME;
  const uploadPreset = process.env.UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return res.status(503).json({ error: "خدمة الرفع غير مفعّلة" });
  }

  return res.json({
    cloudName,
    uploadPreset,
    // رابط الرفع التلقائي — يحدد نوع الملف تلقائياً (صورة أو فيديو)
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  });
});

export default router;
