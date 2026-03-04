/**
 * Hosting Balans Widget
 * Mijoz saytiga qo'shiladi - doim balans va qolgan kunlarni ko'rsatadi
 * 
 * Foydalanish:
 * <script src="https://sergeli0606.uz/static/js/hosting-widget.js" data-token="MIJOZ_TOKEN"></script>
 */
(function() {
    'use strict';

    // Script tagidan token olish
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    var token = currentScript.getAttribute('data-token');
    var position = currentScript.getAttribute('data-position') || 'bottom-right'; // bottom-right, bottom-left, top-right, top-left
    var apiBase = currentScript.src.replace('/static/js/hosting-widget.js', '');

    if (!token) {
        console.error('Hosting Widget: data-token ko\'rsatilmagan!');
        return;
    }

    // CSS stillar
    var style = document.createElement('style');
    style.textContent = `
        #hosting-widget {
            position: fixed;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        #hosting-widget.bottom-right { bottom: 20px; right: 20px; }
        #hosting-widget.bottom-left { bottom: 20px; left: 20px; }
        #hosting-widget.top-right { top: 20px; right: 20px; }
        #hosting-widget.top-left { top: 20px; left: 20px; }

        #hosting-widget .hw-toggle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s;
            color: white;
        }
        #hosting-widget .hw-toggle:hover { transform: scale(1.1); }
        #hosting-widget .hw-toggle.ok { background: linear-gradient(135deg, #28a745, #20c997); }
        #hosting-widget .hw-toggle.warning { background: linear-gradient(135deg, #ffc107, #fd7e14); }
        #hosting-widget .hw-toggle.danger { background: linear-gradient(135deg, #dc3545, #e83e8c); }
        #hosting-widget .hw-toggle.overdue { background: linear-gradient(135deg, #dc3545, #721c24); }

        #hosting-widget .hw-panel {
            display: none;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            padding: 20px;
            min-width: 280px;
            margin-bottom: 10px;
            animation: hw-fadeIn 0.3s ease;
        }
        #hosting-widget .hw-panel.show { display: block; }

        @keyframes hw-fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #hosting-widget .hw-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        #hosting-widget .hw-title {
            font-size: 16px;
            font-weight: 700;
            color: #333;
        }
        #hosting-widget .hw-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #999;
            padding: 0;
            line-height: 1;
        }
        #hosting-widget .hw-close:hover { color: #333; }

        #hosting-widget .hw-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
        }
        #hosting-widget .hw-label {
            color: #888;
            font-size: 13px;
        }
        #hosting-widget .hw-value {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }

        #hosting-widget .hw-balance {
            text-align: center;
            padding: 15px;
            border-radius: 12px;
            margin: 10px 0;
        }
        #hosting-widget .hw-balance.ok { background: #d4edda; }
        #hosting-widget .hw-balance.warning { background: #fff3cd; }
        #hosting-widget .hw-balance.danger { background: #f8d7da; }
        #hosting-widget .hw-balance.overdue { background: #f8d7da; }

        #hosting-widget .hw-balance-amount {
            font-size: 24px;
            font-weight: 800;
        }
        #hosting-widget .hw-balance.ok .hw-balance-amount { color: #155724; }
        #hosting-widget .hw-balance.warning .hw-balance-amount { color: #856404; }
        #hosting-widget .hw-balance.danger .hw-balance-amount { color: #721c24; }
        #hosting-widget .hw-balance.overdue .hw-balance-amount { color: #721c24; }

        #hosting-widget .hw-balance-label {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }

        #hosting-widget .hw-days {
            text-align: center;
            font-size: 13px;
            padding: 8px;
            border-radius: 8px;
            margin-top: 5px;
        }
        #hosting-widget .hw-days.ok { color: #155724; background: #d4edda; }
        #hosting-widget .hw-days.warning { color: #856404; background: #fff3cd; }
        #hosting-widget .hw-days.danger { color: #721c24; background: #f8d7da; }
        #hosting-widget .hw-days.overdue { color: #721c24; background: #f8d7da; }

        #hosting-widget .hw-server {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        #hosting-widget .hw-server.active { background: #d4edda; color: #155724; }
        #hosting-widget .hw-server.off { background: #f8d7da; color: #721c24; }
        #hosting-widget .hw-server.suspended { background: #fff3cd; color: #856404; }

        #hosting-widget .hw-footer {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 11px;
            color: #bbb;
        }

        #hw-qr-modal, #hw-qr-modal-contact {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 999999;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(4px);
        }
        #hw-qr-modal.show, #hw-qr-modal-contact.show { display: flex; }
        #hw-qr-modal .hw-qr-box, #hw-qr-modal-contact .hw-qr-box {
            background: white;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: hwQrZoom 0.3s ease;
            position: relative;
            max-width: 350px;
        }
        @keyframes hwQrZoom {
            from { transform: scale(0.7); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
            #hosting-widget .hw-panel {
                min-width: 250px;
                padding: 15px;
            }
        }
    `;
    document.head.appendChild(style);

    // Widget HTML
    var widget = document.createElement('div');
    widget.id = 'hosting-widget';
    widget.className = position;
    widget.innerHTML = `
        <div class="hw-panel" id="hw-panel">
            <div class="hw-header">
                <span class="hw-title">🖥️ Hosting</span>
                <button class="hw-close" onclick="document.getElementById('hw-panel').classList.remove('show')">&times;</button>
            </div>
            <div id="hw-content">
                <p style="text-align:center;color:#999;">Yuklanmoqda...</p>
            </div>
        </div>
        <div style="position:relative;display:inline-block;">
            <button class="hw-toggle ok" id="hw-toggle" onclick="toggleHostingWidget()">🖥️</button>
        </div>
        <div id="hw-qr-modal" onclick="if(event.target===this) this.classList.remove('show')">
            <div class="hw-qr-box">
                <button onclick="document.getElementById('hw-qr-modal').classList.remove('show')" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#999;line-height:1;">&times;</button>
                <div style="margin-bottom:16px;">
                    <img src="https://img.icons8.com/fluency/120/telegram-app.png" alt="Telegram" style="width:48px;height:48px;">
                    <h3 style="margin:8px 0 4px;color:#333;font-size:18px;">@DgitaloceanHostingTolov_bot</h3>
                    <p style="color:#888;font-size:13px;margin:0;">Telegram botga o'tish uchun skanerlang</p>
                </div>
                <div style="background:#f8f9fa;border-radius:12px;padding:20px;display:inline-block;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://t.me/DgitaloceanHostingTolov_bot&color=000000&bgcolor=f8f9fa" alt="QR Code" style="width:200px;height:200px;display:block;">
                </div>
                <div style="margin-top:16px;">
                    <a href="https://t.me/DgitaloceanHostingTolov_bot" target="_blank" style="display:inline-block;background:#0088cc;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">Telegram'da ochish</a>
                </div>
            </div>
        </div>
        <div id="hw-qr-modal-contact" onclick="if(event.target===this) this.classList.remove('show')">
            <div class="hw-qr-box">
                <button onclick="document.getElementById('hw-qr-modal-contact').classList.remove('show')" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#999;line-height:1;">&times;</button>
                <div style="margin-bottom:16px;">
                    <img src="https://img.icons8.com/fluency/120/telegram-app.png" alt="Telegram" style="width:48px;height:48px;">
                    <h3 style="margin:8px 0 4px;color:#333;font-size:18px;">DIAMONDaccesories</h3>
                    <p style="color:#888;font-size:13px;margin:0;">Biz bilan bog'lanish uchun skanerlang</p>
                </div>
                <div style="background:#f8f9fa;border-radius:12px;padding:20px;display:inline-block;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://t.me/DIAMONDaccesories&color=000000&bgcolor=f8f9fa" alt="QR Code" style="width:200px;height:200px;display:block;">
                </div>
                <div style="margin-top:16px;">
                    <a href="https://t.me/DIAMONDaccesories" target="_blank" style="display:inline-block;background:#28a745;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">Telegram'da ochish</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Toggle
    window.toggleHostingWidget = function() {
        var panel = document.getElementById('hw-panel');
        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            loadWidgetData();
        }
    };

    // Ma'lumotlarni yuklash
    function loadWidgetData() {
        var url = apiBase + '/api/hosting/widget/' + token;
        
        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (!data.success) {
                    document.getElementById('hw-content').innerHTML = '<p style="text-align:center;color:#e74c3c;">Token noto\'g\'ri</p>';
                    return;
                }

                var status = data.status;
                var toggle = document.getElementById('hw-toggle');
                
                // Toggle rang
                toggle.className = 'hw-toggle ' + status;

                // Server holati
                var serverText = data.server_status === 'active' ? '🟢 Faol' :
                                 data.server_status === 'off' ? '🔴 O\'chiq' :
                                 data.server_status === 'suspended' ? '⏸️ Bloklangan' : data.server_status;
                var serverClass = data.server_status || 'active';

                // Qolgan kunlar matni
                var daysText = '';
                if (data.days_left > 0 && data.end_date) {
                    daysText = '📅 ' + data.end_date + 'gacha (' + data.days_left + ' kun)';
                } else {
                    daysText = '❌ Balans tugagan! To\'lov qiling.';
                }

                document.getElementById('hw-content').innerHTML = `
                    <div class="hw-balance ${status}">
                        <div class="hw-balance-amount">${data.balance_formatted} so'm</div>
                        <div class="hw-balance-label">Balans</div>
                    </div>
                    <div class="hw-days ${status}">${daysText}</div>
                    <div class="hw-row">
                        <span class="hw-label">Oylik to'lov</span>
                        <span class="hw-value">${data.monthly_formatted} so'm</span>
                    </div>
                    <div class="hw-row">
                        <span class="hw-label">Server</span>
                        <span class="hw-server ${serverClass}">${serverText}</span>
                    </div>
                    <div style="margin-top:12px;padding:10px;background:linear-gradient(135deg,#0088cc,#0077b5);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                      <a href="https://t.me/DgitaloceanHostingTolov_bot" target="_blank" style="text-decoration:none;color:white;display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;">
                        <img src="https://img.icons8.com/color/120/telegram-app.png" alt="Telegram" style="width:24px;height:24px;">
                        @DgitaloceanHostingTolov_bot
                      </a>
                      <a href="javascript:void(0)" onclick="document.getElementById('hw-qr-modal').classList.add('show')" style="display:inline-flex;background:white;padding:3px;border-radius:6px;cursor:pointer;" title="QR Code ko'rish">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://t.me/DgitaloceanHostingTolov_bot&color=000000&bgcolor=ffffff" alt="QR" style="width:32px;height:32px;border-radius:4px;display:block;">
                      </a>
                    </div>
                    <div style="margin-top:8px;padding:10px;background:linear-gradient(135deg,#28a745,#20c997);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                      <a href="https://t.me/DIAMONDaccesories" target="_blank" style="text-decoration:none;color:white;display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;">
                        <img src="https://img.icons8.com/color/120/telegram-app.png" alt="Telegram" style="width:24px;height:24px;">
                        Biz bilan bog'laning
                      </a>
                      <a href="tel:+998946350606" style="text-decoration:none;color:white;font-size:13px;font-weight:600;">📞 +998(94) 635-06-06</a>
                      <a href="javascript:void(0)" onclick="document.getElementById('hw-qr-modal-contact').classList.add('show')" style="display:inline-flex;background:white;padding:3px;border-radius:6px;cursor:pointer;" title="QR Code ko'rish">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://t.me/DIAMONDaccesories&color=000000&bgcolor=ffffff" alt="QR" style="width:32px;height:32px;border-radius:4px;display:block;">
                      </a>
                    </div>
                `;
            })
            .catch(function(err) {
                document.getElementById('hw-content').innerHTML = '<p style="text-align:center;color:#e74c3c;">Xatolik yuz berdi</p>';
                console.error('Hosting Widget xatosi:', err);
            });
    }

    // Har 5 daqiqada yangilash
    setInterval(loadWidgetData, 300000);

    // Dastlab yuklash (toggle bosilmasa ham badge ko'rsatish uchun)
    setTimeout(function() {
        var url = apiBase + '/api/hosting/widget/' + token;
        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (!data.success) return;
                var toggle = document.getElementById('hw-toggle');
                toggle.className = 'hw-toggle ' + data.status;
            })
            .catch(function() {});
    }, 1000);

})();
