from app import db, app, User
import bcrypt

with app.app_context():
    # Admin user mavjudligini tekshirish
    admin = User.query.filter_by(username='admin').first()
    
    if not admin:
        # Parolni hash qilish
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Admin user yaratish
        admin = User(
            username='admin',
            first_name='Admin',
            last_name='User',
            email='admin@alisher.com',
            password=hashed_password,
            role='admin',
            is_active=True
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Admin user yaratildi!")
        print("Username: admin")
        print("Password: admin123")
    else:
        print("⚠️ Admin user allaqachon mavjud")
