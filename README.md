# DDI Checker Web/PWA v0.1

نسخه آزمایشی وب برای بررسی تداخل دارویی، مبتنی بر دیتاست v4 پروژه.

## ویژگی‌ها
- فارسی و انگلیسی
- پشتیبانی از aliasها و نام‌های معادل
- کاملاً استاتیک؛ بدون سرور و دیتابیس آنلاین
- مناسب GitHub Pages
- روی iPhone از Safari باز می‌شود و می‌توان Add to Home Screen زد
- پس از اولین بارگذاری، Service Worker فایل‌ها را برای استفاده آفلاین cache می‌کند

## انتشار رایگان با GitHub Pages
1. در GitHub یک repository جدید بسازید، مثلاً `ddi-checker`.
2. تمام محتویات همین پوشه را در ریشه repository آپلود کنید.
3. در repository بروید به Settings > Pages.
4. در بخش Build and deployment، گزینه `Deploy from a branch` را انتخاب کنید.
5. Branch را `main` و Folder را `/ (root)` بگذارید و Save کنید.
6. بعد از چند دقیقه آدرس سایت چیزی شبیه این می‌شود:
   `https://USERNAME.github.io/ddi-checker/`

## تست پیشنهادی
- بروفن + وارفارین
- Ibuprofen + Warfarin
- Metformin + Cimetidine
- یک نام ساختگی + Warfarin

## نکته بالینی
این نسخه برای تست و ارزیابی است. «یافت نشدن تداخل» فقط به معنی نبود رکورد در دیتاست است.
