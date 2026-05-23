import React, { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  getUserPayments,
  getPixKey,
} from '../services/bookingService';

export default function PaymentsScreen({
  theme,
  user,
}) {

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pixKey, setPixKey] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [loadingPix, setLoadingPix] = useState(false);

  useEffect(() => {
    loadPayments();
    loadPixKey();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);

      const data = await getUserPayments(user.id);

      setPayments(data || []);
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar pagamentos.'
      );
    } finally {
      setLoading(false);
    }
  };
  const loadPixKey = async () => {
  try {
    const key = await getPixKey();
    setPixKey(key || '');
  } catch (error) {
    setPixKey('');
  }
};

  const openPixModal = async (payment) => {
  try {
    setSelectedPayment(payment);
    setPixQrCode('');
    setPixQrCodeBase64('');
    setPixModalVisible(true);
    setLoadingPix(true);

    const response = await fetch(
      'https://eybfirqzklvwtkpdztpx.supabase.co/functions/v1/create-pix-payment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YmZpcnF6a2x2d3RrcGR6dHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTA5NDIsImV4cCI6MjA5MzA2Njk0Mn0.MXZRmo4lvpiyS-njDRRXlwiaSnEuO6LJX8eMVSdkjXE`,
        },
        body: JSON.stringify({
          amount: Number(payment.amount || 0),
          description:
            payment.type === 'subscription'
              ? 'Assinatura Barbearia'
              : 'Agendamento Barbearia',
          paymentId: payment.id,
        }),
      }
    );

    const data = await response.json();

    if (!data.qr_code || !data.qr_code_base64) {
      throw new Error('Não foi possível gerar o PIX.');
    }

    setPixQrCode(data.qr_code);
    setPixQrCodeBase64(data.qr_code_base64);
  } catch (error) {
    Alert.alert(
      'Erro',
      error.message || 'Não foi possível gerar PIX.'
    );
    setPixModalVisible(false);
  } finally {
    setLoadingPix(false);
  }
};

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.muted,
            },
          ]}
        >
          <Ionicons
            name="wallet-outline"
            size={26}
            color={theme.primary}
          />

          <Text
            style={[
              styles.headerTitle,
              { color: theme.text },
            ]}
          >
            Meus pagamentos
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.text },
            ]}
          >
            Acompanhe pagamentos e assinaturas.
          </Text>
        </View>

        {loading && (
          <Text
            style={[
              styles.loadingText,
              { color: theme.text },
            ]}
          >
            Carregando pagamentos...
          </Text>
        )}

        {!loading && payments.length === 0 && (
          <Text
            style={[
              styles.emptyText,
              { color: theme.text },
            ]}
          >
            Nenhum pagamento encontrado.
          </Text>
        )}

        {payments.map((payment) => (

          <View
            key={payment.id}
            style={[
              styles.paymentCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.muted,
              },
            ]}
          >

            <View style={styles.paymentHeader}>

              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: `${theme.primary}18`,
                  },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={theme.primary}
                />
              </View>

              <View style={{ flex: 1 }}>

                <Text
                  style={[
                    styles.paymentTitle,
                    { color: theme.text },
                  ]}
                >
                  {payment.type === 'subscription'
                    ? 'Assinatura'
                    : 'Agendamento'}
                </Text>

                <Text
                  style={[
                    styles.paymentAmount,
                    { color: theme.primary },
                  ]}
                >
                  R$ {Number(payment.amount || 0).toFixed(2)}
                </Text>

              </View>

            </View>

            <View style={styles.paymentDetails}>

              <Text
                style={[
                  styles.detailText,
                  { color: theme.text },
                ]}
              >
                Método: {payment.method}
              </Text>

              <Text
                style={[
                  styles.detailText,
                  {
                    color:
                      payment.status === 'paid'
                        ? '#2ecc71'
                        : '#f39c12',
                  },
                ]}
              >
                Status: {payment.status}
              </Text>

            </View>

            {payment.status !== 'paid' && (

              <TouchableOpacity
                style={[
                  styles.payButton,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={() => openPixModal(payment)}
              >

                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color="#fff"
                />

                <Text style={styles.payButtonText}>
                  Pagar com PIX
                </Text>

              </TouchableOpacity>

            )}

          </View>

        ))}

      </ScrollView>
      <Modal
        visible={pixModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPixModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View
                style={[
                    styles.pixModalCard,
                    {
                    backgroundColor: theme.card,
                    borderColor: theme.muted,
                    },
                ]}
                >
                {pixQrCodeBase64 ? (
                  <Image
                    source={{
                      uri: `data:image/png;base64,${pixQrCodeBase64}`,
                    }}
                    style={styles.qrImage}
                  />
                ) : (
                  <Ionicons
                    name="qr-code-outline"
                    size={48}
                    color={theme.primary}
                  />
                )}

                <Text style={[styles.pixTitle, { color: theme.text }]}>
                    Pagamento via PIX
                </Text>

                <Text style={[styles.pixValue, { color: theme.primary }]}>
                    R$ {Number(selectedPayment?.amount || 0).toFixed(2)}
                </Text>

                <View
                    style={[
                    styles.pixBox,
                    {
                        backgroundColor: theme.background,
                        borderColor: theme.muted,
                    },
                    ]}
                >
                    <Text style={[styles.pixLabel, { color: theme.text }]}>
                    PIX copia e cola
                    </Text>

                    <Text style={[styles.pixKey, { color: theme.text }]}>
                    {loadingPix
                        ? 'Gerando PIX...'
                        : pixQrCode || 'PIX não gerado'}
                    </Text>
                </View>

                <Text style={[styles.pixInfo, { color: theme.text }]}>
                    Após realizar o pagamento, aguarde a confirmação da barbearia.
                </Text>

                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: theme.primary }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(pixQrCode);

                    Alert.alert(
                      'Copiado',
                      'Código PIX copiado com sucesso.'
                    );
                  }}
                >
                  <Ionicons name="copy-outline" size={18} color="#fff" />
                  <Text style={styles.payButtonText}>Copiar código PIX</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                    styles.closePixButton,
                    {
                        borderColor: theme.primary,
                    },
                    ]}
                    onPress={() => setPixModalVisible(false)}
                >
                    <Text style={[styles.closePixText, { color: theme.primary }]}>
                    Fechar
                    </Text>
                </TouchableOpacity>
                </View>
            </View>
            </Modal>

            </View>
        );
        }

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  headerCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },

  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
  },

  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },

  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },

  paymentCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },

  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },

  paymentDetails: {
    marginTop: 14,
    gap: 8,
  },

  detailText: {
    fontSize: 14,
    opacity: 0.8,
  },

  payButton: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.65)',
  justifyContent: 'center',
  padding: 18,
},

pixModalCard: {
  borderWidth: 1,
  borderRadius: 24,
  padding: 22,
  alignItems: 'center',
},

pixTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  marginTop: 14,
},

pixValue: {
  fontSize: 26,
  fontWeight: 'bold',
  marginTop: 8,
},

pixBox: {
  width: '100%',
  borderWidth: 1,
  borderRadius: 16,
  padding: 14,
  marginTop: 18,
},

pixLabel: {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 6,
},

pixKey: {
  fontSize: 14,
  fontWeight: '600',
},

pixInfo: {
  fontSize: 13,
  opacity: 0.75,
  textAlign: 'center',
  lineHeight: 19,
  marginTop: 16,
},

closePixButton: {
  width: '100%',
  marginTop: 12,
  borderWidth: 1,
  borderRadius: 14,
  paddingVertical: 13,
  alignItems: 'center',
},

closePixText: {
  fontWeight: 'bold',
  fontSize: 15,
},

qrImage: {
  width: 220,
  height: 220,
  borderRadius: 12,
  marginBottom: 10,
},
});