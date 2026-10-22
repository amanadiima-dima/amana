import type { LegalDoc } from './types';

// Keep in sync with what the web app actually sets: js-cookie in store/authStore.ts + next-intl's NEXT_LOCALE.
const en: LegalDoc = {
  intro: 'Amana only uses cookies that are strictly necessary for the service to work. We use no advertising, analytics or tracking cookies, which is why we do not show a cookie banner.',
  sections: [
    {
      id: 'list', title: '1. Cookies we use',
      blocks: [
        { table: { head: ['Name', 'Purpose', 'Duration'], rows: [
          ['accessToken', 'Keeps you signed in', '7 days'],
          ['refreshToken', 'Renews your session without asking for a new code', '30 days'],
          ['NEXT_LOCALE', 'Remembers the language you chose', 'Until you close the browser'],
        ] } },
        'These cookies are set by Amana itself (first-party) and are deleted when you sign out, except the language one.',
      ],
    },
    {
      id: 'third', title: '2. Third-party content',
      blocks: ['Maps and address search use OpenStreetMap. When a map or the address search is shown, your browser contacts OpenStreetMap servers, which see your IP address. They do not set cookies for us.'],
    },
    {
      id: 'control', title: '3. Your choices',
      blocks: ['You can delete or block cookies in your browser settings. If you block the session cookies you will not be able to sign in. More about your data in the Privacy Policy, or write to {privacyEmail}.'],
    },
  ],
};

const fr: LegalDoc = {
  intro: "Amana utilise uniquement des cookies strictement nécessaires au fonctionnement du service. Aucun cookie publicitaire, de mesure d'audience ou de suivi : c'est pourquoi nous n'affichons pas de bandeau cookies.",
  sections: [
    {
      id: 'list', title: '1. Les cookies utilisés',
      blocks: [
        { table: { head: ['Nom', 'Finalité', 'Durée'], rows: [
          ['accessToken', 'Vous garder connecté', '7 jours'],
          ['refreshToken', 'Renouveler votre session sans nouveau code', '30 jours'],
          ['NEXT_LOCALE', 'Mémoriser la langue choisie', "Jusqu'à la fermeture du navigateur"],
        ] } },
        'Ces cookies sont déposés par Amana (cookies internes) et supprimés à la déconnexion, sauf celui de la langue.',
      ],
    },
    {
      id: 'third', title: '2. Contenus tiers',
      blocks: ["Les cartes et la recherche d'adresses utilisent OpenStreetMap. Lorsqu'une carte ou la recherche d'adresse s'affiche, votre navigateur contacte les serveurs d'OpenStreetMap, qui voient votre adresse IP. Ils ne déposent pas de cookies pour nous."],
    },
    {
      id: 'control', title: '3. Vos choix',
      blocks: ['Vous pouvez supprimer ou bloquer les cookies dans les réglages de votre navigateur. Si vous bloquez les cookies de session, vous ne pourrez pas vous connecter. Plus de détails dans la Politique de confidentialité, ou écrivez à {privacyEmail}.'],
    },
  ],
};

const es: LegalDoc = {
  intro: 'Amana solo usa cookies estrictamente necesarias para que el servicio funcione. No usamos cookies de publicidad, analítica ni seguimiento, por eso no mostramos un banner de cookies.',
  sections: [
    {
      id: 'list', title: '1. Cookies que usamos',
      blocks: [
        { table: { head: ['Nombre', 'Para qué', 'Duración'], rows: [
          ['accessToken', 'Mantener tu sesión iniciada', '7 días'],
          ['refreshToken', 'Renovar tu sesión sin pedirte otro código', '30 días'],
          ['NEXT_LOCALE', 'Recordar el idioma que elegiste', 'Hasta que cierras el navegador'],
        ] } },
        'Estas cookies las pone la propia Amana (cookies propias) y se borran al cerrar sesión, salvo la del idioma.',
      ],
    },
    {
      id: 'third', title: '2. Contenido de terceros',
      blocks: ['Los mapas y la búsqueda de direcciones usan OpenStreetMap. Cuando se muestra un mapa o la búsqueda de direcciones, tu navegador se conecta a los servidores de OpenStreetMap, que ven tu dirección IP. No ponen cookies por nosotros.'],
    },
    {
      id: 'control', title: '3. Tus opciones',
      blocks: ['Puedes borrar o bloquear las cookies en los ajustes de tu navegador. Si bloqueas las cookies de sesión no podrás iniciar sesión. Más información en la Política de privacidad, o escríbenos a {privacyEmail}.'],
    },
  ],
};

const ar: LegalDoc = {
  intro: 'تستخدم أمانة فقط ملفات تعريف الارتباط الضرورية تمامًا لعمل الخدمة. لا نستخدم ملفات إعلانية أو تحليلية أو للتتبع، ولهذا لا نعرض شريط موافقة على ملفات تعريف الارتباط.',
  sections: [
    {
      id: 'list', title: '1. ملفات تعريف الارتباط المستخدمة',
      blocks: [
        { table: { head: ['الاسم', 'الغرض', 'المدة'], rows: [
          ['accessToken', 'إبقاؤك مسجّل الدخول', '7 أيام'],
          ['refreshToken', 'تجديد جلستك دون طلب رمز جديد', '30 يومًا'],
          ['NEXT_LOCALE', 'تذكّر اللغة التي اخترتها', 'حتى إغلاق المتصفح'],
        ] } },
        'تضع أمانة هذه الملفات بنفسها (ملفات الطرف الأول) وتُحذف عند تسجيل الخروج، باستثناء ملف اللغة.',
      ],
    },
    {
      id: 'third', title: '2. محتوى الأطراف الثالثة',
      blocks: ['تستخدم الخرائط والبحث عن العناوين خدمة OpenStreetMap. عند عرض خريطة أو البحث عن عنوان، يتصل متصفحك بخوادم OpenStreetMap التي ترى عنوان IP الخاص بك. ولا تضع ملفات تعريف ارتباط لصالحنا.'],
    },
    {
      id: 'control', title: '3. خياراتك',
      blocks: ['يمكنك حذف ملفات تعريف الارتباط أو حظرها من إعدادات متصفحك. إذا حظرت ملفات الجلسة فلن تتمكن من تسجيل الدخول. المزيد في سياسة الخصوصية، أو راسلنا على {privacyEmail}.'],
    },
  ],
};

export const COOKIES: Record<string, LegalDoc> = { en, fr, es, ar };
