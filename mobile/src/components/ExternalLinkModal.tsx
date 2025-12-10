import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';

type Props = {
  visible: boolean;
  url: string;
  onClose: () => void;
};

export default function ExternalLinkModal({ visible, url, onClose }: Props) {
  const handleConfirm = () => {
    Linking.openURL(url);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.backdrop} onTouchEnd={onClose} />
        <View style={styles.modalView}>
          <View style={styles.iconContainer}>
            <Ionicons name="open-outline" size={32} color="#A78BFA" />
          </View>
          <Text style={styles.title}>Você está saindo do app</Text>
          <Text style={styles.message}>
            O link selecionado levará você para um site externo. Deseja continuar?
          </Text>
          <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
          
          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <View style={styles.confirmButtonWrapper}>
               <PrimaryButton title="Continuar" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#0e1430',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
    borderWidth: 1,
    borderColor: '#1d2340',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6e9ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#8b92b8',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  urlText: {
    fontSize: 12,
    color: '#4f5b7a',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#e6e9ff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonWrapper: {
    flex: 1,
  },
});
