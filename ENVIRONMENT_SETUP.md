# Environment Variables Setup

برای اجرای صحیح پروژه، باید متغیرهای محیطی زیر را تنظیم کنید:

## ایجاد فایل .env.local

در ریشه پروژه فایل `.env.local` ایجاد کنید و متغیرهای زیر را اضافه کنید:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/your-database-name

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# Liara Object Storage Configuration
LIARA_ENDPOINT=https://storage.iran.liara.space
LIARA_ACCESS_KEY=your-liara-access-key
LIARA_SECRET_KEY=your-liara-secret-key
LIARA_BUCKET_NAME=your-bucket-name

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
```

## نحوه دریافت اطلاعات Liara

1. وارد پنل مدیریت Liara شوید
2. به بخش Object Storage بروید
3. یک bucket جدید ایجاد کنید یا از bucket موجود استفاده کنید
4. از بخش Access Keys، کلیدهای دسترسی را دریافت کنید
5. اطلاعات زیر را کپی کنید:
   - **Endpoint**: آدرس endpoint (معمولاً `https://storage.iran.liara.space`)
   - **Access Key**: کلید دسترسی
   - **Secret Key**: کلید مخفی
   - **Bucket Name**: نام bucket

## نکات مهم

- فایل `.env.local` را به `.gitignore` اضافه کنید تا اطلاعات حساس در Git ذخیره نشود
- هرگز کلیدهای دسترسی را در کد قرار ندهید
- در محیط production، از متغیرهای محیطی سرور استفاده کنید
