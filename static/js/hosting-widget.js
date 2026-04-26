/**
 * Hosting To'lov Widget
 * Mijoz saytida oylik to'lov va server holatini ko'rsatadi
 */

(function() {
    'use strict';

    // Widget konfiguratsiyasi
    const WIDGET_CONFIG = {
        apiUrl: 'http://206.81.17.211',
        updateInterval: 300000, // 5 daqiqa
        position: 'bottom-right' // bottom-right, bottom-left, top-right, top-left
    };

    // Widget tokenini olish
    const scriptTag = document.currentScript;
    const token = scriptTag ? scriptTag.getAttribute('data-token') : null;
    const position = scriptTag ? scriptTag.getAttribute('data-position') || WIDGET_CONFIG.position : WIDGET_CONFIG.position;

    if (!token) {
        console.warn('Hosting widget: Token topilmadi');
        return;
    }

    // Widget HTML
    function createWidget() {
        const widget = document.createElement('div');
        widget.id = 'hosting-widget';
        widget.className = `hosting-widget hosting-widget-${position}`;
        widget.innerHTML = `
            <div class="hosting-widget-content">
                <div class="hosting-widget-header">
                    <span class="hosting-widget-title">🖥️ Server Holati</span>
                    <button class="hosting-widget-toggle" aria-label="Yopish">−</button>
                </div>
                <div class="hosting-widget-body">
                    <div class="hosting-widget-loading">Yuklanmoqda...</div>
                </div>
            </div>
        `;

        // Widget stillarini qo'shish
        const style = document.createElement('style');
        style.textContent = `
            .hosting-widget {
                position: fixed;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
            }

            .hosting-widget-bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .hosting-widget-bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .hosting-widget-top-right {
                top: 20px;
                right: 20px;
            }

            .hosting-widget-top-left {
                top: 20px;
                left: 20px;
            }

            .hosting-widget-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                overflow: hidden;
                min-width: 280px;
                max-width: 320px;
                transition: all 0.3s ease;
            }

            .hosting-widget-content.minimized .hosting-widget-body {
                display: none;
            }

            .hosting-widget-header {
                padding: 12px 16px;
                background: rgba(0,0,0,0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .hosting-widget-title {
                color: white;
                font-weight: 600;
                font-size: 15px;
            }

            .hosting-widget-toggle {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
                transition: background 0.2s;
            }

            .hosting-widget-toggle:hover {
                background: rgba(255,255,255,0.3);
            }

            .hosting-widget-body {
                padding: 16px;
                color: white;
            }

            .hosting-widget-loading {
                text-align: center;
                padding: 20px;
                opacity: 0.8;
            }

            .hosting-widget-info {
                margin-bottom: 12px;
            }

            .hosting-widget-info:last-child {
                margin-bottom: 0;
            }

            .hosting-widget-label {
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 4px;
            }

            .hosting-widget-value {
                font-size: 16px;
                font-weight: 600;
            }

            .hosting-widget-status {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-top: 4px;
            }

            .hosting-widget-status-good {
                background: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }

            .hosting-widget-status-normal {
                background: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }

            .hosting-widget-status-low {
                background: rgba(251, 191, 36, 0.3);
                color: #fbbf24;
            }

            .hosting-widget-status-zero {
                background: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }

            .hosting-widget-divider {
                height: 1px;
                background: rgba(255,255,255,0.2);
                margin: 12px 0;
            }

            .hosting-widget-error {
                background: rgba(239, 68, 68, 0.2);
                padding: 12px;
                border-radius: 8px;
                color: #fca5a5;
                font-size: 13px;
            }

            @media (max-width: 480px) {
                .hosting-widget {
                    bottom: 10px !important;
                    right: 10px !important;
                    left: 10px !important;
                }

                .hosting-widget-content {
                    max-width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(widget);

        return widget;
    }

    // Ma'lumotlarni yuklash
    async function loadWidgetData() {
        try {
            const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/hosting/widget/${token}`);
            const result = await response.json();

            if (result.success) {
                updateWidget(result.data);
            } else {
                showError(result.error || 'Ma\'lumot yuklanmadi');
            }
        } catch (error) {
            console.error('Hosting widget xatosi:', error);
            showError('Serverga ulanib bo\'lmadi');
        }
    }

    // Widget ma'lumotlarini yangilash
    function updateWidget(data) {
        const body = document.querySelector('.hosting-widget-body');
        
        // Balans statusini aniqlash
        let statusText = '';
        let statusClass = '';
        
        switch(data.balance_status) {
            case 'good':
                statusText = '✅ Yaxshi';
                statusClass = 'hosting-widget-status-good';
                break;
            case 'normal':
                statusText = '🟢 Normal';
                statusClass = 'hosting-widget-status-normal';
                break;
            case 'low':
                statusText = '⚠️ Kam';
                statusClass = 'hosting-widget-status-low';
                break;
            case 'zero':
                statusText = '🔴 To\'lov kerak';
                statusClass = 'hosting-widget-status-zero';
                break;
        }

        body.innerHTML = `
            <div class="hosting-widget-info">
                <div class="hosting-widget-label">Oylik to'lov</div>
                <div class="hosting-widget-value">${formatMoney(data.monthly_price)} so'm</div>
            </div>

            <div class="hosting-widget-divider"></div>

            <div class="hosting-widget-info">
                <div class="hosting-widget-label">Joriy balans</div>
                <div class="hosting-widget-value">${formatMoney(data.balance)} so'm</div>
                <span class="hosting-widget-status ${statusClass}">${statusText}</span>
            </div>

            <div class="hosting-widget-divider"></div>

            <div class="hosting-widget-info">
                <div class="hosting-widget-label">Yetarli muddat</div>
                <div class="hosting-widget-value">${data.months_covered} oy</div>
            </div>

            <div class="hosting-widget-info">
                <div class="hosting-widget-label">Keyingi to'lov</div>
                <div class="hosting-widget-value">${formatDate(data.next_payment_date)}</div>
            </div>

            ${data.server_ip ? `
                <div class="hosting-widget-divider"></div>
                <div class="hosting-widget-info">
                    <div class="hosting-widget-label">Server IP</div>
                    <div class="hosting-widget-value" style="font-size: 14px;">${data.server_ip}</div>
                </div>
            ` : ''}
        `;
    }

    // Xatolikni ko'rsatish
    function showError(message) {
        const body = document.querySelector('.hosting-widget-body');
        body.innerHTML = `
            <div class="hosting-widget-error">
                ❌ ${message}
            </div>
        `;
    }

    // Pulni formatlash
    function formatMoney(amount) {
        return new Intl.NumberFormat('uz-UZ').format(amount);
    }

    // Sanani formatlash
    function formatDate(dateString) {
        const date = new Date(dateString);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    // Widget yig'ish/yoyish
    function setupToggle() {
        const header = document.querySelector('.hosting-widget-header');
        const content = document.querySelector('.hosting-widget-content');
        const toggleBtn = document.querySelector('.hosting-widget-toggle');

        header.addEventListener('click', function() {
            const isMinimized = content.classList.toggle('minimized');
            toggleBtn.textContent = isMinimized ? '+' : '−';
        });
    }

    // Widgetni ishga tushirish
    function init() {
        createWidget();
        setupToggle();
        loadWidgetData();

        // Davriy yangilash
        setInterval(loadWidgetData, WIDGET_CONFIG.updateInterval);
    }

    // DOM tayyor bo'lganda ishga tushirish
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
