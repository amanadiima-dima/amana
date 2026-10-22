import type { LegalDoc } from './types';

// Rules described here are enforced by the backend (bookingFlow, tracking, bookingExpiry services):
// change both together. Fee = 10% of the gross price, deducted from the traveller's payout.
const en: LegalDoc = {
  intro: 'These Terms of Use govern your use of Amana, the platform that connects people who want to send a parcel ("senders") with people who are travelling and have room in their luggage or vehicle ("travellers"). By creating an account you accept them. Please read them together with our Privacy Policy.',
  sections: [
    {
      id: 'who', title: '1. Who we are and what we do',
      blocks: [
        'Amana is operated by {legalName}, {address} ("Amana", "we"). Contact: {privacyEmail}.',
        'Amana is an intermediary. We are not a carrier, courier, freight forwarder or customs agent: the delivery is agreed and carried out directly between the sender and the traveller. Our role is to put members in touch, verify identities, hold the payment until delivery and help resolve disputes.',
        'Amana is currently in a closed beta. Some features may change or be unavailable, and during the beta payments may be simulated (no real money is charged). We will tell you before real payments are enabled.',
      ],
    },
    {
      id: 'account', title: '2. Your account',
      blocks: [
        { list: [
          'You must be 18 or older and able to enter into a binding contract.',
          'You sign in with your own phone number and a one-time code. One account per person; do not share it or use someone else\'s number.',
          'The information you give (name, trips, parcels, declared values) must be true and kept up to date.',
          'Identity verification (ID document + selfie video) is reviewed by our staff. A "verified" badge means the document matched the person at the time of the review; it is not a guarantee of behaviour.',
          'You can close your account at any time from your profile, once no booking is in progress.',
        ] },
      ],
    },
    {
      id: 'trips', title: '3. Trips and bookings',
      blocks: [
        { list: [
          'Travellers publish trips with a route, date, available weight and price per kilogram. Once a trip has active bookings, its price, capacity and date can no longer be changed.',
          'Senders describe their parcel (content, weight, declared value, photos, addresses) and request a booking. The traveller is free to accept or refuse it.',
          'A sender may ask another person (the recipient) to pay. That person receives an invitation link and the booking only goes ahead once they have paid.',
          'Requests that are not answered or paid in time, and bookings for trips that have already departed, are cancelled automatically and any money held is refunded.',
        ] },
      ],
    },
    {
      id: 'items', title: '4. What can be sent',
      blocks: [
        'The following are forbidden: cash, banknotes, coins and financial instruments; prescription drugs, narcotics and controlled substances; alcohol; weapons, ammunition, explosives, flammable or hazardous materials; counterfeit goods; animals; anything whose transport, export or import is prohibited by the countries concerned. Perishable food is only allowed with the traveller\'s explicit agreement.',
        'The sender guarantees that the content matches the description, that the declared value is accurate and that the parcel complies with the laws of the countries of departure, transit and arrival, including customs rules, duties and taxes, which are the sender\'s responsibility.',
        'The traveller may inspect the parcel at pickup and refuse it if it looks forbidden, dangerous or does not match the description. Never carry a closed parcel you are not comfortable with.',
      ],
    },
    {
      id: 'payment', title: '5. Price, payment and fees',
      blocks: [
        { list: [
          'The price is the traveller\'s price per kilogram multiplied by the weight, plus any priority tip offered by the sender, in the currency of the trip.',
          'The payment must be made before the traveller picks up the parcel. Amana holds it and only releases it to the traveller once delivery is confirmed.',
          'Amana\'s service fee is 10% of the price. It is deducted from the amount paid to the traveller; the sender pays no extra fee.',
          'Travellers are responsible for declaring their income where the law requires it.',
          'Paying or arranging a delivery outside Amana removes the protection described in these Terms.',
        ] },
      ],
    },
    {
      id: 'delivery', title: '6. Pickup and delivery',
      blocks: [
        { list: [
          'The traveller records each step in the app: picked up, in transit, delivered.',
          'To confirm the delivery the traveller enters the 6-digit delivery code that only the sender has, and takes a photo of the parcel handed over. The sender should only share the code once the recipient has the parcel.',
          'The traveller must keep the parcel safe, not open it unless required by the authorities, and hand it over in the condition received.',
        ] },
      ],
    },
    {
      id: 'cancel', title: '7. Cancellations, refunds and disputes',
      blocks: [
        { list: [
          'Before pickup, the sender or the traveller can cancel; money already held is refunded in full to the payer. If the traveller cancels the trip, all its paid bookings are refunded.',
          'After pickup, the booking can no longer be cancelled. If there is a problem (late, damaged, lost or undelivered parcel), report it in the app: this opens a dispute and the payment stays blocked.',
          'A failed delivery automatically opens a dispute.',
          'Amana staff review the evidence (chat, tracking steps, photos, declared value) and decide to refund the payer, pay the traveller, or split the amount. We may ask both parties for information.',
        ] },
      ],
    },
    {
      id: 'conduct', title: '8. Rules of conduct',
      blocks: [
        { list: [
          'Be honest, respectful and punctual. Use the chat for anything related to the booking.',
          'Reviews must reflect a real experience. No insults, discrimination, personal data or advertising in reviews, profiles or messages.',
          'Do not use Amana to commit fraud, smuggle goods, launder money or harm others.',
        ] },
        'We may suspend or close an account, cancel bookings and keep the related data if these Terms are breached or if we suspect fraud or a risk to the safety of members. In serious cases we report to the authorities.',
      ],
    },
    {
      id: 'liability', title: '9. Liability',
      blocks: [
        'The sender and the traveller are each responsible for their own obligations towards the other. Amana is responsible for running the platform with reasonable care and for handling the payment as described in these Terms.',
        'To the extent the law allows, Amana is not liable for the content of parcels, for loss or damage caused by members, for customs decisions, or for forbidden or undeclared items. Where we are liable, our liability is limited to the fees we received for the booking concerned. Nothing in these Terms limits liability for intent, gross negligence, personal injury or anything that cannot be limited by law.',
        'Amana does not offer insurance for parcels. Declare the real value so the traveller can decide in full knowledge.',
      ],
    },
    {
      id: 'privacy', title: '10. Personal data',
      blocks: ['We process your data as explained in the Privacy Policy and the Cookie Policy.'],
    },
    {
      id: 'changes', title: '11. Changes to these Terms',
      blocks: ['We may update these Terms. If a change matters to you, we will tell you in the app before it applies; if you do not agree, you can close your account. The date of the latest version is shown at the top of this page.'],
    },
    {
      id: 'law', title: '12. Applicable law and disputes',
      blocks: [
        'These Terms are governed by the law of the country where {legalName} has its registered office. If you are a consumer, you keep the protection of the mandatory rules of the country where you live and may bring a claim before its courts.',
        'Before going to court, write to {privacyEmail}: most problems can be solved quickly. EU consumers can also use their national consumer mediation bodies.',
      ],
    },
  ],
};

const fr: LegalDoc = {
  intro: 'Les présentes conditions d\'utilisation régissent l\'utilisation d\'Amana, la plateforme qui met en relation des personnes souhaitant envoyer un colis (« expéditeurs ») et des personnes qui voyagent et ont de la place dans leurs bagages ou leur véhicule (« voyageurs »). En créant un compte, vous les acceptez. Lisez-les avec notre Politique de confidentialité.',
  sections: [
    {
      id: 'who', title: '1. Qui nous sommes et ce que nous faisons',
      blocks: [
        'Amana est exploitée par {legalName}, {address} (« Amana », « nous »). Contact : {privacyEmail}.',
        'Amana est un intermédiaire. Nous ne sommes ni transporteur, ni coursier, ni transitaire, ni commissionnaire en douane : la livraison est convenue et effectuée directement entre l\'expéditeur et le voyageur. Notre rôle est de mettre les membres en relation, de vérifier les identités, de conserver le paiement jusqu\'à la livraison et d\'aider à résoudre les litiges.',
        'Amana est actuellement en bêta fermée. Certaines fonctions peuvent changer ou être indisponibles et, pendant la bêta, les paiements peuvent être simulés (aucun argent réel n\'est débité). Nous vous préviendrons avant d\'activer les paiements réels.',
      ],
    },
    {
      id: 'account', title: '2. Votre compte',
      blocks: [
        { list: [
          'Vous devez avoir au moins 18 ans et la capacité de conclure un contrat.',
          'Vous vous connectez avec votre propre numéro de téléphone et un code à usage unique. Un compte par personne ; ne le partagez pas et n\'utilisez pas le numéro de quelqu\'un d\'autre.',
          'Les informations que vous fournissez (nom, trajets, colis, valeurs déclarées) doivent être exactes et à jour.',
          'La vérification d\'identité (pièce d\'identité + vidéo selfie) est examinée par notre équipe. Le badge « vérifié » signifie que le document correspondait à la personne au moment de l\'examen ; ce n\'est pas une garantie de comportement.',
          'Vous pouvez fermer votre compte à tout moment depuis votre profil, dès qu\'aucune réservation n\'est en cours.',
        ] },
      ],
    },
    {
      id: 'trips', title: '3. Trajets et réservations',
      blocks: [
        { list: [
          'Les voyageurs publient des trajets avec un itinéraire, une date, un poids disponible et un prix au kilo. Dès qu\'un trajet a des réservations actives, son prix, sa capacité et sa date ne peuvent plus être modifiés.',
          'Les expéditeurs décrivent leur colis (contenu, poids, valeur déclarée, photos, adresses) et demandent une réservation. Le voyageur est libre de l\'accepter ou de la refuser.',
          'Un expéditeur peut demander à une autre personne (le destinataire) de payer. Celle-ci reçoit un lien d\'invitation et la réservation n\'avance qu\'une fois le paiement effectué.',
          'Les demandes sans réponse ou non payées à temps, et les réservations de trajets déjà partis, sont annulées automatiquement et l\'argent conservé est remboursé.',
        ] },
      ],
    },
    {
      id: 'items', title: '4. Ce qui peut être envoyé',
      blocks: [
        'Sont interdits : l\'argent liquide, les billets, les pièces et les instruments financiers ; les médicaments sur ordonnance, les stupéfiants et les substances réglementées ; l\'alcool ; les armes, munitions, explosifs, matières inflammables ou dangereuses ; les contrefaçons ; les animaux ; tout ce dont le transport, l\'exportation ou l\'importation est interdit par les pays concernés. Les aliments périssables ne sont admis qu\'avec l\'accord explicite du voyageur.',
        'L\'expéditeur garantit que le contenu correspond à la description, que la valeur déclarée est exacte et que le colis respecte les lois des pays de départ, de transit et d\'arrivée, y compris les règles douanières, droits et taxes, qui sont à sa charge.',
        'Le voyageur peut inspecter le colis lors de la prise en charge et le refuser s\'il semble interdit, dangereux ou non conforme à la description. Ne transportez jamais un colis fermé qui vous met mal à l\'aise.',
      ],
    },
    {
      id: 'payment', title: '5. Prix, paiement et frais',
      blocks: [
        { list: [
          'Le prix est le prix au kilo du voyageur multiplié par le poids, plus l\'éventuel pourboire de priorité offert par l\'expéditeur, dans la devise du trajet.',
          'Le paiement doit être effectué avant que le voyageur ne prenne le colis. Amana le conserve et ne le verse au voyageur qu\'une fois la livraison confirmée.',
          'Les frais de service d\'Amana sont de 10 % du prix. Ils sont déduits du montant versé au voyageur ; l\'expéditeur ne paie aucun frais supplémentaire.',
          'Les voyageurs sont responsables de déclarer leurs revenus lorsque la loi l\'exige.',
          'Payer ou organiser une livraison en dehors d\'Amana fait perdre la protection décrite dans ces conditions.',
        ] },
      ],
    },
    {
      id: 'delivery', title: '6. Prise en charge et livraison',
      blocks: [
        { list: [
          'Le voyageur enregistre chaque étape dans l\'application : pris en charge, en transit, livré.',
          'Pour confirmer la livraison, le voyageur saisit le code de livraison à 6 chiffres que seul l\'expéditeur possède et prend une photo du colis remis. L\'expéditeur ne doit communiquer le code qu\'une fois le colis entre les mains du destinataire.',
          'Le voyageur doit garder le colis en sécurité, ne pas l\'ouvrir sauf demande des autorités, et le remettre dans l\'état où il l\'a reçu.',
        ] },
      ],
    },
    {
      id: 'cancel', title: '7. Annulations, remboursements et litiges',
      blocks: [
        { list: [
          'Avant la prise en charge, l\'expéditeur ou le voyageur peut annuler ; l\'argent déjà conservé est intégralement remboursé au payeur. Si le voyageur annule son trajet, toutes les réservations payées sont remboursées.',
          'Après la prise en charge, la réservation ne peut plus être annulée. En cas de problème (retard, colis abîmé, perdu ou non livré), signalez-le dans l\'application : un litige est ouvert et le paiement reste bloqué.',
          'Une livraison échouée ouvre automatiquement un litige.',
          'L\'équipe d\'Amana examine les éléments (chat, étapes de suivi, photos, valeur déclarée) et décide de rembourser le payeur, de payer le voyageur ou de partager le montant. Nous pouvons demander des informations aux deux parties.',
        ] },
      ],
    },
    {
      id: 'conduct', title: '8. Règles de conduite',
      blocks: [
        { list: [
          'Soyez honnête, respectueux et ponctuel. Utilisez le chat pour tout ce qui concerne la réservation.',
          'Les avis doivent refléter une expérience réelle. Pas d\'insultes, de discrimination, de données personnelles ni de publicité dans les avis, profils ou messages.',
          'N\'utilisez pas Amana pour frauder, faire de la contrebande, blanchir de l\'argent ou nuire à autrui.',
        ] },
        'Nous pouvons suspendre ou fermer un compte, annuler des réservations et conserver les données concernées en cas de violation de ces conditions, de soupçon de fraude ou de risque pour la sécurité des membres. Dans les cas graves, nous saisissons les autorités.',
      ],
    },
    {
      id: 'liability', title: '9. Responsabilité',
      blocks: [
        'L\'expéditeur et le voyageur sont chacun responsables de leurs propres obligations envers l\'autre. Amana est responsable du fonctionnement de la plateforme avec une diligence raisonnable et de la gestion du paiement telle que décrite dans ces conditions.',
        'Dans la mesure permise par la loi, Amana n\'est pas responsable du contenu des colis, des pertes ou dommages causés par les membres, des décisions douanières, ni des objets interdits ou non déclarés. Lorsque notre responsabilité est engagée, elle est limitée aux frais perçus pour la réservation concernée. Rien dans ces conditions ne limite la responsabilité en cas de faute intentionnelle, de faute grave, de dommage corporel ou de ce qui ne peut être limité par la loi.',
        'Amana ne propose pas d\'assurance pour les colis. Déclarez la valeur réelle pour que le voyageur décide en connaissance de cause.',
      ],
    },
    {
      id: 'privacy', title: '10. Données personnelles',
      blocks: ['Nous traitons vos données comme expliqué dans la Politique de confidentialité et la Politique de cookies.'],
    },
    {
      id: 'changes', title: '11. Modifications',
      blocks: ['Nous pouvons mettre à jour ces conditions. Si un changement vous concerne, nous vous en informerons dans l\'application avant son entrée en vigueur ; si vous n\'êtes pas d\'accord, vous pouvez fermer votre compte. La date de la dernière version figure en haut de cette page.'],
    },
    {
      id: 'law', title: '12. Droit applicable et litiges',
      blocks: [
        'Ces conditions sont régies par le droit du pays où {legalName} a son siège. Si vous êtes consommateur, vous conservez la protection des règles impératives du pays où vous résidez et pouvez saisir ses tribunaux.',
        'Avant toute action en justice, écrivez à {privacyEmail} : la plupart des problèmes se règlent rapidement. Les consommateurs de l\'UE peuvent aussi recourir au médiateur de la consommation de leur pays.',
      ],
    },
  ],
};

const es: LegalDoc = {
  intro: 'Estas condiciones de uso regulan el uso de Amana, la plataforma que pone en contacto a personas que quieren enviar un paquete («remitentes») con personas que viajan y tienen sitio en su equipaje o vehículo («viajeros»). Al crear una cuenta las aceptas. Léelas junto con nuestra Política de privacidad.',
  sections: [
    {
      id: 'who', title: '1. Quiénes somos y qué hacemos',
      blocks: [
        'Amana está gestionada por {legalName}, {address} («Amana», «nosotros»). Contacto: {privacyEmail}.',
        'Amana es un intermediario. No somos transportista, mensajería, transitario ni agente de aduanas: la entrega se acuerda y la realizan directamente el remitente y el viajero. Nuestro papel es ponerlos en contacto, verificar identidades, retener el pago hasta la entrega y ayudar a resolver disputas.',
        'Amana está actualmente en beta cerrada. Algunas funciones pueden cambiar o no estar disponibles y, durante la beta, los pagos pueden ser simulados (no se cobra dinero real). Te avisaremos antes de activar los pagos reales.',
      ],
    },
    {
      id: 'account', title: '2. Tu cuenta',
      blocks: [
        { list: [
          'Debes tener 18 años o más y capacidad para celebrar un contrato.',
          'Inicias sesión con tu propio número de teléfono y un código de un solo uso. Una cuenta por persona; no la compartas ni uses el número de otra persona.',
          'La información que das (nombre, viajes, paquetes, valores declarados) debe ser verdadera y estar actualizada.',
          'La verificación de identidad (documento + vídeo selfie) la revisa nuestro equipo. La insignia «verificado» significa que el documento correspondía a la persona en el momento de la revisión; no es una garantía de comportamiento.',
          'Puedes cerrar tu cuenta en cualquier momento desde tu perfil, cuando no haya ninguna reserva en curso.',
        ] },
      ],
    },
    {
      id: 'trips', title: '3. Viajes y reservas',
      blocks: [
        { list: [
          'Los viajeros publican viajes con una ruta, una fecha, el peso disponible y un precio por kilo. Cuando un viaje tiene reservas activas, ya no se pueden cambiar su precio, capacidad ni fecha.',
          'Los remitentes describen su paquete (contenido, peso, valor declarado, fotos, direcciones) y solicitan una reserva. El viajero es libre de aceptarla o rechazarla.',
          'Un remitente puede pedir a otra persona (el destinatario) que pague. Esa persona recibe un enlace de invitación y la reserva solo sigue adelante cuando ha pagado.',
          'Las solicitudes que no se responden o no se pagan a tiempo, y las reservas de viajes que ya han salido, se cancelan automáticamente y el dinero retenido se devuelve.',
        ] },
      ],
    },
    {
      id: 'items', title: '4. Qué se puede enviar',
      blocks: [
        'Está prohibido enviar: dinero en efectivo, billetes, monedas e instrumentos financieros; medicamentos con receta, estupefacientes y sustancias controladas; alcohol; armas, munición, explosivos, materiales inflamables o peligrosos; falsificaciones; animales; y todo aquello cuyo transporte, exportación o importación prohíban los países implicados. Los alimentos perecederos solo se admiten con el acuerdo expreso del viajero.',
        'El remitente garantiza que el contenido corresponde a la descripción, que el valor declarado es correcto y que el paquete cumple las leyes de los países de salida, tránsito y llegada, incluidas las normas de aduanas, aranceles e impuestos, que corren a su cargo.',
        'El viajero puede revisar el paquete al recogerlo y rechazarlo si parece prohibido, peligroso o no corresponde a la descripción. No lleves nunca un paquete cerrado con el que no te sientas cómodo.',
      ],
    },
    {
      id: 'payment', title: '5. Precio, pago y comisiones',
      blocks: [
        { list: [
          'El precio es el precio por kilo del viajero multiplicado por el peso, más la propina de prioridad que ofrezca el remitente, en la moneda del viaje.',
          'El pago debe hacerse antes de que el viajero recoja el paquete. Amana lo retiene y solo lo libera al viajero cuando se confirma la entrega.',
          'La comisión de servicio de Amana es el 10 % del precio. Se descuenta del importe que recibe el viajero; el remitente no paga ninguna comisión adicional.',
          'Los viajeros son responsables de declarar sus ingresos cuando la ley lo exija.',
          'Pagar u organizar una entrega fuera de Amana elimina la protección descrita en estas condiciones.',
        ] },
      ],
    },
    {
      id: 'delivery', title: '6. Recogida y entrega',
      blocks: [
        { list: [
          'El viajero registra cada paso en la aplicación: recogido, en tránsito, entregado.',
          'Para confirmar la entrega, el viajero introduce el código de entrega de 6 cifras que solo tiene el remitente y hace una foto del paquete entregado. El remitente solo debe dar el código cuando el destinatario tenga el paquete.',
          'El viajero debe guardar el paquete de forma segura, no abrirlo salvo que lo exijan las autoridades y entregarlo en el estado en que lo recibió.',
        ] },
      ],
    },
    {
      id: 'cancel', title: '7. Cancelaciones, reembolsos y disputas',
      blocks: [
        { list: [
          'Antes de la recogida, el remitente o el viajero pueden cancelar; el dinero ya retenido se devuelve íntegramente a quien pagó. Si el viajero cancela el viaje, se reembolsan todas sus reservas pagadas.',
          'Después de la recogida la reserva ya no se puede cancelar. Si hay un problema (retraso, paquete dañado, perdido o no entregado), indícalo en la aplicación: se abre una disputa y el pago queda bloqueado.',
          'Una entrega fallida abre automáticamente una disputa.',
          'El equipo de Amana revisa las pruebas (chat, pasos del seguimiento, fotos, valor declarado) y decide reembolsar a quien pagó, pagar al viajero o repartir el importe. Podemos pedir información a ambas partes.',
        ] },
      ],
    },
    {
      id: 'conduct', title: '8. Normas de conducta',
      blocks: [
        { list: [
          'Sé honesto, respetuoso y puntual. Usa el chat para todo lo relacionado con la reserva.',
          'Las valoraciones deben reflejar una experiencia real. Nada de insultos, discriminación, datos personales ni publicidad en valoraciones, perfiles o mensajes.',
          'No uses Amana para cometer fraudes, contrabando, blanqueo de dinero ni para perjudicar a otros.',
        ] },
        'Podemos suspender o cerrar una cuenta, cancelar reservas y conservar los datos relacionados si se incumplen estas condiciones o si sospechamos un fraude o un riesgo para la seguridad de los miembros. En los casos graves, lo comunicamos a las autoridades.',
      ],
    },
    {
      id: 'liability', title: '9. Responsabilidad',
      blocks: [
        'El remitente y el viajero responden cada uno de sus propias obligaciones frente al otro. Amana responde de gestionar la plataforma con una diligencia razonable y de tratar el pago como se describe en estas condiciones.',
        'En la medida en que la ley lo permita, Amana no es responsable del contenido de los paquetes, de las pérdidas o daños causados por los miembros, de las decisiones de aduanas ni de los objetos prohibidos o no declarados. Cuando seamos responsables, nuestra responsabilidad se limita a las comisiones cobradas por la reserva afectada. Nada en estas condiciones limita la responsabilidad por dolo, culpa grave, daños personales ni lo que la ley no permita limitar.',
        'Amana no ofrece seguro para los paquetes. Declara el valor real para que el viajero decida con pleno conocimiento.',
      ],
    },
    {
      id: 'privacy', title: '10. Datos personales',
      blocks: ['Tratamos tus datos como se explica en la Política de privacidad y en la Política de cookies.'],
    },
    {
      id: 'changes', title: '11. Cambios en estas condiciones',
      blocks: ['Podemos actualizar estas condiciones. Si un cambio te afecta, te avisaremos en la aplicación antes de que se aplique; si no estás de acuerdo, puedes cerrar tu cuenta. La fecha de la última versión aparece al principio de esta página.'],
    },
    {
      id: 'law', title: '12. Ley aplicable y disputas',
      blocks: [
        'Estas condiciones se rigen por la ley del país donde {legalName} tiene su domicilio social. Si eres consumidor, conservas la protección de las normas imperativas del país donde vives y puedes acudir a sus tribunales.',
        'Antes de ir a los tribunales, escríbenos a {privacyEmail}: la mayoría de los problemas se resuelven rápido. Los consumidores de la UE también pueden acudir a los organismos de mediación de consumo de su país.',
      ],
    },
  ],
};

const ar: LegalDoc = {
  intro: 'تنظّم شروط الاستخدام هذه استخدامك لمنصة أمانة، التي تربط بين أشخاص يريدون إرسال طرد («المرسِلون») وأشخاص مسافرين لديهم مكان في أمتعتهم أو سيارتهم («المسافرون»). بإنشائك حساباً فإنك توافق عليها. يُرجى قراءتها مع سياسة الخصوصية.',
  sections: [
    {
      id: 'who', title: '1. من نحن وما الذي نقوم به',
      blocks: [
        'تُدار أمانة من قِبل {legalName}، {address} («أمانة»، «نحن»). للتواصل: {privacyEmail}.',
        'أمانة وسيط فقط. لسنا شركة نقل ولا خدمة توصيل ولا وكيل شحن أو تخليص جمركي: يتم الاتفاق على التوصيل وتنفيذه مباشرةً بين المرسِل والمسافر. دورنا هو الربط بين الأعضاء، والتحقق من الهويات، والاحتفاظ بالدفعة حتى التسليم، والمساعدة في حل النزاعات.',
        'أمانة حالياً في مرحلة تجريبية مغلقة. قد تتغير بعض الميزات أو لا تكون متاحة، وقد تكون المدفوعات خلال هذه المرحلة محاكاة (لا تُخصم أموال حقيقية). سنُعلمك قبل تفعيل المدفوعات الحقيقية.',
      ],
    },
    {
      id: 'account', title: '2. حسابك',
      blocks: [
        { list: [
          'يجب أن يكون عمرك 18 عاماً على الأقل وأن تكون أهلاً لإبرام عقد ملزم.',
          'تسجّل الدخول برقم هاتفك الخاص ورمز يُستخدم مرة واحدة. حساب واحد لكل شخص؛ لا تشاركه ولا تستخدم رقم شخص آخر.',
          'يجب أن تكون المعلومات التي تقدّمها (الاسم، الرحلات، الطرود، القيم المصرّح بها) صحيحة ومحدّثة.',
          'يراجع فريقنا التحقق من الهوية (وثيقة الهوية + فيديو سيلفي). شارة «موثَّق» تعني أن الوثيقة كانت مطابقة للشخص وقت المراجعة، وليست ضماناً لسلوكه.',
          'يمكنك إغلاق حسابك في أي وقت من ملفك الشخصي، عندما لا يكون لديك أي حجز جارٍ.',
        ] },
      ],
    },
    {
      id: 'trips', title: '3. الرحلات والحجوزات',
      blocks: [
        { list: [
          'ينشر المسافرون رحلات تتضمن المسار والتاريخ والوزن المتاح والسعر لكل كيلوغرام. عندما تكون للرحلة حجوزات نشطة، لا يمكن تغيير سعرها أو سعتها أو تاريخها.',
          'يصف المرسِلون طرودهم (المحتوى، الوزن، القيمة المصرّح بها، الصور، العناوين) ويطلبون حجزاً. للمسافر حرية القبول أو الرفض.',
          'يمكن للمرسِل أن يطلب من شخص آخر (المستلِم) أن يدفع. يتلقى هذا الشخص رابط دعوة، ولا يمضي الحجز قُدماً إلا بعد الدفع.',
          'تُلغى تلقائياً الطلبات التي لا يُرد عليها أو لا تُدفع في الوقت المحدد، وحجوزات الرحلات التي انطلقت بالفعل، ويُعاد أي مبلغ محتجز.',
        ] },
      ],
    },
    {
      id: 'items', title: '4. ما الذي يمكن إرساله',
      blocks: [
        'يُمنع إرسال: النقود والأوراق النقدية والعملات المعدنية والأدوات المالية؛ الأدوية الموصوفة والمخدرات والمواد الخاضعة للرقابة؛ الكحول؛ الأسلحة والذخيرة والمتفجرات والمواد القابلة للاشتعال أو الخطرة؛ السلع المقلّدة؛ الحيوانات؛ وكل ما تمنع الدول المعنية نقله أو تصديره أو استيراده. لا تُقبل الأطعمة القابلة للتلف إلا بموافقة صريحة من المسافر.',
        'يضمن المرسِل أن المحتوى مطابق للوصف، وأن القيمة المصرّح بها صحيحة، وأن الطرد يحترم قوانين دول المغادرة والعبور والوصول، بما في ذلك قواعد الجمارك والرسوم والضرائب التي يتحمّلها المرسِل.',
        'يحق للمسافر فحص الطرد عند الاستلام ورفضه إذا بدا ممنوعاً أو خطيراً أو غير مطابق للوصف. لا تحمل أبداً طرداً مغلقاً لا تشعر بالارتياح تجاهه.',
      ],
    },
    {
      id: 'payment', title: '5. السعر والدفع والعمولات',
      blocks: [
        { list: [
          'السعر هو سعر المسافر لكل كيلوغرام مضروباً في الوزن، مضافاً إليه إكرامية الأولوية إن عرضها المرسِل، بعملة الرحلة.',
          'يجب الدفع قبل أن يستلم المسافر الطرد. تحتفظ أمانة بالمبلغ ولا تحوّله إلى المسافر إلا بعد تأكيد التسليم.',
          'عمولة خدمة أمانة هي 10% من السعر، وتُخصم من المبلغ المدفوع للمسافر؛ لا يدفع المرسِل أي عمولة إضافية.',
          'المسافرون مسؤولون عن التصريح بدخلهم عندما يفرض القانون ذلك.',
          'الدفع أو ترتيب التوصيل خارج أمانة يُفقدك الحماية الموضّحة في هذه الشروط.',
        ] },
      ],
    },
    {
      id: 'delivery', title: '6. الاستلام والتسليم',
      blocks: [
        { list: [
          'يسجّل المسافر كل خطوة في التطبيق: تم الاستلام، في الطريق، تم التسليم.',
          'لتأكيد التسليم، يُدخل المسافر رمز التسليم المكوّن من 6 أرقام الذي يملكه المرسِل وحده، ويلتقط صورة للطرد المسلَّم. يجب ألا يعطي المرسِل الرمز إلا بعد أن يصبح الطرد بين يدي المستلِم.',
          'على المسافر الحفاظ على الطرد بأمان، وعدم فتحه إلا بطلب من السلطات، وتسليمه بالحالة التي استلمه بها.',
        ] },
      ],
    },
    {
      id: 'cancel', title: '7. الإلغاء والاسترداد والنزاعات',
      blocks: [
        { list: [
          'قبل الاستلام، يمكن للمرسِل أو المسافر الإلغاء، ويُعاد المبلغ المحتجز كاملاً إلى من دفعه. إذا ألغى المسافر رحلته، تُسترد جميع الحجوزات المدفوعة.',
          'بعد الاستلام لا يمكن إلغاء الحجز. إذا حدثت مشكلة (تأخير، طرد تالف أو مفقود أو لم يُسلَّم)، أبلغ عنها في التطبيق: يُفتح نزاع ويبقى الدفع مجمّداً.',
          'التسليم الفاشل يفتح نزاعاً تلقائياً.',
          'يراجع فريق أمانة الأدلة (المحادثة، خطوات التتبع، الصور، القيمة المصرّح بها) ويقرر إعادة المبلغ إلى الدافع أو الدفع للمسافر أو تقسيم المبلغ. قد نطلب معلومات من الطرفين.',
        ] },
      ],
    },
    {
      id: 'conduct', title: '8. قواعد السلوك',
      blocks: [
        { list: [
          'كن صادقاً ومحترماً وملتزماً بالمواعيد. استخدم المحادثة لكل ما يتعلق بالحجز.',
          'يجب أن تعكس التقييمات تجربة حقيقية. ممنوع الشتم والتمييز ونشر البيانات الشخصية والإعلانات في التقييمات أو الملفات الشخصية أو الرسائل.',
          'لا تستخدم أمانة للاحتيال أو التهريب أو غسل الأموال أو إلحاق الضرر بالآخرين.',
        ] },
        'يجوز لنا تعليق حساب أو إغلاقه، وإلغاء الحجوزات، والاحتفاظ بالبيانات المتعلقة بها في حال مخالفة هذه الشروط أو الاشتباه في احتيال أو وجود خطر على سلامة الأعضاء. وفي الحالات الخطيرة نُبلغ السلطات.',
      ],
    },
    {
      id: 'liability', title: '9. المسؤولية',
      blocks: [
        'يتحمّل كل من المرسِل والمسافر مسؤولية التزاماته تجاه الآخر. وتتحمّل أمانة مسؤولية تشغيل المنصة بعناية معقولة وإدارة الدفع كما هو موضّح في هذه الشروط.',
        'في الحدود التي يسمح بها القانون، لا تتحمّل أمانة المسؤولية عن محتوى الطرود، أو الخسائر أو الأضرار التي يسببها الأعضاء، أو قرارات الجمارك، أو الأغراض الممنوعة أو غير المصرّح بها. وعندما نكون مسؤولين، تقتصر مسؤوليتنا على العمولات التي تقاضيناها عن الحجز المعني. لا شيء في هذه الشروط يحدّ من المسؤولية عن العمد أو الإهمال الجسيم أو الأضرار الجسدية أو ما لا يجوز قانوناً الحدّ منه.',
        'لا تقدّم أمانة تأميناً على الطرود. صرّح بالقيمة الحقيقية ليتخذ المسافر قراره عن علم.',
      ],
    },
    {
      id: 'privacy', title: '10. البيانات الشخصية',
      blocks: ['نعالج بياناتك كما هو موضّح في سياسة الخصوصية وسياسة ملفات تعريف الارتباط.'],
    },
    {
      id: 'changes', title: '11. تعديل هذه الشروط',
      blocks: ['قد نحدّث هذه الشروط. إذا كان التغيير يعنيك، سنُعلمك في التطبيق قبل تطبيقه؛ وإذا لم توافق، يمكنك إغلاق حسابك. يظهر تاريخ آخر نسخة في أعلى هذه الصفحة.'],
    },
    {
      id: 'law', title: '12. القانون الواجب التطبيق والنزاعات',
      blocks: [
        'تخضع هذه الشروط لقانون البلد الذي يقع فيه المقر الرئيسي لـ {legalName}. إذا كنت مستهلكاً، فإنك تحتفظ بحماية القواعد الإلزامية في بلد إقامتك ويمكنك اللجوء إلى محاكمه.',
        'قبل اللجوء إلى القضاء، راسلنا على {privacyEmail}: معظم المشاكل تُحل بسرعة. ويمكن للمستهلكين في الاتحاد الأوروبي أيضاً اللجوء إلى هيئات الوساطة الاستهلاكية في بلدانهم.',
      ],
    },
  ],
};

export const TERMS: Record<string, LegalDoc> = { en, fr, es, ar };
