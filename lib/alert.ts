import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Alert.alert de React Native n'a pas d'implémentation sur react-native-web
 * dans ce projet : sur le web, il ne fait rigoureusement rien (aucune
 * popup, aucun callback appelé). On retombe donc sur window.alert/confirm
 * pour que les mêmes interactions restent visibles pendant les tests dans
 * le navigateur, tout en gardant le vrai Alert natif sur iOS/Android.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as any);
    return;
  }

  const fullMessage = [title, message].filter(Boolean).join('\n\n');
  const actionable = (buttons ?? []).filter((b) => b.style !== 'cancel');
  const cancelBtn = (buttons ?? []).find((b) => b.style === 'cancel');

  if (cancelBtn && actionable.length > 0) {
    const confirmed = window.confirm(fullMessage);
    if (confirmed) {
      actionable[0]?.onPress?.();
    } else {
      cancelBtn.onPress?.();
    }
    return;
  }

  window.alert(fullMessage);
  actionable[0]?.onPress?.();
}
