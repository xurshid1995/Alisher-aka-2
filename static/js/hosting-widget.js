/**
 * Hosting Widget - Mijozlar uchun balans va to'lov ma'lumotlari
 * Foydalanish: <script src="https://206.81.17.211/static/js/hosting-widget.js" data-token="YOUR_TOKEN"></script>
 */
(function() {
    'use strict';

    // Konfiguratsiya
    const CONFIG = {
        API_URL: 'http://206.81.17.211/api/hosting/widget',
        REFRESH_INTERVAL: 300000, // 5 daqiqa
        WIDGET_ID: 'hosting-widget-container'
    };

    // Token olish
    const script = document.currentScript;
    const TOKEN = script ? script.getAttribute('data-token') : null;

    if (!TOKEN) {
        console.error('❌ Hosting widget: Token topilmadi');
        return;
    }

    /**
     * Widget HTML yaratish
     */
    function createWidgetHTML(data) {
        const { client, recent_payments } = data;
        
        // Status rangi
        const statusColor = client.server_status === 'active' ? '#10b981' : '#ef4444';
        const statusText = client.server_status === 'active' ? 'Faol' : 'Nofaol';
        
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
                margin: 20px;
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
                        <div style="font-size: 20px; font-weight: 600;">Hosting</div>
                        <div style="font-size: 14px; opacity: 0.9;">${client.name || ''}</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.style.display='none'" 
                            style="
                                background: rgba(255,255,255,0.2);
                                border: none;
                                color: white;
                                width: 32px;
                                height: 32px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 18px;
                                transition: background 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
                </div>

                <!-- Balans -->
                <div style="
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 16px;
                    text-align: center;
                ">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Balans</div>
                    <div style="
                        font-size: 36px;
                        font-weight: 700;
                        color: ${balanceColor};
                        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        margin-bottom: 8px;
                    ">${formatMoney(client.balance)} so'm</div>
                    <div style="font-size: 13px; opacity: 0.8;">
                        Oylik to'lov: ${formatMoney(client.monthly_price)} so'm
                    </div>
                </div>

                <!-- Server holati va keyingi to'lov -->
                <div style="
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-size: 14px; opacity: 0.9;">Server</span>
                        <span style="
                            background: ${statusColor};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                        ">${statusText}</span>
                    </div>
                    ${client.next_payment_date ? `
                        <div style="font-size: 13px; opacity: 0.8;">
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
                                <span style="font-size: 13px;">${payment.date}</span>
                                <span style="font-size: 13px; font-weight: 600;">
                                    +${formatMoney(payment.amount)} so'm
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
                    📞 Biz bilan bog'laning: +998(94) 635-06-06
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
        const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 
                       'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    /**
     * Ma'lumotlarni yuklash
     */
    async function loadWidgetData() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/${TOKEN}`);
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
        const container = document.getElementById(CONFIG.WIDGET_ID);
        if (!container) return;

        try {
            const data = await loadWidgetData();
            container.innerHTML = createWidgetHTML(data);
        } catch (error) {
            container.innerHTML = `
                <div style="
                    font-family: sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: 24px;
                    color: white;
                    text-align: center;
                    max-width: 400px;
                    margin: 20px;
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
