import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useTranslation } from "react-i18next";

interface VoiceAssistantProps {
  language: 'en' | 'hi' | 'kn';
}

export const VoiceAssistant = ({ language }: VoiceAssistantProps) => {
  const { isListening, startListening, stopListening, lastTranscript, lastMatchedRoute, lastMatchedKeyword, voicesList, hasKnVoice, dumpVoicesToConsole } = useVoiceAssistant(language);
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        size="lg"
        onClick={isListening ? stopListening : startListening}
        className={`rounded-full w-16 h-16 shadow-glow ${
          isListening 
            ? 'bg-destructive hover:bg-destructive/90 pulse-ring' 
            : 'bg-gradient-primary hover:opacity-90'
        }`}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      {isListening && (
        <div className="absolute -top-24 right-0 bg-card px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <p className="text-sm font-medium">{t('listening')}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">{lastTranscript || t('clickToSpeak')}</p>
          <p className="text-xxs text-muted-foreground mt-1">{lastMatchedRoute ? `Matched: ${lastMatchedRoute} (${lastMatchedKeyword})` : ''}</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xxs">KN voice:</p>
            <p className={`text-xxs font-medium ${hasKnVoice ? 'text-success' : 'text-destructive'}`}>{hasKnVoice ? 'available' : 'missing'}</p>
          </div>
        </div>
      )}
    </div>
  );
};
