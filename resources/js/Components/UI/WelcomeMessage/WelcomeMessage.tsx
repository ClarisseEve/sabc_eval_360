import React, { useState, useEffect } from 'react';

interface WelcomeMessageProps {
  userName: string;
  className?: string;
}

/**
 * Composant de message de bienvenue dynamique
 * Affiche un message personnalisé en fonction de l'heure de la journée
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  userName,
  className = '',
}) => {
  const [message, setMessage] = useState('');

  // Générer un message de bienvenue personnalisé en fonction de l'heure
  useEffect(() => {
    const hour = new Date().getHours();
    const firstName = userName.split(' ')[0];
    
    const getRandomMessage = (messages: string[]) => messages[Math.floor(Math.random() * messages.length)];
    
    let welcomeMessage = '';
    
    if (hour >= 3 && hour < 6) {
      welcomeMessage = getRandomMessage([
        `🌙 ${firstName}, réflexion nocturne ou urgence ? 🤔`,
        `⭐ ${firstName}, les meilleures stratégies naissent parfois la nuit ! 💡`,
        `🌃 ${firstName}, dévoué corps et âme ! Pensez quand même à dormir 😊`,
        `🦉 ${firstName}, brainstorming de nuit ou simple curiosité ?`,
        `☕ ${firstName}, demain sera rude sans caféine ! ☕`
      ]);
    } else if (hour >= 6 && hour < 9) {
      welcomeMessage = getRandomMessage([
        `🌅 ${firstName}, efficacité matinale ! Le calme avant la tempête ? 😉`,
        `☕ ${firstName}, ritual du matin en cours ? Premier café ☕`,
        `🌞 ${firstName}, vous prenez de l'avance ! Stratégique 👌`,
        `📊 ${firstName}, check matinal des performances ?`
      ]);
    } else if (hour >= 9 && hour < 12) {
      welcomeMessage = getRandomMessage([
        `💼 ${firstName}, en pleine concentration ! Comment va le business ? 📈`,
        `🚀 ${firstName}, matinée productive en perspective !`,
        `⚡ ${firstName}, on démarre fort aujourd'hui !`,
        `📊 ${firstName}, analyse du marché ou suivi d'équipe ?`
      ]);
    } else if (hour >= 12 && hour < 14) {
      welcomeMessage = getRandomMessage([
        `🍽️ ${firstName}, pause bien méritée ! Restaurant ou bureau ? 😋`,
        `🥗 ${firstName}, déjeuner d'affaires ou moment tranquille ?`,
        `😊 ${firstName}, j'espère que vous prenez le temps de souffler !`,
        `🍷 ${firstName}, un petit break s'impose ! Profitez-en bien`
      ]);
    } else if (hour >= 14 && hour < 17) {
      welcomeMessage = getRandomMessage([
        `🎯 ${firstName}, focus de l'après-midi ! Projet en cours ? 💡`,
        `📈 ${firstName}, comment se dessinent vos objectifs ?`,
        `⚡ ${firstName}, seconde partie de journée ! Tout roule ?`,
        `💼 ${firstName}, réunion ou analyse ? Dans les deux cas, bon courage !`
      ]);
    } else if (hour >= 17 && hour < 20) {
      welcomeMessage = getRandomMessage([
        `🌆 ${firstName}, fin de journée ! Bilan positif j'espère ? 😊`,
        `📱 ${firstName}, dernières vérifications ou vraie déconnexion ?`,
        `🏃‍♂️ ${firstName}, on termine en beauté cette journée !`,
        `😌 ${firstName}, il est temps de penser à autre chose ! 🍷`
      ]);
    } else if (hour >= 20 && hour < 23) {
      welcomeMessage = getRandomMessage([
        `🌙 ${firstName}, soirée studieuse ou petite analyse rapide ? 📚`,
        `🏠 ${firstName}, tranquillement installé ! Parfait pour réfléchir 🛋️`,
        `📖 ${firstName}, formation continue ou simple curiosité ?`,
        `😊 ${firstName}, j'espère que cette journée vous a apporté satisfaction !`
      ]);
    } else {
      welcomeMessage = getRandomMessage([
        `🦉 ${firstName}, esprit toujours en ébullition ! 🌃`,
        `⭐ ${firstName}, réflexion tardive ou insomnie créative ? 💭`,
        `🍵 ${firstName}, une tisane et au lit ! Demain est un autre jour 😉`,
        `🌙 ${firstName}, même les esprits brillants ont besoin de repos !`
      ]);
    }
    
    setMessage(welcomeMessage);
  }, [userName]);

  return (
    <h1 className={`text-2xl font-bold text-sabc-gray-900 dark:text-sabc-gray-200 transition-colors ${className}`}>
      {message}
    </h1>
  );
};

export default WelcomeMessage;
