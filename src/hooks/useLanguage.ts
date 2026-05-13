import { useState, useEffect } from 'react';

const translations: Record<string, Record<string, string>> = {
  id: {
    'nav.home': 'Beranda',
    'nav.destinations': 'Destinasi',
    'nav.trips': 'Open Trip',
    'nav.gallery': 'Galeri',
    'nav.leaders': 'Trip Leaders',
    'hero.viewDestinations': 'Lihat Destinasi',
    'hero.exploreTrips': 'Jelajahi Trip',
    'dest.privateTitle': 'Trip Privat.',
    'dest.privateDesc': 'Pesan trip dan gunung serta jadwal sesuai keinginan Anda.',
    'dest.diffFilter': 'Filter Tingkat Kesulitan',
    'dest.regionFilter': 'Filter Wilayah',
    'trip.openTitle': 'Trip Terbuka.',
    'trip.openDesc': 'Bergabung dengan trip terbuka bersama yang lain.',
    'trip.viewAll': 'Lihat Semua Jadwal',
    'trip.join': 'Daftar',
  },
  en: {
    'nav.home': 'Home',
    'nav.destinations': 'Destinations',
    'nav.trips': 'Open Trips',
    'nav.gallery': 'Gallery',
    'nav.leaders': 'Trip Leaders',
    'hero.viewDestinations': 'View Destinations',
    'hero.exploreTrips': 'Explore Trips',
    'dest.privateTitle': 'Private Trip.',
    'dest.privateDesc': 'Book your trip and mountain and schedule as you wish.',
    'dest.diffFilter': 'Filter by Difficulty',
    'dest.regionFilter': 'Filter by Region',
    'trip.openTitle': 'Open Trip.',
    'trip.openDesc': 'Join an open trip schedule with other adventurers.',
    'trip.viewAll': 'View All Schedules',
    'trip.join': 'Join',
  }
};

export const useLanguage = () => {
  const [lang, setLang] = useState(localStorage.getItem('appLanguage') || 'id');

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('appLanguage') || 'id');
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = (key: string) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  };

  return { lang, t };
};
