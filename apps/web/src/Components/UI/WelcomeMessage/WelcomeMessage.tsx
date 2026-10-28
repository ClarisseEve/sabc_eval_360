import React from 'react';

interface WelcomeMessageProps {
  userName: string;
  className?: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * En-tête d'accueil sobre: salutation selon l'heure et date du jour.
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  userName,
  className = '',
}) => {
  const now = new Date();
  const firstName = userName.split(' ')[0];
  const greeting = now.getHours() >= 18 || now.getHours() < 5 ? 'Bonsoir' : 'Bonjour';
  const formatted = DATE_FORMAT.format(now);
  const date = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <div className={className}>
      <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{date}</p>
      <h1 className="mt-1 text-2xl font-semibold text-sabc-gray-900 dark:text-sabc-gray-100">
        {greeting}, {firstName}
      </h1>
    </div>
  );
};

export default WelcomeMessage;
