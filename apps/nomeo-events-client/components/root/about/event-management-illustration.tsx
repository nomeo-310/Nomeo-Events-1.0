export const EventManagementIllustration = () => (
  <svg width="100%" viewBox="0 0 680 500" role="img" xmlns="http://www.w3.org/2000/svg">
    <title>Event management platform illustration</title>
    <desc>An illustration showing the simplicity of event management - a laptop displaying an intuitive dashboard with ticket, calendar, and analytics widgets, surrounded by floating interface elements representing no-code tools, automated check-in, and payment processing.</desc>
    
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#EEF2FF', stopOpacity:0.5}} />
        <stop offset="100%" style={{stopColor:'#F5F3FF', stopOpacity:0.5}} />
      </linearGradient>
      <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:'#3F3F46', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#27272A', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#FFFFFF', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#F1F5F9', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:'#6366F1', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#4F46E5', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:'#10B981', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#059669', stopOpacity:1}} />
      </linearGradient>
      <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#2563EB', stopOpacity:1}} />
      </linearGradient>
      <filter id="shadow" x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.1"/>
      </filter>
      <filter id="softShadow" x="-12%" y="-12%" width="124%" height="124%">
        <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000000" floodOpacity="0.06"/>
      </filter>
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#4F46E5" floodOpacity="0.08"/>
      </filter>
    </defs>

    <rect width="680" height="500" fill="url(#bgGrad)" rx="24"/>
    <circle cx="340" cy="250" r="180" fill="#6366F1" opacity="0.02"/>
    <circle cx="100" cy="100" r="80" fill="#8B5CF6" opacity="0.03"/>
    <circle cx="580" cy="400" r="100" fill="#6366F1" opacity="0.03"/>

    <g transform="translate(170, 45)" filter="url(#shadow)">
      <rect x="0" y="0" width="340" height="230" rx="10" fill="#18181B"/>
      <rect x="8" y="8" width="324" height="203" rx="6" fill="#0F0F13"/>
      <rect x="12" y="12" width="316" height="190" rx="4" fill="url(#screenGrad)"/>
      <rect x="12" y="12" width="316" height="34" rx="4" fill="#FFFFFF"/>
      <rect x="320" y="20" width="4" height="18" rx="2" fill="#E2E8F0"/>
      <rect x="22" y="20" width="24" height="18" rx="5" fill="url(#cardGrad1)"/>
      <text x="53" y="33" fontSize="11" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">Nomeo Events</text>
      <rect x="140" y="22" width="42" height="14" rx="7" fill="#EEF2FF"/>
      <text x="161" y="33" fontSize="8" fill="#4F46E5" textAnchor="middle" fontFamily="sans-serif">Events</text>
      <text x="192" y="33" fontSize="8" fill="#94A3B8" textAnchor="middle" fontFamily="sans-serif">Analytics</text>
      <text x="228" y="33" fontSize="8" fill="#94A3B8" textAnchor="middle" fontFamily="sans-serif">Tickets</text>
      <text x="255" y="33" fontSize="8" fill="#94A3B8" textAnchor="middle" fontFamily="sans-serif">Settings</text>
      <circle cx="304" cy="29" r="3" fill="#EF4444"/>
      <circle cx="316" cy="29" r="8" fill="#E2E8F0"/>
      <rect x="22" y="54" width="296" height="28" rx="8" fill="#EEF2FF" opacity="0.7"/>
      <text x="34" y="72" fontSize="10" fontWeight="bold" fill="#4338CA" fontFamily="sans-serif">✨ Welcome back! Your event is live</text>
      <rect x="22" y="92" width="90" height="48" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="0.5" filter="url(#softShadow)"/>
      <text x="32" y="112" fontSize="7" fill="#94A3B8" fontFamily="sans-serif">Tickets Sold</text>
      <text x="32" y="130" fontSize="20" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">847</text>
      <rect x="89" y="116" width="14" height="5" rx="2" fill="#D1FAE5"/>
      <rect x="122" y="92" width="90" height="48" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="0.5" filter="url(#softShadow)"/>
      <text x="132" y="112" fontSize="7" fill="#94A3B8" fontFamily="sans-serif">Revenue</text>
      <text x="132" y="130" fontSize="20" fontWeight="bold" fill="#059669" fontFamily="sans-serif">₦4.2M</text>
      <rect x="189" y="116" width="14" height="5" rx="2" fill="#D1FAE5"/>
      <rect x="222" y="92" width="106" height="48" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="0.5" filter="url(#softShadow)"/>
      <text x="232" y="112" fontSize="7" fill="#94A3B8" fontFamily="sans-serif">Check-ins Today</text>
      <text x="232" y="130" fontSize="20" fontWeight="bold" fill="#2563EB" fontFamily="sans-serif">234</text>
      <rect x="305" y="116" width="14" height="5" rx="2" fill="#DBEAFE"/>
      <rect x="22" y="150" width="296" height="52" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="0.5" filter="url(#softShadow)"/>
      <text x="32" y="166" fontSize="8" fontWeight="bold" fill="#475569" fontFamily="sans-serif">Sales Trend</text>
      <rect x="32" y="173" width="12" height="18" rx="2" fill="#A5B4FC"/>
      <rect x="48" y="168" width="12" height="23" rx="2" fill="#818CF8"/>
      <rect x="64" y="162" width="12" height="29" rx="2" fill="#6366F1"/>
      <rect x="80" y="165" width="12" height="26" rx="2" fill="#818CF8"/>
      <rect x="96" y="158" width="12" height="33" rx="2" fill="#4F46E5"/>
      <rect x="112" y="160" width="12" height="31" rx="2" fill="#6366F1"/>
      <rect x="128" y="155" width="12" height="36" rx="2" fill="#4338CA"/>
      <rect x="144" y="170" width="12" height="21" rx="2" fill="#818CF8"/>
      <rect x="160" y="167" width="12" height="24" rx="2" fill="#6366F1"/>
      <rect x="176" y="153" width="12" height="38" rx="2" fill="#4F46E5"/>
      <rect x="192" y="163" width="12" height="28" rx="2" fill="#818CF8"/>
      <rect x="208" y="157" width="12" height="34" rx="2" fill="#6366F1"/>
      <rect x="224" y="152" width="12" height="39" rx="2" fill="#4338CA"/>
      <rect x="240" y="164" width="12" height="27" rx="2" fill="#818CF8"/>
      <rect x="256" y="150" width="12" height="41" rx="2" fill="#4F46E5"/>
      <rect x="272" y="158" width="12" height="33" rx="2" fill="#6366F1"/>
      <rect x="288" y="148" width="12" height="43" rx="2" fill="#4338CA"/>
      <rect x="-8" y="230" width="356" height="16" rx="6" fill="url(#laptopGrad)"/>
      <rect x="140" y="246" width="76" height="6" rx="3" fill="#52525B"/>
    </g>

    <g transform="translate(30, 90)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#EEF2FF"/>
      <rect x="12" y="12" width="12" height="4" rx="2" fill="#4F46E5"/>
      <rect x="12" y="18" width="8" height="4" rx="2" fill="#818CF8"/>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">No-Code</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">Drag & drop builder</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">Zero technical skills</text>
      <circle cx="120" cy="10" r="2" fill="#EEF2FF"/>
      <circle cx="128" cy="15" r="1.5" fill="#EEF2FF"/>
    </g>

    <g transform="translate(30, 210)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#ECFDF5"/>
      <text x="18" y="23" fontSize="12" fontWeight="bold" fill="#059669" textAnchor="middle" fontFamily="sans-serif">₦</text>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">Payments</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">Paystack • Flutterwave</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">Cards • Bank • USSD</text>
      <circle cx="120" cy="10" r="2" fill="#ECFDF5"/>
      <circle cx="128" cy="15" r="1.5" fill="#ECFDF5"/>
    </g>

    <g transform="translate(30, 320)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#FFF7ED"/>
      <text x="18" y="24" fontSize="13" textAnchor="middle" fontFamily="sans-serif">💬</text>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">24/7 Support</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">Live chat & phone</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">Dedicated account mgr</text>
      <circle cx="120" cy="10" r="2" fill="#FFF7ED"/>
      <circle cx="128" cy="15" r="1.5" fill="#FFF7ED"/>
    </g>

    <g transform="translate(510, 90)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#FEF3C7"/>
      <rect x="11" y="11" width="14" height="10" rx="2" fill="#D97706"/>
      <rect x="16" y="13" width="4" height="6" rx="1" fill="#FEF3C7"/>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">Auto-Ticket</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">QR code check-in</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">Instant email delivery</text>
      <circle cx="120" cy="10" r="2" fill="#FEF3C7"/>
      <circle cx="128" cy="15" r="1.5" fill="#FEF3C7"/>
    </g>

    <g transform="translate(510, 210)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#DBEAFE"/>
      <rect x="11" y="14" width="4" height="8" rx="1" fill="#3B82F6"/>
      <rect x="17" y="10" width="4" height="12" rx="1" fill="#2563EB"/>
      <rect x="23" y="16" width="4" height="6" rx="1" fill="#3B82F6"/>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">Analytics</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">Real-time dashboards</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">Sales & attendance data</text>
      <circle cx="120" cy="10" r="2" fill="#DBEAFE"/>
      <circle cx="128" cy="15" r="1.5" fill="#DBEAFE"/>
    </g>

    <g transform="translate(510, 320)" filter="url(#cardShadow)">
      <rect x="0" y="0" width="140" height="80" rx="14" fill="white"/>
      <circle cx="18" cy="18" r="14" fill="#F0FDF4"/>
      <text x="18" y="24" fontSize="13" textAnchor="middle" fontFamily="sans-serif">🔒</text>
      <text x="40" y="22" fontSize="13" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">Security</text>
      <text x="14" y="48" fontSize="9" fill="#64748B" fontFamily="sans-serif">Bank-grade encryption</text>
      <text x="14" y="62" fontSize="9" fill="#64748B" fontFamily="sans-serif">GDPR compliant</text>
      <circle cx="120" cy="10" r="2" fill="#F0FDF4"/>
      <circle cx="128" cy="15" r="1.5" fill="#F0FDF4"/>
    </g>

    <g transform="translate(30, 40)" filter="url(#softShadow)">
      <rect x="0" y="0" width="110" height="32" rx="16" fill="white"/>
      <circle cx="22" cy="16" r="8" fill="#EEF2FF"/>
      <text x="22" y="20" fontSize="9" fill="#4F46E5" textAnchor="middle" fontFamily="sans-serif">✓</text>
      <text x="36" y="20" fontSize="11" fontWeight="600" fill="#4338CA" fontFamily="sans-serif">Intuitive UI</text>
    </g>

    <g transform="translate(540, 40)" filter="url(#softShadow)">
      <rect x="0" y="0" width="110" height="32" rx="16" fill="white"/>
      <rect x="14" y="10" width="12" height="12" rx="2" fill="#0F172A"/>
      <rect x="16" y="12" width="4" height="4" fill="white"/>
      <rect x="20" y="12" width="4" height="4" fill="white"/>
      <rect x="16" y="16" width="4" height="4" fill="white"/>
      <rect x="20" y="16" width="4" height="4" fill="white"/>
      <text x="36" y="20" fontSize="11" fontWeight="600" fill="#334155" fontFamily="sans-serif">QR Check-in</text>
    </g>

    <circle cx="175" cy="130" r="2.5" fill="#6366F1" opacity="0.25"/>
    <circle cx="165" cy="250" r="2" fill="#6366F1" opacity="0.2"/>
    <circle cx="175" cy="360" r="2.5" fill="#6366F1" opacity="0.25"/>
    <circle cx="505" cy="130" r="2.5" fill="#6366F1" opacity="0.25"/>
    <circle cx="515" cy="250" r="2" fill="#6366F1" opacity="0.2"/>
    <circle cx="505" cy="360" r="2.5" fill="#6366F1" opacity="0.25"/>
    
    <line x1="170" y1="135" x2="310" y2="200" stroke="#6366F1" strokeWidth="0.5" opacity="0.12" strokeDasharray="4,4"/>
    <line x1="510" y1="135" x2="430" y2="200" stroke="#6366F1" strokeWidth="0.5" opacity="0.12" strokeDasharray="4,4"/>
  </svg>
);