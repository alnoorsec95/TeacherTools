# Al Noor School Gaming Studio
معرض ألعاب طالبات مدرسة النور الثانوية للبنات — مملكة البحرين

## هيكل المشروع
```
index.html                      الصفحة الرئيسية (معرض الألعاب)
games/escape-the-fort.html      لعبة «الهروب من القلعة» — إعداد الطالبة فاطمة سعيد جعفر
games/pearls-of-bahrain.html    لعبة Pearls of Bahrain — إعداد الطالبة سارة التيتون
games/horizon-paths.html        لعبة «دروب الأفق» — إعداد الطالبة جمان حسين محمد
games/pearl-sudoku.html         لعبة «سودوكو اللؤلؤ»
games/who-wants-to-be-a-millionaire.html   لعبة «من سيربح المليون؟ – النسخة البحرينية» — إعداد الطالبة أطياب منصور
games/fox-lightning.html        لعبة «برق الثعلب»
games/dilmun-land.html          لعبة «أرض دلمون»
games/little-detective.html     لعبة «المحقق الصغير» — إعداد الطالبتين زهراء علي المختار ورقية حسين الحايكي
assets/                         صور أغلفة الألعاب
```

## إضافة لعبة جديدة
1. ضعي ملف اللعبة داخل مجلد `games/` (مثال: `games/my-game.html`).
2. ضعي صورة الغلاف (اختيارية) داخل `assets/`.
3. افتحي `index.html` وعدّلي اللعبة المناسبة في المصفوفة `GAMES`:
```js
{title:"اسم اللعبة", by:"اسم الطالبة", url:"games/my-game.html", img:"assets/my-game.jpg", theme:"pearl"}
```
إذا لم تضعي `img` يظهر رسم تلقائي حسب `theme`.
