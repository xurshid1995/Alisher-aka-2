# -*- coding: utf-8 -*-
"""
Qarz Scheduler - Avtomatik qarz eslatmalari
Kunlik, haftalik va real-time qarz eslatmalarini yuborish
"""
import os
import logging
import asyncio
from datetime import datetime, time, timedelta
from decimal import Decimal
from typing import List, Dict, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv

# Flask app va modellarni import qilish
import sys
sys.path.append(os.path.dirname(__file__))

from telegram_bot import get_bot_instance

load_dotenv()
logger = logging.getLogger(__name__)


class DebtScheduler:
    """Qarz eslatmalarini boshqarish tizimi"""
    
    def __init__(self, app=None, db=None):
        """
        Args:
            app: Flask application
            db: SQLAlchemy database instance
        """
        self.app = app
        self.db = db
        self.bot = get_bot_instance(db=db)  # db ni o'tkazamiz
        self.scheduler = AsyncIOScheduler()
        
        # Sozlamalar
        self.daily_reminder_time = os.getenv('DEBT_REMINDER_TIME', '10:00')
        self.weekly_report_day = int(os.getenv('WEEKLY_REPORT_DAY', '1'))  # 1 = Dushanba
        self.minimum_debt_amount = float(os.getenv('MINIMUM_DEBT_AMOUNT', '1'))  # USD
        
        logger.info("✅ DebtScheduler initialized")
    
    def _get_customers_with_debt(self) -> List[Dict]:
        """
        Qarzli mijozlar ro'yxatini olish
        
        Returns:
            List[Dict]: Qarzli mijozlar ma'lumotlari
        """
        if not self.app or not self.db:
            logger.error("❌ Flask app yoki DB mavjud emas")
            return []
        
        with self.app.app_context():
            try:
                from app import Customer, Sale, Store, Warehouse
                
                # Qarzli savdolarni olish
                debts = self.db.session.query(
                    Sale.customer_id,
                    Sale.location_id,
                    Sale.location_type,
                    Sale.sale_date,
                    self.db.func.sum(Sale.debt_usd).label('total_debt_usd'),
                    self.db.func.sum(Sale.debt_amount).label('total_debt_uzs')
                ).filter(
                    Sale.payment_status == 'partial',
                    Sale.debt_usd > self.minimum_debt_amount
                ).group_by(
                    Sale.customer_id,
                    Sale.location_id,
                    Sale.location_type,
                    Sale.sale_date
                ).all()
                
                result = []
                for debt in debts:
                    if not debt.customer_id:
                        continue
                    
                    customer = Customer.query.get(debt.customer_id)
                    if not customer or not customer.telegram_chat_id:
                        continue
                    
                    # Location nomini olish
                    location_name = "Noma'lum"
                    if debt.location_type == 'store' and debt.location_id:
                        store = Store.query.get(debt.location_id)
                        location_name = store.name if store else "Do'kon"
                    elif debt.location_type == 'warehouse' and debt.location_id:
                        warehouse = Warehouse.query.get(debt.location_id)
                        location_name = warehouse.name if warehouse else "Ombor"
                    
                    result.append({
                        'customer_id': customer.id,
                        'customer_name': customer.name,
                        'phone': customer.phone,
                        'telegram_chat_id': customer.telegram_chat_id,
                        'debt_usd': float(debt.total_debt_usd or 0),
                        'debt_uzs': float(debt.total_debt_uzs or 0),
                        'location_name': location_name,
                        'sale_date': debt.sale_date
                    })
                
                logger.info(f"📊 {len(result)} ta qarzli mijoz topildi")
                return result
                
            except Exception as e:
                logger.error(f"❌ Qarzli mijozlarni olishda xatolik: {e}")
                return []
    
    async def send_daily_reminders(self):
        """Kunlik qarz eslatmalarini yuborish"""
        logger.info("📅 Kunlik qarz eslatmalari yuborilmoqda...")
        
        debts = self._get_customers_with_debt()
        
        if not debts:
            logger.info("✅ Qarzli mijozlar yo'q")
            return
        
        success_count = 0
        failed_count = 0
        
        for debt in debts:
            try:
                success = await self.bot.send_debt_reminder(
                    chat_id=debt['telegram_chat_id'],
                    customer_name=debt['customer_name'],
                    debt_usd=debt['debt_usd'],
                    debt_uzs=debt['debt_uzs'],
                    location_name=debt['location_name'],
                    sale_date=debt.get('sale_date'),
                    customer_id=debt.get('customer_id')  # Customer ID qo'shamiz
                )
                
                if success:
                    success_count += 1
                else:
                    failed_count += 1
                
                # Rate limiting (sekundiga 1 ta xabar)
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ {debt['customer_name']} ga xabar yuborishda xatolik: {e}")
                failed_count += 1
        
        logger.info(
            f"✅ Kunlik eslatmalar: {success_count} yuborildi, "
            f"{failed_count} xatolik"
        )
        
        # Adminlarga hisobot
        await self.bot.send_daily_summary(
            total_debts=len(debts),
            total_amount_usd=sum(d['debt_usd'] for d in debts),
            total_amount_uzs=sum(d['debt_uzs'] for d in debts),
            new_debts=0,  # TODO: Bugungi yangi qarzlarni hisoblash
            paid_today=0   # TODO: Bugun to'langanlarni hisoblash
        )
    
    async def send_weekly_report(self):
        """Haftalik hisobot yuborish"""
        logger.info("📊 Haftalik hisobot yuborilmoqda...")
        
        debts = self._get_customers_with_debt()
        await self.bot.send_debt_list_to_admin(debts)
        
        logger.info("✅ Haftalik hisobot yuborildi")
    
    async def send_instant_reminder(
        self,
        customer_id: int,
        debt_usd: float,
        debt_uzs: float,
        location_name: str,
        sale_date: Optional[datetime] = None
    ) -> bool:
        """
        Darhol qarz eslatmasi yuborish (savdodan keyin)
        
        Args:
            customer_id: Mijoz ID
            debt_usd: Qarz (USD)
            debt_uzs: Qarz (UZS)
            location_name: Do'kon/ombor nomi
            sale_date: Savdo sanasi
            
        Returns:
            bool: Yuborildi/yuborilmadi
        """
        if not self.app or not self.db:
            return False
        
        with self.app.app_context():
            try:
                from app import Customer
                
                customer = Customer.query.get(customer_id)
                if not customer or not customer.telegram_chat_id:
                    logger.warning(
                        f"⚠️ Mijoz {customer_id} uchun telegram_chat_id yo'q"
                    )
                    return False
                
                return await self.bot.send_debt_reminder(
                    chat_id=customer.telegram_chat_id,
                    customer_name=customer.name,
                    debt_usd=debt_usd,
                    debt_uzs=debt_uzs,
                    location_name=location_name,
                    sale_date=sale_date
                )
                
            except Exception as e:
                logger.error(f"❌ Instant reminder yuborishda xatolik: {e}")
                return False
    
    def send_telegram_debt_reminder_sync(
        self,
        chat_id: int,
        customer_name: str,
        debt_usd: float,
        debt_uzs: float,
        location_name: str,
        sale_date: Optional[datetime] = None,
        customer_id: Optional[int] = None
    ) -> bool:
        """
        Sinxron telegram xabar yuborish (Flask route'lar uchun)
        
        Args:
            chat_id: Telegram chat ID
            customer_name: Mijoz ismi
            debt_usd: Qarz (USD)
            debt_uzs: Qarz (UZS)
            location_name: Do'kon/ombor nomi
            sale_date: Savdo sanasi
            customer_id: Mijoz ID (to'lov turlarini olish uchun)
            
        Returns:
            bool: Yuborildi/yuborilmadi
        """
        try:
            # Asyncio eventloop ichida bajariladi
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            result = loop.run_until_complete(
                self.bot.send_debt_reminder(
                    chat_id=chat_id,
                    customer_name=customer_name,
                    debt_usd=debt_usd,
                    debt_uzs=debt_uzs,
                    location_name=location_name,
                    sale_date=sale_date,
                    customer_id=customer_id
                )
            )
            
            loop.close()
            return result
            
        except Exception as e:
            logger.error(f"❌ Sync telegram xatolik: {e}")
            return False
    
    async def send_payment_notification(
        self,
        customer_id: int,
        paid_usd: float,
        paid_uzs: float,
        remaining_usd: float,
        remaining_uzs: float,
        location_name: str
    ) -> bool:
        """
        To'lov tasdiqlash xabarini yuborish
        
        Args:
            customer_id: Mijoz ID
            paid_usd: To'langan (USD)
            paid_uzs: To'langan (UZS)
            remaining_usd: Qolgan qarz (USD)
            remaining_uzs: Qolgan qarz (UZS)
            location_name: Do'kon/ombor nomi
            
        Returns:
            bool: Yuborildi/yuborilmadi
        """
        if not self.app or not self.db:
            return False
        
        with self.app.app_context():
            try:
                from app import Customer
                
                customer = Customer.query.get(customer_id)
                if not customer or not customer.telegram_chat_id:
                    return False
                
                return await self.bot.send_payment_confirmation(
                    chat_id=customer.telegram_chat_id,
                    customer_name=customer.name,
                    paid_usd=paid_usd,
                    paid_uzs=paid_uzs,
                    remaining_usd=remaining_usd,
                    remaining_uzs=remaining_uzs,
                    location_name=location_name
                )
                
            except Exception as e:
                logger.error(f"❌ Payment notification yuborishda xatolik: {e}")
                return False
    
    def start(self):
        """Schedulerni ishga tushirish"""
        try:
            # Kunlik eslatmalar (har kuni soat 10:00 da)
            hour, minute = map(int, self.daily_reminder_time.split(':'))
            self.scheduler.add_job(
                self.send_daily_reminders,
                CronTrigger(hour=hour, minute=minute),
                id='daily_reminders',
                name='Kunlik qarz eslatmalari',
                replace_existing=True
            )
            logger.info(f"✅ Kunlik eslatmalar: har kuni {self.daily_reminder_time} da")
            
            # Haftalik hisobot (har dushanba soat 09:00 da)
            self.scheduler.add_job(
                self.send_weekly_report,
                CronTrigger(day_of_week=self.weekly_report_day, hour=9, minute=0),
                id='weekly_report',
                name='Haftalik hisobot',
                replace_existing=True
            )
            logger.info("✅ Haftalik hisobot: har dushanba 09:00 da")
            
            # Individual eslatmalarni tekshirish (har 5 daqiqada)
            self.scheduler.add_job(
                self.check_scheduled_reminders,
                CronTrigger(minute='*/5'),
                id='scheduled_reminders',
                name='Belgilangan eslatmalarni tekshirish',
                replace_existing=True
            )
            logger.info("✅ Belgilangan eslatmalar: har 5 daqiqada tekshiriladi")
            
            # Schedulerni boshlash
            self.scheduler.start()
            logger.info("✅ Scheduler ishga tushdi")
            
        except Exception as e:
            logger.error(f"❌ Scheduler ishga tushirishda xatolik: {e}")
    
    async def check_scheduled_reminders(self):
        """Foydalanuvchi belgilagan eslatmalarni tekshirish va yuborish"""
        if not self.app or not self.db:
            return
        
        with self.app.app_context():
            try:
                from app import DebtReminder, Customer, Sale, CurrencyRate, get_tashkent_time
                
                now = get_tashkent_time()
                today = now.date()
                current_time = now.time()
                
                # Vaqti kelgan eslatmalarni olish
                reminders = DebtReminder.query.filter(
                    DebtReminder.is_active == True,
                    DebtReminder.is_sent == False,
                    DebtReminder.reminder_date <= today
                ).all()
                
                sent_count = 0
                
                for reminder in reminders:
                    # Bugungi eslatmalar uchun vaqtni tekshirish
                    if reminder.reminder_date == today and reminder.reminder_time > current_time:
                        continue  # Hali vaqti kelmagan
                    
                    customer = Customer.query.get(reminder.customer_id)
                    if not customer or not customer.telegram_chat_id:
                        reminder.is_active = False
                        continue
                    
                    # Mijozning hali qarzi bormi
                    remaining_debt = self.db.session.query(
                        self.db.func.sum(Sale.debt_usd)
                    ).filter(
                        Sale.customer_id == reminder.customer_id,
                        Sale.debt_usd > 0
                    ).scalar() or 0
                    
                    if float(remaining_debt) <= 0:
                        reminder.is_sent = True
                        reminder.is_active = False
                        continue
                    
                    # Kurs
                    rate = CurrencyRate.query.order_by(CurrencyRate.id.desc()).first()
                    exchange_rate = float(rate.rate) if rate else 13000
                    debt_uzs = float(remaining_debt) * exchange_rate
                    
                    # Telegram yuborish
                    try:
                        success = self.bot.send_debt_reminder_sync(
                            chat_id=customer.telegram_chat_id,
                            customer_name=customer.name,
                            debt_usd=float(remaining_debt),
                            debt_uzs=debt_uzs,
                            location_name="Do'kon",
                            customer_id=customer.id
                        )
                        
                        if success:
                            reminder.is_sent = True
                            reminder.sent_at = get_tashkent_time()
                            sent_count += 1
                            logger.info(f"✅ Belgilangan eslatma yuborildi: {customer.name}")
                        
                        await asyncio.sleep(1)
                        
                    except Exception as e:
                        logger.error(f"❌ Eslatma yuborishda xatolik ({customer.name}): {e}")
                
                self.db.session.commit()
                
                if sent_count > 0:
                    logger.info(f"📊 Belgilangan eslatmalar: {sent_count} ta yuborildi")
                
            except Exception as e:
                self.db.session.rollback()
                logger.error(f"❌ Belgilangan eslatmalarni tekshirishda xatolik: {e}")
    
    def stop(self):
        """Schedulerni to'xtatish"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Scheduler to'xtatildi")


# Singleton instance
_scheduler_instance = None

def get_scheduler_instance(app=None, db=None) -> DebtScheduler:
    """Scheduler instanceni olish"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = DebtScheduler(app=app, db=db)
    return _scheduler_instance


# Flask app integration
def init_debt_scheduler(app, db):
    """
    Flask app bilan integratsiya
    
    Usage:
        from debt_scheduler import init_debt_scheduler
        init_debt_scheduler(app, db)
    """
    scheduler = get_scheduler_instance(app=app, db=db)
    scheduler.start()
    
    # Cleanup on shutdown
    import atexit
    atexit.register(lambda: scheduler.stop())
    
    logger.info("✅ Debt Scheduler Flask app bilan integratsiya qilindi")
    return scheduler


if __name__ == "__main__":
    # Test
    print("🧪 Debt Scheduler test")
    print("⚠️ Flask app bilan ishlatish kerak")
    
    # Test uchun:
    # from app import app, db
    # scheduler = init_debt_scheduler(app, db)
    # 
    # # Test - darhol eslatma yuborish
    # import asyncio
    # asyncio.run(
    #     scheduler.send_instant_reminder(
    #         customer_id=1,
    #         debt_usd=100,
    #         debt_uzs=1300000,
    #         location_name="Test Do'kon"
    #     )
    # )
