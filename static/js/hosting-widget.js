/**
 * Hosting Widget - Mijozlar uchun server holati va to'lovlar
 */
(function() {
    'use strict';

    // Widget konfiguratsiyasi
    const CONFIG = {
        API_BASE: window.location.origin,
        REFRESH_INTERVAL: 60000, // 1 daqiqa
        WIDGET_ID: 'hosting-widget-container'
    };

    // Token olish
    const script = document.currentScript;
    const TOKEN = script ? script.getAttribute('data-token') : null;

    if (!TOKEN) {
        console.error('❌ Hosting widget: token topilmadi');
        return;
    }

    /**
     * Widget HTML yaratish
     */
    function createWidgetHTML(data) {
        const { client, recent_payments } = data;
        
        // Server holati rangi
        const statusColor = client.server_status === 'active' ? '#10b981' : 
                           client.server_status === 'off' ? '#ef4444' : '#f59e0b';
        
        const statusText = client.server_status === 'active' ? 'Aktiv' :
                          client.server_status === 'off' ? 'O\'chiq' : 'To\'xtatilgan';
        
        // Balans rangi
        const balanceColor = client.balance >= client.monthly_price ? '#10b981' : 
                            client.balance > 0 ? '#f59e0b' : '#ef4444';
        
        return `
            <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 24px;
                color: white;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                max-width: 400px;
                margin: 20px auto;
                position: relative;
            ">
                <!-- Header -->
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    ">💻</div>
                    <div style="flex: 1;">
                        <div style="font-size: 20px; font-weight: 600;">Server Holati</div>
                        <div style="font-size: 14px; opacity: 0.9;">${client.name || 'Mijoz'}</div>
                    </div>
                    <button onclick="document.getElementById('${CONFIG.WIDGET_ID}').style.display='none'" 
                            style="
                                background: rgba(255,255,255,0.2);
                                border: none;
                                color: white;
                                width: 32px;
                                height: 32px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 18px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: background 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'">−</button>
                </div>

                <!-- Server Info -->
                <div style="
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 14px; opacity: 0.9;">Holat</span>
                        <span style="
                            background: ${statusColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                        ">${statusText}</span>
                    </div>
                    ${client.server_ip ? `
                        <div style="font-size: 13px; opacity: 0.8;">
                            📍 ${client.server_ip}
                        </div>
                    ` : ''}
                    ${client.droplet_name ? `
                        <div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">
                            🖥️ ${client.droplet_name}
                        </div>
                    ` : ''}
                </div>

                <!-- Balans -->
                <div style="
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                ">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Balans</div>
                    <div style="
                        font-size: 32px;
                        font-weight: 700;
                        color: ${balanceColor};
                        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    ">${formatMoney(client.balance)} so'm</div>
                    <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">
                        Oylik to'lov: ${formatMoney(client.monthly_price)} so'm
                    </div>
                    ${client.next_payment_date ? `
                        <div style="font-size: 13px; opacity: 0.8; margin-top: 4px;">
                            📅 Keyingi to'lov: ${formatDate(client.next_payment_date)}
                        </div>
                    ` : ''}
                </div>

                <!-- Oxirgi to'lovlar -->
                ${recent_payments && recent_payments.length > 0 ? `
                    <div style="
                        background: rgba(255,255,255,0.15);
                        backdrop-filter: blur(10px);
                        border-radius: 12px;
                        padding: 16px;
                    ">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">Oxirgi to'lovlar</div>
                        ${recent_payments.slice(0, 3).map(payment => `
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                padding: 8px 0;
                                border-bottom: 1px solid rgba(255,255,255,0.1);
                            ">
                                <span style="font-size: 13px;">
                                    ${payment.payment_date ? formatDate(payment.payment_date.split(' ')[0]) : 'N/A'}
                                </span>
                                <span style="font-size: 13px; font-weight: 600;">
                                    +${formatMoney(payment.amount_uzs)} so'm
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Footer -->
                <div style="
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    font-size: 12px;
                    opacity: 0.7;
                    text-align: center;
                ">
                    Oxirgi yangilanish: ${new Date().toLocaleTimeString('uz-UZ')}
                </div>
            </div>
        `;
    }

    /**
     * Pul formatini o'zgartirish
     */
    function formatMoney(amount) {
        return new Intl.NumberFormat('uz-UZ').format(amount || 0);
    }

    /**
     * Sana formatini o'zgartirish
     */
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('uz-UZ', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    /**
     * Ma'lumotlarni yuklash
     */
    async function loadWidgetData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/api/hosting/widget/${TOKEN}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Ma\'lumot yuklanmadi');
            }

            return data;
        } catch (error) {
            console.error('❌ Widget ma\'lumotini yuklashda xatolik:', error);
            throw error;
        }
    }

    /**
     * Widgetni yangilash
     */
    async function updateWidget() {
        try {
            const data = await loadWidgetData();
            const container = document.getElementById(CONFIG.WIDGET_ID);
            
            if (container) {
                container.innerHTML = createWidgetHTML(data);
            }
        } catch (error) {
            const container = document.getElementById(CONFIG.WIDGET_ID);
            if (container) {
                container.innerHTML = `
                    <div style="
                        font-family: sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 16px;
                        padding: 24px;
                        color: white;
                        text-align: center;
                        max-width: 400px;
                        margin: 20px auto;
                    ">
                        <div style="font-size: 40px; margin-bottom: 16px;">❌</div>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Mijoz topilmadi</div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            ${error.message || 'Ma\'lumot yuklanmadi'}
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * Widgetni ishga tushirish
     */
    function initWidget() {
        // Container yaratish
        let container = document.getElementById(CONFIG.WIDGET_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = CONFIG.WIDGET_ID;
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        // Dastlabki yuklash
        updateWidget();

        // Avtomatik yangilanish
        setInterval(updateWidget, CONFIG.REFRESH_INTERVAL);
    }

    // DOM tayyor bo'lganda ishga tushirish
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

    console.log('✅ Hosting widget yuklandi');
})();
