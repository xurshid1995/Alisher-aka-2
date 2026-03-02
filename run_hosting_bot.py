#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hosting Bot - Alohida ishga tushirish
Hosting to'lovlari uchun Telegram botni ishga tushiradi

Foydalanish:
    python run_hosting_bot.py
"""
import sys
import os
import logging
from pathlib import Path

# Loyiha ildizini sys.path ga qo'shish
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Environment variables yuklash
from dotenv import load_dotenv
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Hosting botni ishga tushirish"""
    try:
        # Flask app va db ni import qilish
        from app import app, db
        from hosting_bot import create_hosting_bot_app, HostingPaymentBot

        logger.info("🖥️ Hosting To'lov Bot ishga tushirilmoqda...")

        # Database tablolarni yaratish (agar mavjud bo'lmasa)
        with app.app_context():
            from app import HostingClient, HostingPaymentOrder, HostingPayment
            db.create_all()
            logger.info("✅ Database tablolar tayyor")

        # Telegram application yaratish
        logger.info("📱 Hosting Bot application yaratilmoqda...")
        application = create_hosting_bot_app(db=db, app=app)

        if not application:
            logger.error("❌ Hosting Bot application yaratilmadi!")
            logger.error("HOSTING_BOT_TOKEN .env faylida sozlanganini tekshiring.")
            return

        # Scheduler - muddati o'tgan buyurtmalarni tekshirish
        hosting_bot = HostingPaymentBot(db=db, app=app)

        # Job Queue - kunlik tekshiruvlar
        job_queue = application.job_queue

        # Har 1 soatda expired buyurtmalarni tekshirish
        job_queue.run_repeating(
            lambda context: hosting_bot.check_expired_orders(),
            interval=3600,  # 1 soat
            first=60  # 1 daqiqadan keyin boshlash
        )

        # Har kuni ertalab 09:00 da eslatma yuborish
        from datetime import time as dt_time
        import pytz
        tz = pytz.timezone('Asia/Tashkent')

        job_queue.run_daily(
            lambda context: hosting_bot.check_unpaid_clients(),
            time=dt_time(hour=9, minute=0, tzinfo=tz),
            name='daily_reminder'
        )

        # Har kuni 23:00 da to'lov muddati o'tganlarni o'chirish
        job_queue.run_daily(
            lambda context: hosting_bot.auto_suspend_unpaid(),
            time=dt_time(hour=23, minute=0, tzinfo=tz),
            name='auto_suspend'
        )

        # Konfiguratsiya ma'lumotlari
        token = os.getenv('HOSTING_BOT_TOKEN', '')
        admin_id = os.getenv('HOSTING_ADMIN_CHAT_ID', 'sozlanmagan')
        card = os.getenv('HOSTING_CARD_NUMBER', 'sozlanmagan')

        logger.info("=" * 50)
        logger.info("✅ Hosting To'lov Bot tayyor!")
        logger.info(f"🤖 Bot token: ...{token[-10:]}" if len(token) > 10 else "⚠️ Token qisqa")
        logger.info(f"👤 Admin chat ID: {admin_id}")
        logger.info(f"💳 Karta: {'****' + card[-4:] if len(card) >= 4 else 'sozlanmagan'}")
        logger.info("⏰ Eslatma: har kuni 09:00")
        logger.info("⏹️ Auto-suspend: har kuni 23:00")
        logger.info("=" * 50)
        logger.info("🔄 Bot polling rejimida ishlamoqda...")

        # Bot polling rejimida ishga tushirish
        application.run_polling(
            allowed_updates=[
                "message",
                "callback_query",
                "pre_checkout_query",
                "shipping_query"
            ]
        )

    except KeyboardInterrupt:
        logger.info("\n⛔ Hosting Bot to'xtatildi (Ctrl+C)")
    except Exception as e:
        logger.error(f"❌ Hosting Bot xatosi: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
