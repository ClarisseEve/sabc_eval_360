import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Label } from '@/Components/UI/Label/Label';
import { RadioGroup, RadioGroupItem } from '@/Components/UI/RadioGroup/RadioGroup';
import { useTheme } from '@/Hooks/useThemeProvider';
import { Monitor, Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

export default function AppearanceTabs() {
  const { theme, setTheme } = useTheme();

  // Derive display mode: if no localStorage preference exists, it's "system"
  const savedPref = localStorage.getItem('theme');
  const [mode, setMode] = React.useState<ThemeMode>(
    savedPref ? (savedPref as ThemeMode) : 'system',
  );

  const handleModeChange = (value: string) => {
    const next = value as ThemeMode;
    setMode(next);

    if (next === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(next);
    }
  };

  const options = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système (automatique)', icon: Monitor },
  ] as const;

  return (
    <Tabs defaultValue="theme" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="theme">Thème</TabsTrigger>
      </TabsList>

      <TabsContent value="theme">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-sabc-gray-500">
              Choisissez le thème de l'interface. Le mode « Système » suit la préférence de votre appareil (mode nuit).
            </p>
            <RadioGroup
              value={mode}
              onValueChange={handleModeChange}
              className="space-y-3"
            >
              {options.map(({ value, label, icon: Icon }) => (
                <div
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                    mode === value
                      ? 'border-sabc-red-primary bg-sabc-red-primary/5'
                      : 'border-sabc-gray-200 hover:border-sabc-gray-300 dark:border-sabc-gray-700'
                  }`}
                  onClick={() => handleModeChange(value)}
                >
                  <RadioGroupItem value={value} id={value} />
                  <Icon size={18} className="text-sabc-gray-500" />
                  <Label htmlFor={value} className="cursor-pointer text-sm font-medium">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <p className="mt-4 text-xs text-sabc-gray-400">
              Thème actif : <span className="font-medium text-sabc-gray-700">{theme === 'dark' ? 'Sombre' : 'Clair'}</span>
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
