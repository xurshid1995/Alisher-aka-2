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

        #hosting-widget .hw-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #dc3545;
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
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
            <span class="hw-badge" id="hw-badge" style="display:none;"></span>
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
                var badge = document.getElementById('hw-badge');
                
                // Toggle rang
                toggle.className = 'hw-toggle ' + status;

                // Badge
                if (status === 'danger' || status === 'overdue') {
                    badge.style.display = 'block';
                    badge.textContent = status === 'overdue' ? '!' : data.days_left;
                } else if (status === 'warning') {
                    badge.style.display = 'block';
                    badge.textContent = data.days_left;
                } else {
                    badge.style.display = 'none';
                }

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
                var badge = document.getElementById('hw-badge');
                toggle.className = 'hw-toggle ' + data.status;
                if (data.status === 'danger' || data.status === 'overdue') {
                    badge.style.display = 'block';
                    badge.textContent = data.status === 'overdue' ? '!' : data.days_left;
                } else if (data.status === 'warning') {
                    badge.style.display = 'block';
                    badge.textContent = data.days_left;
                }
            })
            .catch(function() {});
    }, 1000);

})();
