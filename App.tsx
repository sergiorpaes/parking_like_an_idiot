import React, { useState, useRef, useEffect } from 'react';
import { AppView, Report, UserStats } from './types';
import { detectSensitiveAreas, analyzeViolation, getMapsInfo, Venue } from './services/geminiService';
import { blurImageRegions } from './utils/imageProcessing';
import { sound } from './services/audioService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

// Components
import { Navbar } from './components/Layout/Navbar';
import { ScanButton } from './components/Layout/ScanButton';
import { Feed } from './views/Feed';
import { Leaderboard } from './views/Leaderboard';
import { Profile } from './views/Profile';
import { ParkingLogo } from './components/ParkingLogo';

const MAX_STORED_REPORTS = 10;
const DAILY_POINT_CAP = 200;

const calculateLevel = (points: number) => {
  if (points < 100) return { level: 1, name: 'Observer' };
  if (points < 500) return { level: 2, name: 'Spotter' };
  if (points < 2000) return { level: 3, name: 'Inspector' };
  return { level: 4, name: 'Enforcer' };
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
];

const STRINGS: Record<string, any> = {
  en: {
    appTitle: "PARKING LIKE AN IDIOT", login: "Log In", email: "Email", password: "Password", startHunt: "Start Hunt", codename: "ENTER CODENAME", feed: "Feed", leader: "Ranks", gifts: "Gifts", profile: "Profile", level: "Level", signOut: "Sign Out", expose: "Expose Idiot", idiotLogged: "DRAFTING POST", shielding: "HARDENING ENCRYPTION...", topVigilantes: "TOP VIGILANTES", prizeVault: "PRIZE VAULT", levelUp: "LEVEL UP!", writeSomething: "Write something nasty...", continue: "Publish Post", cancel: "Cancel", selectLanguage: "Language", continueWith: "Continue with", googleLoginPrompt: "Sign in with Google", googleChooseAccount: "Choose an account to continue", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "WARNING: TARGET NOT A VEHICLE", tryAgain: "Return to Camera", changePic: "Change Avatar", confirmPic: "Set as Profile Picture?", confirm: "Yes, Apply", discard: "Discard", scanning: "Scanning for idiots...", reports: "Reports", totalXP: "Total XP", importDevice: "Import from device?", cancelToCamera: "(Cancel to use camera)", systemNoVehicle: "System failed to identify a motor vehicle in this image.", xpToNext: "XP to next level", rank: "Rank", rewardsTitle: "VIGILANTE REWARDS", unlockAt: "Unlocks at level", claim: "Claim Reward", locked: "Locked", rankGod: "Parking God", rankVeteran: "Vigilante Veteran", rankAvenger: "Asphalt Avenger", rankCrusader: "Curb Crusader", rankProwler: "Pavement Prowler", rewardBadge: "Exclusive Badge", rewardTheme: "Golden Theme", rewardAI: "Advanced AI Scan", rewardLeader: "Supreme Leader", you: "YOU", back: "Back to Login", postAnon: "Post Anonymously", anonWarningTitle: "ANONYMOUS WARNING", anonWarningDesc: "Anonymous posts are untraceable and do not award XP. Continue?", understand: "I UNDERSTAND", checkIn: "Check-in Location", searchPlaces: "Search for a place...", nearbyPlaces: "NEARBY VENUES", searchResults: "SEARCH RESULTS", tagging: "Tagging location...", tagPlace: "Tag this place", removeLocation: "Remove Location", connecting: "CONNECTING TO SECURE SERVER...", howItWorks: "How this App works", tutorialTitle: "MISSION PROTOCOL", step1Title: "1. OBSERVE", step1Desc: "Find a parking disaster in the wild.", step2Title: "2. NEUTRALIZAR", step2Desc: "AI automatically blurs plates & faces for total anonymity.", step3Title: "3. CLASSIFY", step3Desc: "Our AI scores the idiocy and awards XP.", step4Title: "4. EXPOSE", step4Desc: "Publish to the global feed & climb the vigilante ranks.", accessConsole: "TACTICAL ACCESS", settings: "Settings", theme: "Theme", useAnotherAccount: "Use another account"
  },
  es: {
    appTitle: "ESTACIONANDO COMO UN IDIOTA", login: "Entrar", email: "Correo", password: "Clave", startHunt: "Iniciar Caza", codename: "INGRESA TU CODANOMBRE", feed: "Muro", leader: "Ránking", gifts: "Premios", profile: "Perfil", level: "Nivel", signOut: "Salir", expose: "Exponer Idiota", idiotLogged: "REDACTANDO POST", shielding: "REFURZANDO ENCRIPTACIÓN...", topVigilantes: "TOP VIGILANTES", prizeVault: "CÓFRA DE PREMIOS", levelUp: "¡SUBISTE DE NIVEL!", writeSomething: "Escribe algo desagradable...", continue: "Publicar Post", cancel: "Cancelar", selectLanguage: "Idioma", continueWith: "Continuar con", googleLoginPrompt: "Iniciar sesión con Google", googleChooseAccount: "Elige una cuenta para continuar", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "AVISO: EL OBJETIVO NO ES UN VEHÍCULO", tryAgain: "Volver a la Cámara", changePic: "Cambiar Avatar", confirmPic: "¿Establecer como foto de perfil?", confirm: "Sí, Aplicar", discard: "Descartar", scanning: "Buscando idiotas...", reports: "Denuncias", totalXP: "XP Total", importDevice: "¿Importar del dispositivo?", cancelToCamera: "(Cancelar para usar la cámara)", systemNoVehicle: "El sistema no pudo identificar un vehículo en esta imagen.", xpToNext: "XP para el siguiente nivel", rank: "Rango", rewardsTitle: "RECOMPENSAS VIGILANTE", unlockAt: "Se desbloquea en nivel", claim: "Reclamar Recompensa", locked: "Bloqueado", rankGod: "Dios del Estacionamiento", rankVeteran: "Veterano Vigilante", rankAvenger: "Vengador del Asfalto", rankCrusader: "Cruzado del Bordillo", rankProwler: "Vigilante de Aceras", rewardBadge: "Insignia Exclusiva", rewardTheme: "Tema Dorado", rewardAI: "IA Avanzada", rewardLeader: "Líder Supremo", you: "TÚ", back: "Volver al Inicio", postAnon: "Publicar de forma anónima", anonWarningTitle: "AVISO ANÓNIMO", anonWarningDesc: "Las publicaciones anónimas no son rastreables y no otorgan XP. ¿Continuar?", understand: "ENTIENDO", checkIn: "Registrar Ubicación", searchPlaces: "Buscar lugar...", nearbyPlaces: "LUGARES CERCANOS", searchResults: "RESULTADOS", tagging: "Marcando ubicación...", tagPlace: "Marcar este lugar", removeLocation: "Eliminar Ubicación", connecting: "CONECTANDO AL SERVIDOR SEGURO...", howItWorks: "Cómo funciona el App", tutorialTitle: "PROTOCOLO DE MISIÓN", step1Title: "1. OBSERVAR", step1Desc: "Encuentra un desastre de estacionamiento.", step2Title: "2. NEUTRALIZAR", step2Desc: "La IA difumina matrículas y caras automáticamente.", step3Title: "3. CLASIFICAR", step3Desc: "Nuestra IA puntúa la idiotez y otorga XP.", step4Title: "4. EXPONER", step4Desc: "Publica en el muro global y sube en el ránking.", accessConsole: "ACCESO TÁCTICO", settings: "Ajustes", theme: "Tema", useAnotherAccount: "Usar otra cuenta"
  },
  fr: {
    appTitle: "GARÉ COMME UN IDIOT", login: "Connexion", email: "E-mail", password: "Mot de passe", startHunt: "Démarrer la Chasse", codename: "ENTRER NOM DE CODE", feed: "Fil d'actualité", leader: "Rangs", gifts: "Cadeaux", profile: "Profil", level: "Niveau", signOut: "Déconnexion", expose: "Exposer l'Idiot", idiotLogged: "RÉDACTION DU POST", shielding: "RENFORCEMENT DU CHIFFREMENT...", topVigilantes: "TOP VIGILANTES", prizeVault: "COFFRE AUX PRIX", levelUp: "NIVEAU SUPÉRIEUR !", writeSomething: "Écrivez quelque chose de méchant...", continue: "Publier le Post", cancel: "Annuler", selectLanguage: "Langue", continueWith: "Continuer avec", googleLoginPrompt: "Se connecter avec Google", googleChooseAccount: "Choisissez un compte pour continuer", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "AVERTISSEMENT : LA CIBLE N'EST PAS UN VÉHICULE", tryAgain: "Retour à l'Appareil Photo", changePic: "Changer d'Avatar", confirmPic: "Définir comme photo de profil ?", confirm: "Oui, Appliquer", discard: "Jeter", scanning: "Recherche d'idiots...", reports: "Signalements", totalXP: "XP Totale", importDevice: "Importer depuis l'appareil ?", cancelToCamera: "(Annuler pour utiliser l'appareil photo)", systemNoVehicle: "Le système n'a pas pu identifier de véhicule motorisé sur cette image.", xpToNext: "XP vers le niveau suivant", rank: "Rang", rewardsTitle: "RÉCOMPENSES VIGILANTE", unlockAt: "Déblocage au niveau", claim: "Réclamer la Récompense", locked: "Verrouillé", rankGod: "Dieu du Stationnement", rankVeteran: "Vétéran Vigilante", rankAvenger: "Vengeur de l'Asphalte", rankCrusader: "Croisé du Trottoir", rankProwler: "Rôdeur de Chaussée", rewardBadge: "Badge Exclusif", rewardTheme: "Thème Doré", rewardAI: "IA Avancée", rewardLeader: "Chef Suprême", you: "VOUS", back: "Retour à la Connexion", postAnon: "Poster anonymement", anonWarningTitle: "AVERTISSEMENT ANONYME", anonWarningDesc: "Les posts anonymes sont intraçables et ne rapportent pas d'XP. Continuer ?", understand: "JE COMPRENDS", checkIn: "Enregistrer le Lieu", searchPlaces: "Rechercher un lieu...", nearbyPlaces: "LIEUX À PROXIMITÉ", searchResults: "RÉSULTATS", tagging: "Marquage du lieu...", tagPlace: "Marquer ce lieu", removeLocation: "Supprimer le Lieu", connecting: "CONNEXION AU SERVEUR SÉCURISÉ...", howItWorks: "Comment fonctionne l'App", tutorialTitle: "PROTOCOLE DE MISSION", step1Title: "1. OBSERVER", step1Desc: "Trouvez une catastrophe de stationnement dans la nature.", step2Title: "2. NEUTRALISER", step2Desc: "L'IA floute automatiquement les plaques et les visages.", step3Title: "3. CLASSIFIER", step3Desc: "Notre IA évalue l'idiotie et attribue des XP.", step4Title: "4. EXPOSER", step4Desc: "Publiez sur le fil mondial et montez dans les rangs.", accessConsole: "ACCÈS TACTIQUE", settings: "Paramètres", theme: "Thème", useAnotherAccount: "Utiliser un autre compte"
  },
  de: {
    appTitle: "PARKEN WIE EIN IDIOT", login: "Anmelden", email: "E-Mail", password: "Passwort", startHunt: "Jagd Starten", codename: "CODENAME EINGEBEN", feed: "Feed", leader: "Ränge", gifts: "Geschenke", profile: "Profil", level: "Level", signOut: "Abmelden", expose: "Idioten Bloßstellen", idiotLogged: "POST WIRD ENTWORFEN", shielding: "VERSCHLÜSSELUNG WIRD VERSTÄRKT...", topVigilanten: "TOP VIGILANTEN", prizeVault: "PREIS-TRESOR", levelUp: "LEVEL UP!", writeSomething: "Schreib etwas Fieses...", continue: "Post Veröffentlichen", cancel: "Abbrechen", selectLanguage: "Sprache", continueWith: "Weiter mit", googleLoginPrompt: "Mit Google anmelden", googleChooseAccount: "Wählen Sie ein Konto aus", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "WARNUNG: ZIEL KEIN FAHRZEUG", tryAgain: "Zurück zur Kamera", changePic: "Avatar Ändern", confirmPic: "Als Profilbild festlegen?", confirm: "Ja, Anwenden", discard: "Verwerfen", scanning: "Suche nach Idioten...", reports: "Meldungen", totalXP: "Gesamt-XP", importDevice: "Vom Gerät importieren?", cancelToCamera: "(Abbrechen für Kamera)", systemNoVehicle: "System konnte kein Kraftfahrzeug auf diesem Bild identifizieren.", xpToNext: "XP bis zum nächsten Level", rank: "Rang", rewardsTitle: "VIGILANTEN-BELOHNUNGEN", unlockAt: "Wird freigeschaltet ab Level", claim: "Belohnung Beanspruchen", locked: "Gesperrt", rankGod: "Parkgott", rankVeteran: "Vigilanten-Veteran", rankAvenger: "Asphalt-Rächer", rankCrusader: "Bordstein-Kreuzritter", rankProwler: "Gehweg-Lauerer", rewardBadge: "Exklusives Abzeichen", rewardTheme: "Goldenes Design", rewardAI: "Fortgeschrittene KI", rewardLeader: "Oberster Anführer", you: "DU", back: "Zurück zum Login", postAnon: "Anonym Posten", anonWarningTitle: "ANONYME WARNUNG", anonWarningDesc: "Anonyme Posts sind nicht rückverfolgbar und geben keine XP. Fortfahren?", understand: "ICH VERSTEHE", checkIn: "Ort Registrieren", searchPlaces: "Ort suchen...", nearbyPlaces: "ORTE IN DER NÄHE", searchResults: "SUCHERGEBNISSE", tagging: "Ort wird markiert...", tagPlace: "Diesen Ort markieren", removeLocation: "Ort Entfernen", connecting: "VERBINDUNG ZUM SICHEREN SERVER...", howItWorks: "Wie diese App funktioniert", tutorialTitle: "MISSIONSPROTOKOLL", step1Title: "1. BEOBACHTEN", step1Desc: "Finde eine Parkkatastrophe in freier Wildbahn.", step2Title: "2. NEUTRALISIEREN", step2Desc: "KI macht Kennzeichen & Gesichter automatisch unkenntlich.", step3Title: "3. KLASSIFIZIEREN", step3Desc: "Unsere KI bewertet die Idiotie und vergibt XP.", step4Title: "4. BLOẞSTELLEN", step4Desc: "Veröffentliche im globalen Feed & steige in den Rängen.", accessConsole: "TAKTIK-KONSOLE", settings: "Einstellungen", theme: "Design", useAnotherAccount: "Anderes Konto verwenden"
  },
  ru: {
    appTitle: "ПАРКУЮСЬ КАК ИДИОТ", login: "Войти", email: "Email", password: "Пароль", startHunt: "Начать Охоту", codename: "ВВЕДИТЕ ПОЗЫВНОЙ", feed: "Лента", leader: "Рейтинг", gifts: "Подарки", profile: "Профиль", level: "Уровень", signOut: "Выйти", expose: "Разоблачить Идиота", idiotLogged: "СОЗДАНИЕ ПОСТА", shielding: "УСИЛЕНИЕ ШИФРОВАНИЯ...", topVigilantes: "ЛУЧШИЕ ВИГИЛАНТЫ", prizeVault: "ХРАНИЛИЩЕ ПРИЗОВ", levelUp: "НОВЫЙ УРОВЕНЬ!", writeSomething: "Напишите что-нибудь едкое...", continue: "Опубликовать", cancel: "Отмена", selectLanguage: "Язык", continueWith: "Продолжить через", googleLoginPrompt: "Войти через Google", googleChooseAccount: "Выберите аккаунт", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "ПРЕДУПРЕЖДЕНИЕ: ЦЕЛЬ НЕ ТРАНСПОРТ", tryAgain: "Вернуться к камере", changePic: "Сменить Аватар", confirmPic: "Установить как фото профиля?", confirm: "Да, Применить", discard: "Сбросить", scanning: "Поиск идиотов...", reports: "Отчеты", totalXP: "Всего XP", importDevice: "Загрузить с устройства?", cancelToCamera: "(Отмена для камеры)", systemNoVehicle: "Система не смогла идентифицировать транспортное средство на этом изображении.", xpToNext: "XP до следующего уровня", rank: "Ранг", rewardsTitle: "НАГРАДЫ ВИГИЛАНТА", unlockAt: "Открывается на уровне", claim: "Забрать Награду", locked: "Закрыто", rankGod: "Бог Парковки", rankVeteran: "Ветеран Вигилант", rankAvenger: "Мститель Асфальта", rankCrusader: "Крестоносец Бордюров", rankProwler: "Тротуарный Охотник", rewardBadge: "Эксклюзивный Значок", rewardTheme: "Золотая Тема", rewardAI: "Продвинутый ИИ", rewardLeader: "Верховный Лидер", you: "ВЫ", back: "Назад к Входу", postAnon: "Опубликовать Анонимно", anonWarningTitle: "АНОНИМНОЕ ПРЕДУПРЕЖДЕНИЕ", anonWarningDesc: "Анонимные посты нельзя отследить, и они не дают XP. Продолжить?", understand: "Я ПОНИМАЮ", checkIn: "Отметить Место", searchPlaces: "Поиск места...", nearbyPlaces: "МЕСТА РЯДОМ", searchResults: "РЕЗУЛЬТАТЫ ПОИСКА", tagging: "Отметка локации...", tagPlace: "Отметить это место", removeLocation: "Удалить Локацию", connecting: "ПОДКЛЮЧЕНИЕ К ЗАЩИЩЕННОМУ СЕРВЕРУ...", howItWorks: "Как работает приложение", tutorialTitle: "ПРОТОКОЛ МИССИИ", step1Title: "1. НАБЛЮДЕНИЕ", step1Desc: "Найдите парковочную катастрофу на улице.", step2Title: "2. НЕЙТРАЛИЗАЦИЯ", step2Desc: "ИИ автоматически замазывает номера и лица.", step3Title: "3. КЛАССИФИКАЦИЯ", step3Desc: "Наш ИИ оценивает идиотизм и начисляет XP.", step4Title: "4. РАЗОБЛАЧЕНИЕ", step4Desc: "Опубликуйте в ленте и поднимитесь в рейтинге.", accessConsole: "ТАКТИЧЕСКАЯ КОНСОЛЬ", settings: "Настройки", theme: "Тема", useAnotherAccount: "Использовать другой аккаунт"
  },
  nl: {
    appTitle: "PARKEREN ALS EEN IDIOOT", login: "Inloggen", email: "E-mail", password: "Wachtwoord", startHunt: "Start de Jacht", codename: "VOER CODENAAM IN", feed: "Feed", leader: "Rangen", gifts: "Cadeaus", profile: "Profiel", level: "Niveau", signOut: "Uitloggen", expose: "Idioot Ontmaskeren", idiotLogged: "POST WORDT GEMAAKT", shielding: "VERSLEUTELING VERSTERKEN...", topVigilantes: "TOP VIGILANTES", prizeVault: "PRIJZENKLUIS", levelUp: "LEVEL OMHOOG!", writeSomething: "Schrijf iets gemeens...", continue: "Post Publiceren", cancel: "Annuleren", selectLanguage: "Taal", continueWith: "Doorgaan met", googleLoginPrompt: "Inloggen met Google", googleChooseAccount: "Kies een account om door te gaan", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "WAARSCHUWING: DOEL GEEN VOERTUIG", tryAgain: "Terug naar Camera", changePic: "Avatar Wijzigen", confirmPic: "Instellen als profielfoto?", confirm: "Ja, Toepassen", discard: "Weggooien", scanning: "Zoeken naar idioten...", reports: "Meldingen", totalXP: "Totaal XP", importDevice: "Importeren van apparaat?", cancelToCamera: "(Annuleren voor camera)", systemNoVehicle: "Systeem kon geen motorvoertuig identificeren in deze afbeelding.", xpToNext: "XP tot volgend niveau", rank: "Rang", rewardsTitle: "VIGILANTE BELONINGEN", unlockAt: "Ontgrendelt op niveau", claim: "Beloning Claimen", locked: "Vergrendeld", rankGod: "Parkeergod", rankVeteran: "Vigilante Veteraan", rankAvenger: "Asfalt Wreker", rankCrusader: "Stoeprand Kruisvaarder", rankProwler: "Stoepstruiner", rewardBadge: "Exclusieve Badge", rewardTheme: "Gouden Thema", rewardAI: "Geavanceerde AI", rewardLeader: "Opperleider", you: "JIJ", back: "Terug naar Login", postAnon: "Anoniem Posten", anonWarningTitle: "ANONIEME WAARSCHUWING", anonWarningDesc: "Anonieme posts zijn ontraceerbaar en geven geen XP. Doorgaan?", understand: "IK BEGRIJP HET", checkIn: "Locatie Inchecken", searchPlaces: "Zoek een plek...", nearbyPlaces: "PLEKKEN IN DE BUURT", searchResults: "ZOEKRESULTATEN", tagging: "Locatie taggen...", tagPlace: "Deze plek taggen", removeLocation: "Locatie Verwijderen", connecting: "VERBINDEN MET BEVEILIGDE SERVER...", howItWorks: "Hoe deze App werkt", tutorialTitle: "MISSIEPROTOCOL", step1Title: "1. OBSERVEREN", step1Desc: "Vind een parkeerramp in het wild.", step2Title: "2. NEUTRALISEREN", step2Desc: "AI vervaagt automatisch kentekens & gezichten.", step3Title: "3. CLASSIFICEREN", step3Desc: "Onze AI scoort de idiootheid en geeft XP.", step4Title: "4. ONTMASKEREN", step4Desc: "Publiceer in de wereldwijde feed & stijg in de rangen.", accessConsole: "TACTISCHE CONSOLE", settings: "Instellingen", theme: "Thema", useAnotherAccount: "Een ander account gebruiken"
  },
  uk: {
    appTitle: "ПАРКУЮСЬ ЯК ІДІОТ", login: "Увійти", email: "Email", password: "Пароль", startHunt: "Почати Полювання", codename: "ВВЕДІТЬ ПОЗИВНИЙ", feed: "Стрічка", leader: "Рейтинг", gifts: "Подарунки", profile: "Профіль", level: "Рівень", signOut: "Вийти", expose: "Викрити Ідіота", idiotLogged: "СТВОРЕННЯ ПОСТУ", shielding: "ПОСИЛЕННЯ ШИФРУВАННЯ...", topVigilantes: "ЛУЧШІ ВІГІЛАНТИ", prizeVault: "СХОВИЩЕ ПРИЗІВ", levelUp: "НОВИЙ РІВЕНЬ!", writeSomething: "Напишіть щось гостре...", continue: "Опублікувати", cancel: "Скасувати", selectLanguage: "Мова", continueWith: "Продовжити через", googleLoginPrompt: "Увійти через Google", googleChooseAccount: "Виберіть акаунт", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "ПОПЕРЕДЖЕННЯ: ЦІЛЬ НЕ ТРАНСПОРТ", tryAgain: "Повернутися до камери", changePic: "Змінити Аватар", confirmPic: "Встановити як фото профілю?", confirm: "Так, Застосувати", discard: "Скинути", scanning: "Пошук ідіотів...", reports: "Звіти", totalXP: "Всього XP", importDevice: "Завантажити з пристрою?", cancelToCamera: "(Скасувати для камери)", systemNoVehicle: "Система не змогла ідентифікувати транспортний засіб на цьому зображенні.", xpToNext: "XP до наступного рівня", rank: "Ранг", rewardsTitle: "НАГОРОДИ ВІГІЛАНТА", unlockAt: "Відкривається на рівні", claim: "Забрати Нагороду", locked: "Закрито", rankGod: "Бог Паркування", rankVeteran: "Ветеран Вігілант", rankAvenger: "Месник Асфальту", rankCrusader: "Хрестоносець Бордюрів", rankProwler: "Тротуарний Мисливець", rewardBadge: "Ексклюзивний Значок", rewardTheme: "Золота Тема", rewardAI: "Просунутий ІІ", rewardLeader: "Верховний Лідер", you: "ВИ", back: "Назад до Входу", postAnon: "Опублікувати Анонімно", anonWarningTitle: "АНОНІМНЕ ПОПЕРЕДЖЕННЯ", anonWarningDesc: "Анонімні пости неможливо відстежити, і вони не дають XP. Продовжити?", understand: "Я РОЗУМІЮ", checkIn: "Відмітити Місце", searchPlaces: "Пошук місця...", nearbyPlaces: "МІСЦЯ ПОРУЧ", searchResults: "РЕЗУЛЬТАТИ ПОИСКУ", tagging: "Відмітка локації...", tagPlace: "Відмітити це місце", removeLocation: "Видалити Локацію", connecting: "ПІДКЛЮЧЕННЯ ДО ЗАХИЩЕНОГО СЕРВЕРА...", howItWorks: "Як працює додаток", tutorialTitle: "ПРОТОКОЛ МІСІЇ", step1Title: "1. СПОСТЕРЕЖЕННЯ", step1Desc: "Знайдіть паркувальну катастрофу на вулиці.", step2Title: "2. НЕЙТРАЛІЗАЦІЯ", step2Desc: "ІІ автоматично замазує номери та обличчя.", step3Title: "3. КЛАСИФІКАЦІЯ", step3Desc: "Наш ІІ оцінює ідіотизм та нараховує XP.", step4Title: "4. ВИКРИТТЯ", step4Desc: "Опублікуйте в стрічці та підніміться в рейтингу.", accessConsole: "ТАКТИЧНА КОНСОЛЬ", settings: "Налаштування", theme: "Тема", useAnotherAccount: "Використати інший акаунт"
  },
  no: {
    appTitle: "PARKERER SOM EN IDIOT", login: "Logg inn", email: "E-post", password: "Passord", startHunt: "Start Jakten", codename: "OPPGÅ CODENAVN", feed: "Strøm", leader: "Ranger", gifts: "Gaver", profile: "Profil", level: "Nivå", signOut: "Logg ut", expose: "Avslør Idiot", idiotLogged: "KLARGJØR INNLEGG", shielding: "FORSTERKER KRYPTERING...", topVigilanter: "TOPP VIGILANTER", prizeVault: "PREMIEHVELV", levelUp: "NIVÅ OPP!", writeSomething: "Skriv noe fælt...", continue: "Publiser Innlegg", cancel: "Avbryt", selectLanguage: "Språk", continueWith: "Fortsett med", googleLoginPrompt: "Logg inn med Google", googleChooseAccount: "Velg en konto for å fortsette", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "ADVARSEL: MÅL ER IKKE ET KJØRETØY", tryAgain: "Tilbake til Kamera", changePic: "Bytt Avatar", confirmPic: "Sett som profilbilde?", confirm: "Ja, Bruk", discard: "Forkast", scanning: "Leter etter idioter...", reports: "Rapporter", totalXP: "Total XP", importDevice: "Importer fra enhet?", cancelToCamera: "(Avbryt for å bruke kamera)", systemNoVehicle: "Systemet klarte ikke å identifisere et motorkjøretøy i dette bildet.", xpToNext: "XP til neste nivå", rank: "Rang", rewardsTitle: "VIGILANTE BELØNNINGER", unlockAt: "Låses opp på nivå", claim: "Hent Belønning", locked: "Låst", rankGod: "Parkeringsgud", rankVeteran: "Vigilante-veteran", rankAvenger: "Asfalt-hevner", rankCrusader: "Fortauskant-ridder", rankProwler: "Gate-jeger", rewardBadge: "Exklusivt merke", rewardTheme: "Gull-tema", rewardAI: "Avansert AI", rewardLeader: "Øverste leder", you: "DEG", back: "Tilbake til Logg inn", postAnon: "Post Anonymt", anonWarningTitle: "ANONYM ADVARSEL", anonWarningDesc: "Anonyme innlegg kan ikke spores og gir ikke XP. Fortsett?", understand: "JEG FORSTÅR", checkIn: "Sjekk inn her", searchPlaces: "Søk etter sted...", nearbyPlaces: "STEDER IN NÆRHETEN", searchResults: "SØKERESULTATER", tagging: "Tagger posisjon...", tagPlace: "Tagg dette stedet", removeLocation: "Fjern Posisjon", connecting: "KOBLER TIL SIKKER SERVER...", howItWorks: "Hvordan denne appen fungerer", tutorialTitle: "MISSION PROTOCOL", step1Title: "1. OBSERVER", step1Desc: "Finn en parkeringskatastrofe ute i det fri.", step2Title: "2. NØYTRALISER", step2Desc: "AI slører automatisk skilter og ansikter.", step3Title: "3. KLASSIFISER", step3Desc: "Vår AI vurderer idiotien og tildeler XP.", step4Title: "4. AVSLØR", step4Desc: "Publiser til den globale strømmen og klatre på listene.", accessConsole: "TAKTIKK-KONSOLL", settings: "Innstillinger", theme: "Tema", useAnotherAccount: "Bruk en annen konto"
  },
  pt: {
    appTitle: "ESTACIONANDO IGUAL UM IDIOTA", login: "Entrar", email: "E-mail", password: "Senha", startHunt: "Iniciar Caçada", codename: "INSIRA SEU CODINOME", feed: "Mural", leader: "Ranking", gifts: "Prêmios", profile: "Perfil", level: "Nível", signOut: "Sair", expose: "Expor Idiota", idiotLogged: "RASCUNHANDO POST", shielding: "REFORÇANDO CRIPTOGRAFIA...", topVigilantes: "MELHORES VIGILANTES", prizeVault: "COFRE DE PRÊMIOS", levelUp: "SUBIU DE NÍVEL!", writeSomething: "Escreva algo maldoso...", continue: "Publicar Post", cancel: "Cancelar", selectLanguage: "Idioma", continueWith: "Continuar com", googleLoginPrompt: "Entrar com Google", googleChooseAccount: "Escolha uma conta para continuar", googleSupportEmail: "vigilante.protocol@gmail.com", noVehicle: "AVISO: ALVO NÃO é UM VEÍCULO", tryAgain: "Voltar para Câmera", changePic: "Alterar Avatar", confirmPic: "Definir como foto de perfil?", confirm: "Sim, Aplicar", discard: "Descartar", scanning: "Procurando por idiotas...", reports: "Denúncias", totalXP: "XP Total", importDevice: "Importar do dispositivo?", cancelToCamera: "(Cancelar para usar a câmera)", systemNoVehicle: "O sistema não identificou um veículo nesta imagem.", xpToNext: "XP para o próximo nível", rank: "Nível", rewardsTitle: "RECOMPENSAS VIGILANTE", unlockAt: "Desbloqueia no nível", claim: "Resgatar Recompensa", locked: "Bloqueado", rankGod: "Deus do Estacionamento", rankVeteran: "Veterano Vigilante", rankAvenger: "Vingador do Asfalto", rankCrusader: "Cruzado do Meio-Fio", rankProwler: "Vigilante de Calçada", rewardBadge: "Emblema Exclusivo", rewardTheme: "Tema Dourado", rewardAI: "IA Avançada", rewardLeader: "Líder Supremo", you: "VOCÊ", back: "Voltar ao Login", postAnon: "Postar Anonimamente", anonWarningTitle: "AVISO ANÔNIMO", anonWarningDesc: "Postagens anônimas não são rastreáveis e não concedem XP. Continuar?", understand: "EU ENTENDO", checkIn: "Fazer Check-in", searchPlaces: "Procurar lugar...", nearbyPlaces: "LOCAIS PRÓXIMOS", searchResults: "RESULTADOS", tagging: "Marcando local...", tagPlace: "Marcar este lugar", removeLocation: "Remover Local", connecting: "CONECTANDO AO SERVIDOR SEGURO...", howItWorks: "Como este App funciona", tutorialTitle: "PROTOCOLO DE MISSÃO", step1Title: "1. OBSERVAR", step1Desc: "Encontre um desastre de estacionamento por aí.", step2Title: "2. NEUTRALIZAR", step2Desc: "A IA borra placas e rostos automaticamente.", step3Title: "3. CLASSIFICAR", step3Desc: "Nossa IA pontua a idiotice e concede XP.", step4Title: "4. EXPOR", step4Desc: "Publique no mural global e suba no ranking.", accessConsole: "ACESSO TÁTICO", settings: "Configurações", theme: "Tema", useAnotherAccount: "Usar outra conta"
  }
};

// ParkingLogo removed - imported from components

const AppContent: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const [view, setView] = useState<AppView>('login');
  const [reports, setReports] = useState<Report[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [lastProcessedReport, setLastProcessedReport] = useState<Report | null>(null);
  const [tempUsername, setTempUsername] = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("en");

  // Anonymous states
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAnonWarning, setShowAnonWarning] = useState(false);

  // Location states
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editableHeadline, setEditableHeadline] = useState("");
  const [userComment, setUserComment] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const [pendingProfilePic, setPendingProfilePic] = useState<string | null>(null);
  const [isCapturingForProfile, setIsCapturingForProfile] = useState(false);

  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  const t = (key: string) => STRINGS[lang]?.[key] || STRINGS.en[key] || key;

  // Sync language with user stats
  useEffect(() => {
    if (userStats?.language && userStats.language !== lang) {
      setLang(userStats.language);
    }
  }, [userStats?.language]);

  const updateLang = (newLang: string) => {
    setLang(newLang);
    if (userStats) {
      setUserStats({ ...userStats, language: newLang });
    }
  };

  const handleGoogleAccountSelect = () => {
    setShowGooglePrompt(false);
    loginWithGoogle();
  };

  // Real Google Login Hook
  const loginWithGoogle = useGoogleLogin({
    onSuccess: (codeResponse) => {
      console.log('Google Login Success:', codeResponse);
      sound.playSuccess();
      // In a real app, we would swap this code/token for user info.
      // For now, we simulate extraction.
      setEmail('vigilante.protocol@gmail.com');
      setView('onboarding');
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      sound.playError();
      alert('Google Login Failed. Please check console.');
    },
  });

  // Global sound unlock on first interaction
  useEffect(() => {
    const unlockSound = () => {
      sound.startAmbient();
      window.removeEventListener('mousedown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
    window.addEventListener('mousedown', unlockSound);
    window.addEventListener('touchstart', unlockSound);
    return () => {
      window.removeEventListener('mousedown', unlockSound);
      window.removeEventListener('touchstart', unlockSound);
    };
  }, []);

  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('userStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        setUserStats(stats);
        if (stats.language) setLang(stats.language);
        setView('home');
      }
      const savedReports = localStorage.getItem('reports');
      if (savedReports) setReports(JSON.parse(savedReports));
    } catch (e) { }
  }, []);

  useEffect(() => {
    if (userStats) localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (view === 'camera' || isCapturingForProfile) {
      const startCamera = async () => {
        try {
          // Check if mediaDevices API is available (requires secure context)
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not available. This app requires HTTPS or localhost access.');
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1080 } },
            audio: false
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Camera access failed", err);

          // Provide specific error message for insecure context
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Camera access requires HTTPS or localhost.\n\nPlease access the app via:\n• https://192.168.18.4:3000 (with HTTPS)\n• http://localhost:3000\n\nCurrent URL uses HTTP over network IP, which browsers block for security.");
          } else {
            alert("Unable to access camera. Check permissions.");
          }

          if (isCapturingForProfile) setIsCapturingForProfile(false);
          else setView('home');
        }
      };
      startCamera();
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setZoomLevel(1);
    }
  }, [view, isCapturingForProfile]);

  // Place search logic
  const handleOpenLocationModal = async () => {
    sound.playClick();
    setIsLocationModalOpen(true);
    setIsSearchingLocation(true);

    // Default search based on current geolocation
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const venues = await getMapsInfo(pos.coords.latitude, pos.coords.longitude);
        setNearbyVenues(venues);
        setIsSearchingLocation(false);
      },
      () => setIsSearchingLocation(false)
    );
  };

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;

    setIsSearchingLocation(true);
    sound.playClick();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const results = await getMapsInfo(pos.coords.latitude, pos.coords.longitude, locationSearch);
        setNearbyVenues(results);
        setIsSearchingLocation(false);
      },
      async () => {
        // Fallback for no geolocation
        const results = await getMapsInfo(0, 0, locationSearch);
        setNearbyVenues(results);
        setIsSearchingLocation(false);
      }
    );
  };

  const handleLogin = () => {
    if (email.trim() && password.trim()) {
      sound.playSuccess();
      setView('onboarding');
    } else {
      sound.playError();
      alert("Encryption key required.");
    }
  };

  const handleSocialLogin = (provider: string) => {
    sound.playClick();
    if (provider === 'google') {
      loginWithGoogle();
    } else {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        sound.playSuccess();
        setView('onboarding');
      }, 1500);
    }
  };



  const toggleView = (newView: AppView) => {
    sound.playClick();
    setView(newView);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    sound.playShutter();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const videoW = video.videoWidth;
    const videoH = video.videoHeight;
    const size = Math.min(videoW, videoH);
    canvas.width = size;
    canvas.height = size;

    const sourceSize = size / zoomLevel;
    const sourceX = (videoW - sourceSize) / 2;
    const sourceY = (videoH - sourceSize) / 2;

    context.drawImage(video, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (isCapturingForProfile) {
      setPendingProfilePic(dataUrl);
      setIsCapturingForProfile(false);
      setView('profile');
    } else {
      processViolation(dataUrl);
    }
  };

  const processViolation = async (imageData: string) => {
    setIsProcessing(true);
    setView('home');
    try {
      const boxes = await detectSensitiveAreas(imageData);
      const blurredImage = await blurImageRegions(imageData, boxes, 100);
      const analysis = await analyzeViolation(blurredImage, lang);
      setLastProcessedReport({
        id: Date.now().toString(),
        timestamp: Date.now(),
        author: userStats?.username || "Vigilante",
        location: null,
        imageUrl: blurredImage,
        headline: analysis.headline,
        points: analysis.points,
        reasoning: analysis.reasoning,
        likes: 0,
        comments: [],
        ratings: [],
        averageRating: 0,
        idiocyScore: analysis.idiocyScore,
        isVehicle: analysis.isVehicle,
        rejectionReason: analysis.rejectionReason,
        confidence: analysis.confidence
      });
      setEditableHeadline(analysis.headline);
      setUserComment("");
      setIsAnonymous(false);
      setSelectedVenue(null);
      setView('result');
    } catch (err) {
      sound.playError();
      alert("Analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeReport = () => {
    if (!lastProcessedReport || !userStats) return;
    sound.playSuccess();

    const finalPoints = isAnonymous ? 0 : lastProcessedReport.points;
    const finalAuthor = isAnonymous ? "ANON_VIGILANTE" : (userStats.username || "Vigilante");

    const final: Report = {
      ...lastProcessedReport,
      headline: editableHeadline,
      userMessage: userComment,
      points: finalPoints,
      author: finalAuthor,
      venueName: selectedVenue?.name,
      address: selectedVenue?.address,
      mapsUrl: selectedVenue?.url
    };

    if (!isAnonymous) {
      const today = new Date().toISOString().split('T')[0];
      let currentDaily = userStats.dailyPoints || 0;

      // Reset daily points if new day
      if (userStats.lastActiveDate !== today) {
        currentDaily = 0;
      }

      // Cap points
      const pointsToAdd = Math.min(finalPoints, DAILY_POINT_CAP - currentDaily);
      const newDaily = currentDaily + pointsToAdd;

      const newTotal = userStats.totalPoints + pointsToAdd;
      const { level: newLvl } = calculateLevel(newTotal);

      if (newLvl > userStats.level) setShowLevelUp(true);

      setUserStats({
        ...userStats,
        totalPoints: newTotal,
        level: newLvl,
        reportsCount: userStats.reportsCount + 1,
        dailyPoints: newDaily,
        lastActiveDate: today
      });
    }

    setReports(prev => [final, ...prev].slice(0, MAX_STORED_REPORTS));
    setView('home');
    setLastProcessedReport(null);
    setIsAnonymous(false);
    setSelectedVenue(null);
  };

  const handleCloseResult = () => {
    sound.playClick();
    if (lastProcessedReport && !lastProcessedReport.isVehicle) {
      setView('camera');
    } else {
      setView('home');
    }
    setLastProcessedReport(null);
    setIsAnonymous(false);
    setSelectedVenue(null);
  };

  const confirmProfilePic = () => {
    if (pendingProfilePic && userStats) {
      setUserStats({ ...userStats, profilePicture: pendingProfilePic });
      sound.playSuccess();
    }
    setPendingProfilePic(null);
  };

  return (
    <div className={`fixed inset-0 ${currentTheme.colors.bg} ${currentTheme.colors.text} font-sans selection:${currentTheme.colors.accent}/30 overflow-hidden`}>
      <main className="h-full w-full">
        {view === 'login' && (
          <div className={`fixed inset-0 ${currentTheme.colors.bg} flex flex-col items-center justify-center p-8 text-center overflow-y-auto no-scrollbar z-10 transition-colors duration-500`}>
            <ParkingLogo size="lg" themeColor={currentTheme.colors.primary.replace('text-', '')} />
            <h1 className={`text-4xl font-black italic font-bungee mt-6 mb-12 leading-none tracking-tighter ${currentTheme.colors.text} drop-shadow-xl`}>{t('appTitle')}</h1>

            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={() => { sound.playClick(); setShowTutorial(true); }}
                className={`w-full flex items-center justify-center gap-2 ${currentTheme.colors.accent} text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all`}
              >
                <span className="text-sm">❓</span> {t('howItWorks')}
              </button>

              <div className="pt-6 relative">
                <div className={`${currentTheme.name === 'Metro' ? 'bg-white/80 border-slate-200 shadow-xl' : 'bg-zinc-900/30 border-zinc-800/60'} border p-6 rounded-[2.5rem] space-y-4 backdrop-blur-sm transition-all duration-500`}>

                  <div className="flex flex-col items-center gap-4 mb-6">
                    {/* Theme Switcher */}
                    <div className={`flex p-1 rounded-full border backdrop-blur-md transition-colors ${currentTheme.name === 'Metro' ? 'bg-slate-100 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                      {['vigilante', 'professional', 'midnight'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t as any)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentTheme.name.toLowerCase() === t || (t === 'vigilante' && currentTheme.name === 'Vigilante') || (t === 'professional' && currentTheme.name === 'Metro') || (t === 'midnight' && currentTheme.name === 'Midnight') ? 'bg-white text-black shadow-sm' : 'opacity-50 hover:opacity-100'}`}
                        >
                          {t === 'vigilante' ? '⚠️' : t === 'professional' ? '👔' : '🌙'}
                        </button>
                      ))}
                    </div>

                    <div className="relative inline-block">
                      <select value={lang} onChange={e => updateLang(e.target.value)} className={`appearance-none outline-none transition-all cursor-pointer pr-8 ${currentTheme.name === 'Metro' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'} text-[10px] font-black uppercase tracking-widest border px-4 py-1.5 rounded-full`}>
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">▼</div>
                    </div>
                  </div>

                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')} className={`w-full ${currentTheme.colors.surface} border ${currentTheme.colors.border} rounded-2xl px-6 py-4 ${currentTheme.colors.text} font-bold transition-all outline-none text-sm`} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password')} className={`w-full ${currentTheme.colors.surface} border ${currentTheme.colors.border} rounded-2xl px-6 py-4 ${currentTheme.colors.text} font-bold transition-all outline-none text-sm`} />
                  <button onClick={handleLogin} className={`w-full ${currentTheme.colors.primary.replace('text-', 'bg-')} text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all`}>{t('login')}</button>

                  <div className="pt-4 space-y-3">
                    <button onClick={() => handleSocialLogin('google')} className={`w-full border py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all ${currentTheme.name === 'Metro' ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'}`}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07 5.02l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                      {t('continueWith')} Google
                    </button>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => handleSocialLogin('apple')} className={`py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 border active:scale-95 transition-all ${currentTheme.name === 'Metro' ? 'bg-black text-white border-transparent hover:bg-slate-800' : 'bg-black text-white border-white/10 hover:border-white/30'}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.96.95-2.04 1.87-3.41 1.87-1.33 0-1.74-.83-3.34-.83-1.58 0-2.07.81-3.32.83-1.36.02-2.58-1.06-3.56-2.05-2.02-2.01-3.07-5.74-3.07-8.91 0-3.17 1.05-6.9 3.07-8.91 1.07-1.07 2.45-1.73 3.93-1.73 1.34 0 2.22.45 3.12.45.87 0 1.95-.45 3.32-.45 1.48 0 2.86.66 3.93 1.73.53.53.94 1.14 1.22 1.8-.84.44-1.4 1.32-1.4 2.32 0 1.43.91 2.65 2.17 3.1-.28.66-.69 1.27-1.22 1.8-.44.44-.92.83-1.46 1.18zm-3.4-15.63c0-1.43-.88-2.73-2.12-3.32.22 1.43 1.12 2.65 2.32 3.1-.1.1-.15.22-.2.32z" /></svg>
                        Apple
                      </button>
                      <button onClick={() => handleSocialLogin('instagram')} className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-pink-500/10 hover:shadow-pink-500/30">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
                        Insta
                      </button>
                      <button onClick={() => handleSocialLogin('tiktok')} className="bg-black py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 text-white border border-zinc-800 active:scale-95 transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:border-cyan-400/50">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" /></svg>
                        TikTok
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'onboarding' && (
          <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-2xl font-black italic font-bungee mb-8 uppercase tracking-tighter">{t('codename')}</h2>
            <input value={tempUsername} onChange={e => setTempUsername(e.target.value.toUpperCase())} className={`w-full max-w-sm ${currentTheme.colors.surface} p-6 rounded-[2rem] text-center font-black text-2xl outline-none border-2 ${currentTheme.colors.border} uppercase tracking-widest`} placeholder="AGENT_X" />
            <button onClick={() => {
              setUserStats({
                username: tempUsername || 'AGENT_ZERO',
                specialty: 'Vigilante',
                totalPoints: 0,
                level: 1,
                rank: 0,
                reportsCount: 0,
                language: lang,
                email: '',
                dailyPoints: 0,
                lastActiveDate: new Date().toISOString().split('T')[0],
                missions: { validReportsToday: 0, zonesThisWeek: [] }
              });
              setView('home');
            }} className={`w-full max-w-sm ${currentTheme.colors.accent} text-black py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest mt-6 shadow-2xl active:scale-95 transition-all`}>{t('startHunt')}</button>
          </div>
        )}

        {view === 'home' && (
          <Feed
            reports={reports}
            isMuted={isMuted}
            toggleMute={() => {
              sound.toggleMute();
              setIsMuted(!isMuted);
            }}
            t={t}
          />
        )}

        {view === 'leaderboard' && <Leaderboard userStats={userStats} t={t} />}

        {view === 'profile' && (
          <Profile
            userStats={userStats}
            t={t}
            setUserStats={setUserStats}
            setView={setView}
            setIsCapturingForProfile={setIsCapturingForProfile}
            setPendingProfilePic={setPendingProfilePic}
            pendingProfilePic={pendingProfilePic}
          />
        )}

        {/* Keeping specialized views (Camera, Result) inline for now but styled */}
        {view === 'camera' && (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
            <div className="relative flex-1 bg-zinc-950 flex flex-col items-center justify-center pt-20">
              {/* Camera Feed */}
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover z-0" style={{ transform: `scale(${zoomLevel})` }} />

              {/* Close Button */}
              <button onClick={() => toggleView('home')} className="absolute top-6 left-6 p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 active:scale-90 transition-all z-20">✕</button>

              {/* Scanning Overlay */}
              <div className="relative w-[92vw] h-[75vh] max-w-[500px] border-2 border-white/30 rounded-3xl overflow-hidden z-10 shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)]">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-yellow-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-yellow-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-yellow-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-yellow-500 rounded-br-2xl"></div>

                {/* Scanner Line Animation */}
                <div className="scanner-line"></div>

                {/* Hint Text */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white/80 text-[10px] uppercase font-black tracking-widest bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">Align Vehicle</p>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-12 z-20">
                <div className="w-12 h-12" /> {/* Spacer */}
                <button onClick={capturePhoto} className={`w-20 h-20 bg-transparent rounded-full border-4 border-white/80 flex items-center justify-center active:scale-90 transition-all group`}>
                  <div className={`w-16 h-16 bg-white rounded-full group-active:scale-90 transition-all`}></div>
                </button>
                <button onClick={() => setIsFlashOn(!isFlashOn)} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-black/40 backdrop-blur-md border border-white/10 ${isFlashOn ? 'text-yellow-400' : 'text-white/50'}`}>⚡</button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {view === 'result' && (
          <div className={`fixed inset-0 ${currentTheme.colors.bg} z-[50] flex flex-col overflow-y-auto pb-20 no-scrollbar`}>
            <div className="relative aspect-square w-full">
              <img src={lastProcessedReport?.imageUrl} className="w-full h-full object-cover" />
              <button onClick={handleCloseResult} className="absolute top-6 left-6 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">✕</button>
            </div>
            <div className="p-8 space-y-6 flex-1">
              {lastProcessedReport?.isVehicle ? (
                <>
                  <textarea value={editableHeadline} onChange={e => setEditableHeadline(e.target.value)} rows={2} className={`w-full bg-transparent border-b-2 ${currentTheme.colors.border} py-4 text-3xl font-black italic uppercase outline-none focus:border-current transition-colors leading-tight`} />
                  <textarea placeholder={t('writeSomething')} value={userComment} onChange={e => setUserComment(e.target.value)} className={`w-full ${currentTheme.colors.surface} border-2 ${currentTheme.colors.border} rounded-[2rem] p-6 text-sm font-bold min-h-[140px] outline-none transition-all`} />
                  <button onClick={finalizeReport} className={`w-full ${currentTheme.colors.accent} text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all`}>{t('continue')}</button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 py-10">
                  <div className="text-center space-y-2">
                    <p className="font-black text-red-500 text-xl tracking-wider">REJECTED</p>
                    <p className="opacity-70 text-sm font-medium italic max-w-xs mx-auto">
                      {lastProcessedReport?.rejectionReason === 'LOW_QUALITY' && "Image is too blurry, dark, or unclear."}
                      {lastProcessedReport?.rejectionReason === 'POOR_QUALITY' && "Image quality validation failed."}
                      {lastProcessedReport?.rejectionReason === 'UNCERTAIN_VIOLATION' && "Violation not clearly visible. Ensure road markings and context are shown."}
                      {lastProcessedReport?.rejectionReason === 'NO_VIOLATION' && "No clear parking violation detected."}
                      {!['LOW_QUALITY', 'POOR_QUALITY', 'UNCERTAIN_VIOLATION', 'NO_VIOLATION'].includes(lastProcessedReport?.rejectionReason || '') && t('systemNoVehicle')}
                    </p>
                  </div>
                  <button onClick={handleCloseResult} className={`w-full ${currentTheme.colors.surface} ${currentTheme.colors.text} py-6 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all border ${currentTheme.colors.border}`}>{t('tryAgain')}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {view !== 'login' && view !== 'onboarding' && view !== 'camera' && view !== 'result' && (
          <>
            {view === 'home' && <ScanButton onClick={() => setView('camera')} />}
            <Navbar currentView={view} setView={setView} t={t} />
          </>
        )}
      </main>

      {showTutorial && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          <h2 className="text-3xl font-black italic font-bungee text-white mb-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{t('tutorialTitle')}</h2>
          <div className="space-y-8 w-full max-w-sm">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex gap-4 items-start text-left group">
                <div className={`w-12 h-12 rounded-xl ${currentTheme.colors.accent} text-black font-black flex items-center justify-center text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>{step}</div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider text-sm mb-1">{t(`step${step}Title`)}</h3>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">{t(`step${step}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
          {showGooglePrompt && (
            <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] overflow-hidden transform transition-all scale-100">
                {/* Google Header */}
                <div className="p-8 pb-4 text-center">
                  <svg className="w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07 5.02l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  <h3 className="text-2xl font-medium text-gray-800 font-sans tracking-tight mb-2">{t('googleLoginPrompt')}</h3>
                  <p className="text-gray-600 text-sm">{t('googleChooseAccount')}</p>
                </div>

                {/* Account List */}
                <div className="px-4 pb-6 space-y-2">
                  <button onClick={handleGoogleAccountSelect} className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-all group text-left">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">V</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm truncate">Vigilante Official</p>
                      <p className="text-gray-500 text-xs truncate">vigilante.protocol@gmail.com</p>
                    </div>
                  </button>

                  <button onClick={handleGoogleAccountSelect} className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-all group text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium text-sm truncate">{t('useAnotherAccount')}</p>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setShowGooglePrompt(false)} className="px-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { sound.playClick(); setShowTutorial(false); }} className={`mt-12 ${currentTheme.colors.surface} text-white px-10 py-4 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all shadow-2xl`}>
            {t('understand')}
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId="361429592576-pmkebd8sg9ej3qg9mldrv0cf63j61vso.apps.googleusercontent.com">
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App;