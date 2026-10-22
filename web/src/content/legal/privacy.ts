import type { LegalDoc } from './types';

// Retention periods must match backend/src/services/account.service.js (RETENTION).
const en: LegalDoc = {
  intro: 'Amana connects people who send parcels with travellers who carry them. This policy explains which personal data we collect, why, who receives it, how long we keep it and what your rights are. We wrote it to be read: if anything is unclear, write to us.',
  sections: [
    {
      id: 'controller', title: '1. Who is responsible for your data',
      blocks: [
        'The data controller is {legalName}, {address} ("Amana", "we").',
        'For any question about your data or to exercise your rights, write to {privacyEmail}.',
        'Representative in the European Union (art. 27 GDPR): {euRepresentative}.',
        'We apply the Swiss Federal Act on Data Protection (FADP) and, because we serve people in the European Union, the General Data Protection Regulation (GDPR). Members living in Morocco, Algeria or Tunisia also benefit from the protections of their national data-protection laws.',
      ],
    },
    {
      id: 'data', title: '2. What data we collect',
      blocks: [
        { list: [
          'Account: phone number, name, date of birth (to check you are 18 or older; not shown to other members), a password (stored only in encrypted form), and optionally your email, a photo and a short bio. We do not ask for your home address.',
          'Identity verification: type of document, photos of your ID card (front and back) or passport, a short selfie video in which you say a code we give you, the date of your consent and the result of the review.',
          'Trips you publish: cities, pickup address and map pin, dates, transport mode, capacity and price.',
          'Parcels you send: pickup and delivery addresses, description, weight, declared value and photos.',
          'Bookings and delivery: status, tracking steps, delivery photo, delivery code, disputes, ratings and reviews.',
          'Payments: amounts, fees, status and the references of our payment provider. We never see or store your card number.',
          'Messages you exchange in the booking chat, and the notifications we send you.',
          'Recipient who pays: if a sender asks someone else to pay, we receive that person\'s phone number from the sender.',
          'Technical data: IP address (used for security and abuse limits, not stored in your profile) and the cookies described in the Cookie Policy.',
        ] },
      ],
    },
    {
      id: 'purposes', title: '3. Why we use it and on what legal basis',
      blocks: [
        { table: { head: ['Purpose', 'Legal basis'], rows: [
          ['Creating your account and signing you in with an SMS/WhatsApp code', 'Performance of our contract with you'],
          ['Publishing trips and parcels, bookings, chat, tracking, holding the payment until delivery and paying the traveller', 'Performance of the contract'],
          ['Verifying the identity of members (ID + selfie video)', 'Our legitimate interest and that of members in the safety of people and parcels and in preventing fraud; your consent for the selfie video'],
          ['Handling disputes, preventing fraud, securing the platform, keeping evidence for legal claims and cooperating with the authorities', 'Legitimate interest; legal obligation where the law requires it'],
          ['Inviting a recipient to pay for a parcel', 'Legitimate interest of the sender and of Amana in carrying out the delivery requested'],
          ['Service messages (SMS, WhatsApp, in-app notifications)', 'Performance of the contract'],
          ['Accounting and tax records', 'Legal obligation'],
        ] } },
        'We do not sell your data, we do not use it for advertising and we do not take decisions about you based solely on automated processing.',
      ],
    },
    {
      id: 'recipients', title: '4. Who can see your data',
      blocks: [
        { list: [
          'Other members see your name, photo, bio, rating, reviews, "verified" badge and the trips you publish. Once a booking exists, the sender and the traveller see what they need to carry out the delivery (addresses, parcel details, chat). Your phone number is never shown to other members.',
          'Amana staff (administrators and moderators) see identity documents to review them and booking details to resolve disputes. Access to identity files is restricted and recorded.',
          'Service providers who process data on our behalf, under a data-processing agreement: Railway (application hosting), Neon (database), Cloudinary (storage of photos, documents and videos), Twilio (sign-in codes, SMS and WhatsApp messages), OpenStreetMap / Nominatim (address search and maps: the addresses you type are sent to it) and, when card payments are enabled, Stripe.',
          'Public authorities, when the law requires it or to report an offence (for example a parcel that is not delivered or a dangerous item).',
        ] },
      ],
    },
    {
      id: 'transfers', title: '5. Transfers outside Switzerland and the EU',
      blocks: [
        'Some of our providers are located in, or may access data from, the United States. These transfers are covered by the EU–US and Swiss–US Data Privacy Framework or by the standard contractual clauses approved by the European Commission and recognised in Switzerland.',
        'Amana carries parcels to and from Morocco, Algeria and Tunisia. When you book a delivery with a member in one of these countries, the data needed for that delivery is shared with that member because it is necessary to perform the contract you asked for.',
      ],
    },
    {
      id: 'retention', title: '6. How long we keep your data',
      blocks: [
        { table: { head: ['Data', 'How long'], rows: [
          ['Account and profile', 'While your account is open. When you close it, your profile is anonymised immediately.'],
          ['ID photos (card or passport)', 'While your account is open. After closure: 5 years after your last delivery, to handle disputes and legal claims. If you never made a delivery: deleted when you close the account.'],
          ['Selfie video', '30 days after the review of your verification'],
          ['Documents of a rejected verification', '30 days after the decision'],
          ['Chat, delivery photos and parcel addresses', '5 years after the booking ends'],
          ['Payment and accounting records', 'As long as accounting and tax laws require (up to 10 years)'],
          ['Notifications and record of invitations sent', '12 months'],
          ['Log of staff actions', '5 years'],
        ] } },
        'Exceptions: while a dispute is open, while an account is blocked for breaking our rules, or when an incident has been reported to the authorities (legal hold), we keep the related data until the matter is closed.',
        'When the period ends, the data is deleted or irreversibly anonymised. Reviews you wrote stay visible under "Deleted user".',
      ],
    },
    {
      id: 'rights', title: '7. Your rights',
      blocks: [
        'You can at any time ask to access your data, correct it, delete it, restrict or object to its use, receive it in a portable format and withdraw your consent (withdrawal does not affect what was done before).',
        { list: [
          'Download your data: Profile → Privacy & your data → Download my data.',
          'Close your account: Profile → Privacy & your data → Close my account.',
          'For anything else, write to {privacyEmail}. We answer within one month and may ask you to prove your identity.',
        ] },
        'You can also complain to a supervisory authority: in Switzerland the Federal Data Protection and Information Commissioner (FDPIC); in the EU the authority of your country (for example CNIL in France, AEPD in Spain, APD/GBA in Belgium); in Morocco the CNDP.',
      ],
    },
    {
      id: 'security', title: '8. Security',
      blocks: [
        'Connections are encrypted. Identity documents, selfie videos and parcel and delivery photos are stored privately and are only shown through temporary signed links. Staff access depends on their role, and every access to an identity file is recorded. If a data breach puts your rights at risk, we will inform the competent authority and, where required, you.',
      ],
    },
    {
      id: 'age', title: '9. Minimum age',
      blocks: ['Amana is reserved for people aged 18 or over. We do not knowingly collect data about minors; if you think a minor has an account, tell us and we will delete it.'],
    },
    {
      id: 'cookies', title: '10. Cookies',
      blocks: ['We only use the cookies needed to keep you signed in and remember your language. Details in the Cookie Policy.'],
    },
    {
      id: 'changes', title: '11. Changes',
      blocks: ['If we change this policy in a way that matters to you, we will tell you in the app before the change applies. The date of the latest version is shown at the top of this page.'],
    },
  ],
};

const fr: LegalDoc = {
  intro: "Amana met en relation des personnes qui envoient des colis et des voyageurs qui les transportent. Cette politique explique quelles données personnelles nous collectons, pourquoi, qui les reçoit, combien de temps nous les gardons et quels sont vos droits. Si quelque chose n'est pas clair, écrivez-nous.",
  sections: [
    {
      id: 'controller', title: '1. Qui est responsable de vos données',
      blocks: [
        'Le responsable du traitement est {legalName}, {address} (« Amana », « nous »).',
        'Pour toute question sur vos données ou pour exercer vos droits : {privacyEmail}.',
        "Représentant dans l'Union européenne (art. 27 RGPD) : {euRepresentative}.",
        "Nous appliquons la loi fédérale suisse sur la protection des données (LPD) et, parce que nous servons des personnes dans l'Union européenne, le Règlement général sur la protection des données (RGPD). Les membres résidant au Maroc, en Algérie ou en Tunisie bénéficient aussi des protections de leur loi nationale.",
      ],
    },
    {
      id: 'data', title: '2. Les données que nous collectons',
      blocks: [
        { list: [
          "Compte : numéro de téléphone, nom, date de naissance (pour vérifier que vous avez 18 ans ou plus ; elle n'est pas visible par les autres membres), un mot de passe (conservé uniquement sous forme chiffrée) et, si vous le souhaitez, votre e-mail, une photo et une courte présentation. Nous ne demandons pas votre adresse de domicile.",
          "Vérification d'identité : type de document, photos de votre carte d'identité (recto et verso) ou de votre passeport, une courte vidéo selfie dans laquelle vous dites un code que nous vous donnons, la date de votre consentement et le résultat de la vérification.",
          'Trajets publiés : villes, adresse et point de prise en charge sur la carte, dates, mode de transport, capacité et prix.',
          'Colis envoyés : adresses de prise en charge et de livraison, description, poids, valeur déclarée et photos.',
          'Réservations et livraison : statut, étapes de suivi, photo de livraison, code de livraison, litiges, notes et avis.',
          'Paiements : montants, frais, statut et références de notre prestataire de paiement. Nous ne voyons ni ne conservons jamais votre numéro de carte.',
          'Messages échangés dans le chat de la réservation et notifications que nous vous envoyons.',
          "Destinataire qui paie : si un expéditeur demande à quelqu'un d'autre de payer, nous recevons le numéro de cette personne de la part de l'expéditeur.",
          'Données techniques : adresse IP (pour la sécurité et la limitation des abus, non enregistrée dans votre profil) et les cookies décrits dans la Politique relative aux cookies.',
        ] },
      ],
    },
    {
      id: 'purposes', title: '3. Pourquoi nous les utilisons et sur quelle base légale',
      blocks: [
        { table: { head: ['Finalité', 'Base légale'], rows: [
          ['Créer votre compte et vous connecter avec un code SMS/WhatsApp', 'Exécution du contrat'],
          ['Publier trajets et colis, réservations, chat, suivi, conserver le paiement jusqu’à la livraison et payer le voyageur', 'Exécution du contrat'],
          ["Vérifier l'identité des membres (pièce d'identité + vidéo selfie)", 'Intérêt légitime d’Amana et des membres à la sécurité des personnes et des colis et à la prévention de la fraude ; votre consentement pour la vidéo selfie'],
          ['Gérer les litiges, prévenir la fraude, sécuriser la plateforme, conserver des preuves en cas d’action en justice et coopérer avec les autorités', 'Intérêt légitime ; obligation légale lorsque la loi l’exige'],
          ['Inviter un destinataire à payer un colis', "Intérêt légitime de l'expéditeur et d'Amana à réaliser la livraison demandée"],
          ['Messages de service (SMS, WhatsApp, notifications)', 'Exécution du contrat'],
          ['Comptabilité et obligations fiscales', 'Obligation légale'],
        ] } },
        "Nous ne vendons pas vos données, nous ne les utilisons pas pour de la publicité et nous ne prenons aucune décision vous concernant fondée uniquement sur un traitement automatisé.",
      ],
    },
    {
      id: 'recipients', title: '4. Qui peut voir vos données',
      blocks: [
        { list: [
          "Les autres membres voient votre nom, photo, présentation, note, avis, badge « vérifié » et les trajets que vous publiez. Une fois une réservation créée, l'expéditeur et le voyageur voient ce qui est nécessaire à la livraison (adresses, détails du colis, chat). Votre numéro de téléphone n'est jamais montré aux autres membres.",
          "L'équipe Amana (administrateurs et modérateurs) voit les pièces d'identité pour les vérifier et les détails des réservations pour résoudre les litiges. L'accès aux dossiers d'identité est restreint et enregistré.",
          "Les prestataires qui traitent des données pour notre compte, sous contrat de sous-traitance : Railway (hébergement), Neon (base de données), Cloudinary (stockage des photos, documents et vidéos), Twilio (codes de connexion, SMS et WhatsApp), OpenStreetMap / Nominatim (recherche d'adresses et cartes : les adresses saisies lui sont envoyées) et, lorsque le paiement par carte sera activé, Stripe.",
          "Les autorités publiques, lorsque la loi l'exige ou pour signaler une infraction (par exemple un colis non livré ou un objet dangereux).",
        ] },
      ],
    },
    {
      id: 'transfers', title: "5. Transferts hors de Suisse et de l'UE",
      blocks: [
        "Certains prestataires sont situés aux États-Unis ou peuvent y accéder aux données. Ces transferts sont encadrés par le Data Privacy Framework UE–États-Unis et Suisse–États-Unis ou par les clauses contractuelles types approuvées par la Commission européenne et reconnues en Suisse.",
        "Amana transporte des colis depuis et vers le Maroc, l'Algérie et la Tunisie. Lorsque vous réservez une livraison avec un membre dans l'un de ces pays, les données nécessaires à cette livraison lui sont communiquées, car c'est nécessaire à l'exécution du contrat que vous avez demandé.",
      ],
    },
    {
      id: 'retention', title: '6. Combien de temps nous les conservons',
      blocks: [
        { table: { head: ['Données', 'Durée'], rows: [
          ['Compte et profil', 'Tant que votre compte est ouvert. À la fermeture, votre profil est anonymisé immédiatement.'],
          ["Photos de la pièce d'identité ou du passeport", "Tant que votre compte est ouvert. Après la fermeture : 5 ans après votre dernière livraison, pour gérer les litiges et actions en justice. Sans aucune livraison : supprimées à la fermeture du compte."],
          ['Vidéo selfie', '30 jours après la vérification'],
          ['Documents d’une vérification refusée', '30 jours après la décision'],
          ['Chat, photos de livraison et adresses des colis', '5 ans après la fin de la réservation'],
          ['Paiements et comptabilité', 'Le temps exigé par les lois comptables et fiscales (jusqu’à 10 ans)'],
          ['Notifications et historique des invitations envoyées', '12 mois'],
          ["Journal des actions de l'équipe", '5 ans'],
        ] } },
        "Exceptions : tant qu'un litige est ouvert, qu'un compte est bloqué pour non-respect de nos règles, ou qu'un incident a été signalé aux autorités (gel juridique), nous conservons les données concernées jusqu'à la clôture de l'affaire.",
        "À la fin de la durée, les données sont supprimées ou anonymisées de façon irréversible. Les avis que vous avez écrits restent visibles sous « Utilisateur supprimé ».",
      ],
    },
    {
      id: 'rights', title: '7. Vos droits',
      blocks: [
        "Vous pouvez à tout moment demander l'accès à vos données, leur rectification, leur effacement, la limitation ou l'opposition à leur traitement, les recevoir dans un format portable et retirer votre consentement (le retrait ne remet pas en cause ce qui a été fait avant).",
        { list: [
          'Télécharger vos données : Profil → Confidentialité et données → Télécharger mes données.',
          'Fermer votre compte : Profil → Confidentialité et données → Fermer mon compte.',
          "Pour toute autre demande : {privacyEmail}. Nous répondons dans un délai d'un mois et pouvons vous demander de prouver votre identité.",
        ] },
        "Vous pouvez aussi saisir une autorité de contrôle : en Suisse le Préposé fédéral à la protection des données et à la transparence (PFPDT) ; dans l'UE l'autorité de votre pays (par exemple la CNIL en France, l'AEPD en Espagne, l'APD en Belgique) ; au Maroc la CNDP.",
      ],
    },
    {
      id: 'security', title: '8. Sécurité',
      blocks: [
        "Les connexions sont chiffrées. Les pièces d'identité, vidéos selfie et photos de colis et de livraison sont stockées de façon privée et ne sont affichées que par des liens signés temporaires. L'accès de l'équipe dépend de son rôle et chaque consultation d'un dossier d'identité est enregistrée. Si une violation de données présente un risque pour vos droits, nous en informerons l'autorité compétente et, si nécessaire, vous-même.",
      ],
    },
    {
      id: 'age', title: '9. Âge minimum',
      blocks: ["Amana est réservé aux personnes de 18 ans ou plus. Nous ne collectons pas sciemment de données sur des mineurs ; si vous pensez qu'un mineur a un compte, prévenez-nous et nous le supprimerons."],
    },
    {
      id: 'cookies', title: '10. Cookies',
      blocks: ['Nous utilisons uniquement les cookies nécessaires pour vous garder connecté et mémoriser votre langue. Détails dans la Politique relative aux cookies.'],
    },
    {
      id: 'changes', title: '11. Modifications',
      blocks: ["Si nous modifions cette politique d'une manière qui vous concerne, nous vous en informerons dans l'application avant l'entrée en vigueur. La date de la dernière version figure en haut de cette page."],
    },
  ],
};

const es: LegalDoc = {
  intro: 'Amana conecta a personas que envían paquetes con viajeros que los llevan. Esta política explica qué datos personales recogemos, para qué, quién los recibe, cuánto tiempo los guardamos y cuáles son tus derechos. Si algo no queda claro, escríbenos.',
  sections: [
    {
      id: 'controller', title: '1. Quién es responsable de tus datos',
      blocks: [
        'El responsable del tratamiento es {legalName}, {address} («Amana», «nosotros»).',
        'Para cualquier pregunta sobre tus datos o para ejercer tus derechos: {privacyEmail}.',
        'Representante en la Unión Europea (art. 27 RGPD): {euRepresentative}.',
        'Aplicamos la Ley federal suiza de protección de datos (LPD) y, como damos servicio a personas en la Unión Europea, el Reglamento General de Protección de Datos (RGPD). Los miembros que viven en Marruecos, Argelia o Túnez también cuentan con la protección de su ley nacional.',
      ],
    },
    {
      id: 'data', title: '2. Qué datos recogemos',
      blocks: [
        { list: [
          'Cuenta: número de teléfono, nombre, fecha de nacimiento (para comprobar que tienes 18 años o más; no se muestra a otros usuarios), una contraseña (guardada solo de forma cifrada) y, si quieres, tu correo, una foto y una breve presentación. No pedimos tu dirección de casa.',
          'Verificación de identidad: tipo de documento, fotos de tu DNI (anverso y reverso) o pasaporte, un vídeo selfie corto en el que dices un código que te damos, la fecha de tu consentimiento y el resultado de la revisión.',
          'Viajes que publicas: ciudades, dirección y punto de recogida en el mapa, fechas, medio de transporte, capacidad y precio.',
          'Paquetes que envías: direcciones de recogida y entrega, descripción, peso, valor declarado y fotos.',
          'Reservas y entrega: estado, pasos del seguimiento, foto de entrega, código de entrega, disputas, valoraciones y opiniones.',
          'Pagos: importes, comisiones, estado y referencias de nuestro proveedor de pagos. Nunca vemos ni guardamos el número de tu tarjeta.',
          'Mensajes que intercambias en el chat de la reserva y notificaciones que te enviamos.',
          'Destinatario que paga: si un remitente pide a otra persona que pague, recibimos su número de teléfono del remitente.',
          'Datos técnicos: dirección IP (para seguridad y límites contra abusos, no se guarda en tu perfil) y las cookies descritas en la Política de cookies.',
        ] },
      ],
    },
    {
      id: 'purposes', title: '3. Para qué los usamos y con qué base legal',
      blocks: [
        { table: { head: ['Finalidad', 'Base legal'], rows: [
          ['Crear tu cuenta e iniciar sesión con un código por SMS/WhatsApp', 'Ejecución del contrato contigo'],
          ['Publicar viajes y paquetes, reservas, chat, seguimiento, retener el pago hasta la entrega y pagar al viajero', 'Ejecución del contrato'],
          ['Verificar la identidad de los miembros (documento + vídeo selfie)', 'Interés legítimo de Amana y de los miembros en la seguridad de personas y paquetes y en prevenir el fraude; tu consentimiento para el vídeo selfie'],
          ['Gestionar disputas, prevenir el fraude, proteger la plataforma, conservar pruebas para reclamaciones legales y colaborar con las autoridades', 'Interés legítimo; obligación legal cuando la ley lo exige'],
          ['Invitar a un destinatario a pagar un paquete', 'Interés legítimo del remitente y de Amana en realizar la entrega solicitada'],
          ['Mensajes del servicio (SMS, WhatsApp, notificaciones)', 'Ejecución del contrato'],
          ['Contabilidad y obligaciones fiscales', 'Obligación legal'],
        ] } },
        'No vendemos tus datos, no los usamos para publicidad y no tomamos decisiones sobre ti basadas únicamente en un tratamiento automatizado.',
      ],
    },
    {
      id: 'recipients', title: '4. Quién puede ver tus datos',
      blocks: [
        { list: [
          'Los demás miembros ven tu nombre, foto, presentación, valoración, opiniones, insignia de «verificado» y los viajes que publicas. Cuando hay una reserva, el remitente y el viajero ven lo necesario para la entrega (direcciones, detalles del paquete, chat). Tu número de teléfono nunca se muestra a otros miembros.',
          'El equipo de Amana (administradores y moderadores) ve los documentos de identidad para revisarlos y los detalles de las reservas para resolver disputas. El acceso a las fichas de identidad está restringido y queda registrado.',
          'Proveedores que tratan datos por cuenta nuestra, con contrato de encargo de tratamiento: Railway (alojamiento), Neon (base de datos), Cloudinary (almacenamiento de fotos, documentos y vídeos), Twilio (códigos de acceso, SMS y WhatsApp), OpenStreetMap / Nominatim (búsqueda de direcciones y mapas: las direcciones que escribes se le envían) y, cuando se active el pago con tarjeta, Stripe.',
          'Autoridades públicas, cuando la ley lo exige o para denunciar un delito (por ejemplo un paquete no entregado o un objeto peligroso).',
        ] },
      ],
    },
    {
      id: 'transfers', title: '5. Transferencias fuera de Suiza y de la UE',
      blocks: [
        'Algunos proveedores están en Estados Unidos o pueden acceder a los datos desde allí. Estas transferencias están cubiertas por el Data Privacy Framework UE–EE. UU. y Suiza–EE. UU. o por las cláusulas contractuales tipo aprobadas por la Comisión Europea y reconocidas en Suiza.',
        'Amana lleva paquetes desde y hacia Marruecos, Argelia y Túnez. Cuando reservas una entrega con un miembro en uno de esos países, los datos necesarios para esa entrega se comparten con él porque es necesario para cumplir el contrato que pediste.',
      ],
    },
    {
      id: 'retention', title: '6. Cuánto tiempo los guardamos',
      blocks: [
        { table: { head: ['Datos', 'Plazo'], rows: [
          ['Cuenta y perfil', 'Mientras tu cuenta esté abierta. Al cerrarla, tu perfil se anonimiza al momento.'],
          ['Fotos del DNI o pasaporte', 'Mientras tu cuenta esté abierta. Tras cerrarla: 5 años desde tu última entrega, para atender disputas y reclamaciones legales. Si nunca hiciste una entrega: se borran al cerrar la cuenta.'],
          ['Vídeo selfie', '30 días después de la revisión'],
          ['Documentos de una verificación rechazada', '30 días después de la decisión'],
          ['Chat, fotos de entrega y direcciones de los paquetes', '5 años después de terminar la reserva'],
          ['Pagos y contabilidad', 'El tiempo que exijan las leyes contables y fiscales (hasta 10 años)'],
          ['Notificaciones y registro de invitaciones enviadas', '12 meses'],
          ['Registro de acciones del equipo', '5 años'],
        ] } },
        'Excepciones: mientras haya una disputa abierta, una cuenta bloqueada por incumplir nuestras normas o un incidente denunciado a las autoridades (bloqueo legal), conservamos los datos relacionados hasta que el asunto se cierre.',
        'Al terminar el plazo, los datos se borran o se anonimizan de forma irreversible. Las opiniones que escribiste siguen visibles como «Usuario eliminado».',
      ],
    },
    {
      id: 'rights', title: '7. Tus derechos',
      blocks: [
        'Puedes pedir en cualquier momento acceder a tus datos, rectificarlos, suprimirlos, limitar u oponerte a su uso, recibirlos en un formato portable y retirar tu consentimiento (la retirada no afecta a lo hecho antes).',
        { list: [
          'Descargar tus datos: Perfil → Privacidad y tus datos → Descargar mis datos.',
          'Cerrar tu cuenta: Perfil → Privacidad y tus datos → Cerrar mi cuenta.',
          'Para cualquier otra cosa: {privacyEmail}. Respondemos en un plazo de un mes y podemos pedirte que acredites tu identidad.',
        ] },
        'También puedes reclamar ante una autoridad de control: en Suiza el Encargado Federal de Protección de Datos y Transparencia (FDPIC/PFPDT); en la UE la autoridad de tu país (por ejemplo la AEPD en España, la CNIL en Francia, la APD en Bélgica); en Marruecos la CNDP.',
      ],
    },
    {
      id: 'security', title: '8. Seguridad',
      blocks: [
        'Las conexiones van cifradas. Los documentos de identidad, los vídeos selfie y las fotos de paquetes y entregas se guardan de forma privada y solo se muestran mediante enlaces firmados temporales. El acceso del equipo depende de su rol y cada consulta de una ficha de identidad queda registrada. Si una brecha de datos pone en riesgo tus derechos, lo comunicaremos a la autoridad competente y, cuando corresponda, a ti.',
      ],
    },
    {
      id: 'age', title: '9. Edad mínima',
      blocks: ['Amana es solo para mayores de 18 años. No recogemos a sabiendas datos de menores; si crees que un menor tiene una cuenta, avísanos y la eliminaremos.'],
    },
    {
      id: 'cookies', title: '10. Cookies',
      blocks: ['Solo usamos las cookies necesarias para mantener tu sesión y recordar tu idioma. Más detalles en la Política de cookies.'],
    },
    {
      id: 'changes', title: '11. Cambios',
      blocks: ['Si cambiamos esta política de una forma que te afecte, te avisaremos en la app antes de que se aplique. La fecha de la última versión aparece arriba en esta página.'],
    },
  ],
};

const ar: LegalDoc = {
  intro: 'تربط أمانة بين الأشخاص الذين يرسلون الطرود والمسافرين الذين ينقلونها. توضّح هذه السياسة البيانات الشخصية التي نجمعها، ولماذا، ومن يتلقاها، ومدة احتفاظنا بها، وما هي حقوقك. إذا كان أي شيء غير واضح، راسلنا.',
  sections: [
    {
      id: 'controller', title: '1. المسؤول عن بياناتك',
      blocks: [
        'المسؤول عن معالجة البيانات هو {legalName}، {address} («أمانة»، «نحن»).',
        'لأي سؤال عن بياناتك أو لممارسة حقوقك: {privacyEmail}.',
        'الممثل في الاتحاد الأوروبي (المادة 27 من اللائحة العامة لحماية البيانات): {euRepresentative}.',
        'نطبّق القانون الفيدرالي السويسري لحماية البيانات، ولأننا نخدم أشخاصًا في الاتحاد الأوروبي، اللائحة العامة لحماية البيانات (GDPR). ويستفيد الأعضاء المقيمون في المغرب أو الجزائر أو تونس أيضًا من حماية قوانينهم الوطنية.',
      ],
    },
    {
      id: 'data', title: '2. البيانات التي نجمعها',
      blocks: [
        { list: [
          'الحساب: رقم الهاتف، الاسم، تاريخ الميلاد (للتحقق من أن عمرك 18 عامًا أو أكثر؛ لا يظهر للأعضاء الآخرين)، كلمة مرور (تُحفظ بشكل مشفّر فقط)، واختياريًا بريدك الإلكتروني وصورة ونبذة قصيرة. لا نطلب عنوان سكنك.',
          'التحقق من الهوية: نوع الوثيقة، صور بطاقة الهوية (الوجه والظهر) أو جواز السفر، فيديو سيلفي قصير تقول فيه رمزًا نعطيك إياه، تاريخ موافقتك ونتيجة المراجعة.',
          'الرحلات التي تنشرها: المدن، عنوان ونقطة الاستلام على الخريطة، التواريخ، وسيلة النقل، السعة والسعر.',
          'الطرود التي ترسلها: عنوانا الاستلام والتسليم، الوصف، الوزن، القيمة المصرّح بها والصور.',
          'الحجوزات والتسليم: الحالة، خطوات التتبع، صورة التسليم، رمز التسليم، النزاعات، التقييمات والآراء.',
          'المدفوعات: المبالغ، الرسوم، الحالة ومراجع مزوّد الدفع. لا نرى رقم بطاقتك ولا نحتفظ به أبدًا.',
          'الرسائل التي تتبادلها في محادثة الحجز والإشعارات التي نرسلها إليك.',
          'المستلم الذي يدفع: إذا طلب مرسل من شخص آخر أن يدفع، نتلقى رقم هاتف ذلك الشخص من المرسل.',
          'بيانات تقنية: عنوان IP (للأمان وللحد من إساءة الاستخدام، ولا يُحفظ في ملفك) وملفات تعريف الارتباط الموصوفة في سياسة ملفات تعريف الارتباط.',
        ] },
      ],
    },
    {
      id: 'purposes', title: '3. لماذا نستخدمها وعلى أي أساس قانوني',
      blocks: [
        { table: { head: ['الغرض', 'الأساس القانوني'], rows: [
          ['إنشاء حسابك وتسجيل دخولك برمز عبر الرسائل القصيرة/واتساب', 'تنفيذ العقد معك'],
          ['نشر الرحلات والطرود، الحجوزات، المحادثة، التتبع، حجز المبلغ حتى التسليم والدفع للمسافر', 'تنفيذ العقد'],
          ['التحقق من هوية الأعضاء (الوثيقة + فيديو السيلفي)', 'المصلحة المشروعة لأمانة والأعضاء في سلامة الأشخاص والطرود ومنع الاحتيال؛ وموافقتك على فيديو السيلفي'],
          ['معالجة النزاعات، منع الاحتيال، تأمين المنصة، حفظ الأدلة للمطالبات القانونية والتعاون مع السلطات', 'المصلحة المشروعة؛ والالتزام القانوني عندما يفرضه القانون'],
          ['دعوة مستلم لدفع ثمن طرد', 'المصلحة المشروعة للمرسل ولأمانة في تنفيذ التوصيل المطلوب'],
          ['رسائل الخدمة (الرسائل القصيرة، واتساب، الإشعارات)', 'تنفيذ العقد'],
          ['المحاسبة والالتزامات الضريبية', 'التزام قانوني'],
        ] } },
        'لا نبيع بياناتك، ولا نستخدمها للإعلانات، ولا نتخذ قرارات بشأنك تعتمد فقط على معالجة آلية.',
      ],
    },
    {
      id: 'recipients', title: '4. من يمكنه رؤية بياناتك',
      blocks: [
        { list: [
          'يرى الأعضاء الآخرون اسمك وصورتك ونبذتك وتقييمك وآراءك وشارة «موثّق» والرحلات التي تنشرها. بعد إنشاء حجز، يرى المرسل والمسافر ما يلزم لإتمام التوصيل (العناوين، تفاصيل الطرد، المحادثة). لا يُعرض رقم هاتفك أبدًا على الأعضاء الآخرين.',
          'يرى فريق أمانة (المسؤولون والمشرفون) وثائق الهوية لمراجعتها وتفاصيل الحجوزات لحل النزاعات. الوصول إلى ملفات الهوية مقيّد ومسجَّل.',
          'مزوّدو الخدمات الذين يعالجون البيانات نيابةً عنا بموجب اتفاقية معالجة بيانات: Railway (الاستضافة)، Neon (قاعدة البيانات)، Cloudinary (تخزين الصور والوثائق والفيديوهات)، Twilio (رموز الدخول والرسائل القصيرة وواتساب)، OpenStreetMap / Nominatim (البحث عن العناوين والخرائط: تُرسل إليه العناوين التي تكتبها)، وStripe عند تفعيل الدفع بالبطاقة.',
          'السلطات العامة عندما يفرض القانون ذلك أو للإبلاغ عن جريمة (مثل طرد لم يُسلَّم أو غرض خطير).',
        ] },
      ],
    },
    {
      id: 'transfers', title: '5. النقل خارج سويسرا والاتحاد الأوروبي',
      blocks: [
        'يقع بعض مزوّدينا في الولايات المتحدة أو قد يصلون إلى البيانات منها. هذا النقل مشمول بإطار خصوصية البيانات بين الاتحاد الأوروبي/سويسرا والولايات المتحدة أو بالبنود التعاقدية النموذجية المعتمدة من المفوضية الأوروبية والمعترف بها في سويسرا.',
        'تنقل أمانة الطرود من وإلى المغرب والجزائر وتونس. عندما تحجز توصيلًا مع عضو في أحد هذه البلدان، تُشارَك معه البيانات اللازمة لهذا التوصيل لأن ذلك ضروري لتنفيذ العقد الذي طلبته.',
      ],
    },
    {
      id: 'retention', title: '6. مدة الاحتفاظ بالبيانات',
      blocks: [
        { table: { head: ['البيانات', 'المدة'], rows: [
          ['الحساب والملف الشخصي', 'ما دام حسابك مفتوحًا. عند إغلاقه، يُجعل ملفك مجهول الهوية فورًا.'],
          ['صور بطاقة الهوية أو جواز السفر', 'ما دام حسابك مفتوحًا. بعد الإغلاق: 5 سنوات بعد آخر توصيل لك، لمعالجة النزاعات والمطالبات القانونية. إذا لم تقم بأي توصيل: تُحذف عند إغلاق الحساب.'],
          ['فيديو السيلفي', '30 يومًا بعد المراجعة'],
          ['وثائق التحقق المرفوض', '30 يومًا بعد القرار'],
          ['المحادثة وصور التسليم وعناوين الطرود', '5 سنوات بعد انتهاء الحجز'],
          ['المدفوعات والمحاسبة', 'المدة التي تفرضها قوانين المحاسبة والضرائب (حتى 10 سنوات)'],
          ['الإشعارات وسجل الدعوات المرسلة', '12 شهرًا'],
          ['سجل إجراءات الفريق', '5 سنوات'],
        ] } },
        'الاستثناءات: ما دام هناك نزاع مفتوح، أو حساب محظور لمخالفة قواعدنا، أو حادث أُبلغت به السلطات (حجز قانوني)، نحتفظ بالبيانات المعنية حتى إغلاق القضية.',
        'عند انتهاء المدة، تُحذف البيانات أو تُجعل مجهولة الهوية بشكل نهائي. تبقى الآراء التي كتبتها ظاهرة باسم «مستخدم محذوف».',
      ],
    },
    {
      id: 'rights', title: '7. حقوقك',
      blocks: [
        'يمكنك في أي وقت طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو تقييد استخدامها أو الاعتراض عليه، والحصول عليها بصيغة قابلة للنقل، وسحب موافقتك (لا يؤثر السحب على ما تم قبله).',
        { list: [
          'تنزيل بياناتك: الملف الشخصي ← الخصوصية وبياناتك ← تنزيل بياناتي.',
          'إغلاق حسابك: الملف الشخصي ← الخصوصية وبياناتك ← إغلاق حسابي.',
          'لأي طلب آخر: {privacyEmail}. نرد خلال شهر وقد نطلب منك إثبات هويتك.',
        ] },
        'يمكنك أيضًا تقديم شكوى إلى سلطة رقابية: في سويسرا المفوّض الفيدرالي لحماية البيانات والشفافية (FDPIC)؛ في الاتحاد الأوروبي سلطة بلدك (مثل CNIL في فرنسا، AEPD في إسبانيا، APD في بلجيكا)؛ وفي المغرب اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP).',
      ],
    },
    {
      id: 'security', title: '8. الأمان',
      blocks: [
        'الاتصالات مشفّرة. تُخزَّن وثائق الهوية وفيديوهات السيلفي وصور الطرود والتسليم بشكل خاص ولا تُعرض إلا عبر روابط موقّعة مؤقتة. يعتمد وصول الفريق على دوره، ويُسجَّل كل اطلاع على ملف هوية. إذا عرّض خرقٌ للبيانات حقوقك للخطر، سنبلغ السلطة المختصة، وعند الاقتضاء نبلغك أنت.',
      ],
    },
    {
      id: 'age', title: '9. الحد الأدنى للسن',
      blocks: ['أمانة مخصصة لمن بلغوا 18 عامًا فأكثر. لا نجمع عن علم بيانات القاصرين؛ إذا كنت تعتقد أن لقاصر حسابًا، أخبرنا وسنحذفه.'],
    },
    {
      id: 'cookies', title: '10. ملفات تعريف الارتباط',
      blocks: ['نستخدم فقط ملفات تعريف الارتباط اللازمة لإبقائك مسجّلًا وتذكّر لغتك. التفاصيل في سياسة ملفات تعريف الارتباط.'],
    },
    {
      id: 'changes', title: '11. التغييرات',
      blocks: ['إذا غيّرنا هذه السياسة بطريقة تهمّك، سنخبرك في التطبيق قبل سريان التغيير. يظهر تاريخ آخر نسخة أعلى هذه الصفحة.'],
    },
  ],
};

export const PRIVACY: Record<string, LegalDoc> = { en, fr, es, ar };
