import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Card, CardContent } from '@/Components/UI/Card/Card';
import { Label } from '@/Components/UI/Label/Label';
import { RadioGroup, RadioGroupItem } from '@/Components/UI/radio-group/RadioGroup';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Composant d'onglets pour les paramètres d'apparence
 * Respecte les règles graphiques SABC
 */
export default function AppearanceTabs() {
  const [theme, setTheme] = useState('light');
  const [colorScheme, setColorScheme] = useState('red');

  const handleSave = () => {
    // Logique de sauvegarde à implémenter
    console.log('Saving appearance settings:', { theme, colorScheme });
  };

  return (
    <Tabs defaultValue="theme" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="theme">Thème</TabsTrigger>
        <TabsTrigger value="colors">Couleurs</TabsTrigger>
        <TabsTrigger value="fonts">Polices</TabsTrigger>
      </TabsList>
      
      <TabsContent value="theme">
        <Card>
          <CardContent className="pt-6">
            <RadioGroup 
              value={theme} 
              onValueChange={setTheme}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Clair (par défaut)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Sombre</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">Système</Label>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Button 
                onClick={handleSave}
                style={{ 
                  backgroundColor: 'var(--sabc-red-primary)',
                  color: 'white'
                }}
              >
                Enregistrer les préférences
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="colors">
        <Card>
          <CardContent className="pt-6">
            <RadioGroup 
              value={colorScheme} 
              onValueChange={setColorScheme}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="red" id="red" />
                <Label htmlFor="red">Rouge SABC (par défaut)</Label>
                <div className="w-4 h-4 rounded-full bg-[#E53E3E]"></div>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="orange" id="orange" />
                <Label htmlFor="orange">Orange SABC</Label>
                <div className="w-4 h-4 rounded-full bg-[#FF9800]"></div>
              </div>
            </RadioGroup>

            <div className="mt-6">
              <Button 
                onClick={handleSave}
                style={{ 
                  backgroundColor: 'var(--sabc-red-primary)',
                  color: 'white'
                }}
              >
                Enregistrer les préférences
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="fonts">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              L'application utilise les polices Poppins pour les titres et Inter pour le contenu, 
              conformément aux règles graphiques SABC.
            </p>
            <div className="mt-6">
              <Button 
                onClick={handleSave}
                style={{ 
                  backgroundColor: 'var(--sabc-red-primary)',
                  color: 'white'
                }}
              >
                Enregistrer les préférences
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
