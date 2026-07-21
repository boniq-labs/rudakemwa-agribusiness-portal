const translations: Record<string, Record<string, string>> = {
  en: {
    'app.name': 'Rudakemwa Agribusiness Portal',
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Users',
    'nav.hr': 'HR',
    'nav.animals': 'Animals',
    'nav.milk': 'Milk',
    'nav.finance': 'Finance',
    'nav.stock': 'Stock',
    'nav.logistics': 'Logistics',
    'nav.sales': 'Sales',
    'nav.settings': 'Settings',
    'nav.procurement': 'Procurement',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.export': 'Export',
    'common.print': 'Print',
    'common.loading': 'Loading...',
    'auth.login': 'Sign In',
    'auth.logout': 'Logout',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'dashboard.welcome': 'Welcome back',
    'dashboard.totalEmployees': 'Total Employees',
    'dashboard.totalAnimals': 'Total Animals',
    'dashboard.milkToday': 'Milk Today',
    'dashboard.monthlyIncome': 'Monthly Income',
    'dashboard.monthlyExpenses': 'Monthly Expenses',
    'dashboard.profit': 'Profit',
  },
  rw: {
    'app.name': 'Sistemu yo Gerenza Ikoranabuhanga ry\'Ubuhinzi',
    'nav.dashboard': 'Ikibaho',
    'nav.users': 'Abakoresha',
    'nav.hr': 'Abakozi',
    'nav.animals': 'Amatungo',
    'nav.milk': 'Amata',
    'nav.finance': 'Imari',
    'nav.stock': 'Ibitunze',
    'nav.logistics': 'Ibikorwa',
    'nav.sales': 'Ubucuruzi',
    'nav.settings': 'Igenamiterere',
    'common.save': 'Bika',
    'common.cancel': 'Hagarika',
    'common.delete': 'Siba',
    'common.edit': 'Hindura',
    'common.create': 'Shiraho',
    'common.search': 'Shakisha',
    'common.loading': 'Iratwika...',
    'auth.login': 'Injira',
    'auth.logout': 'Sohoka',
    'auth.username': 'Izina ry\'ukoresha',
    'auth.password': 'Ijambo ry\'ibanga',
    'dashboard.welcome': 'Murakaza neza',
  },
  fr: {
    'app.name': 'Système de Gestion d\'Entreprise Agricole',
    'nav.dashboard': 'Tableau de Bord',
    'nav.users': 'Utilisateurs',
    'nav.hr': 'Ressources Humaines',
    'nav.animals': 'Animaux',
    'nav.milk': 'Lait',
    'nav.finance': 'Finances',
    'nav.stock': 'Stock',
    'nav.logistics': 'Logistique',
    'nav.sales': 'Ventes',
    'nav.settings': 'Paramètres',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.username': 'Nom d\'utilisateur',
    'auth.password': 'Mot de passe',
    'dashboard.welcome': 'Bon retour',
  },
};

let currentLang = localStorage.getItem('lang') || 'en';

export function setLanguage(lang: string) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

export function getLanguage() {
  return currentLang;
}

export function t(key: string, fallback?: string): string {
  return translations[currentLang]?.[key] || translations['en']?.[key] || fallback || key;
}

export function useTranslation() {
  return { t, setLanguage, getLanguage, currentLang };
}
