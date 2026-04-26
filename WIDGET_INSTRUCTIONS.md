# Hosting Widget - O'rnatish yo'riqnomasi

## Mijoz saytiga qo'shish

Mijoz saytining HTML fayliga quyidagi kodni qo'shing (</body> dan oldin):

```html
<script src="http://206.81.17.211/static/js/hosting-widget.js" data-token="e88d2356c61bcb30a2212493f506b6d4"></script>
```

## Token haqida

Har bir mijoz uchun alohida token beriladi. Yuqoridagi misolda:
- **Token:** `e88d2356c61bcb30a2212493f506b6d4`

## Yangi mijoz qo'shish

1. Yangi token yarating (32 ta harf/raqam)
2. `static/hosting-clients.json` fayliga mijoz ma'lumotlarini qo'shing:

```json
{
  "e88d2356c61bcb30a2212493f506b6d4": {
    "name": "Mijoz Nomi",
    "balance": 373140000,
    "monthly_price": 360000,
    "next_payment_date": "2025-06-15",
    "server_status": "active",
    "recent_payments": [
      {
        "date": "26.04.2026",
        "amount": 31095000
      }
    ]
  }
}
```

3. Serverda faylni yangilang:
```bash
git add static/hosting-clients.json
git commit -m "Yangi mijoz qo'shildi"
git push origin main
```

4. Serverda pull qiling:
```bash
ssh root@206.81.17.211
cd /var/www/alisher
git pull origin main
```

## Widget ko'rinishi

Widget sayt o'ng pastki burchagida ko'rinadi:
- 💻 Hosting nomi
- 💰 Balans
- 📅 Keyingi to'lov sanasi
- 📊 Oxirgi to'lovlar ro'yxati
- ✕ Yopish tugmasi

## Test qilish

Widget API ni tekshirish:
```bash
curl http://206.81.17.211/api/hosting/widget/e88d2356c61bcb30a2212493f506b6d4
```

## Xavfsizlik

- Token yashirin bo'lishi shart emas (faqat o'qish uchun)
- Ma'lumotlarni faqat admin o'zgartira oladi (JSON fayl orqali)
- Widget faqat balans va to'lovlarni ko'rsatadi
