import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { formatDateCompact } from '../utils/date';
import { formatPrice } from '../utils/currency';

export default function RecordCard({ record, onPress, compact = false }) {
  const plateParts = parsePlate(record.plate);
  const paymentInfo = getPaymentInfo(record.paymentStatus);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.compactPlateBox}>
          <Text style={styles.compactPlateCity}>{plateParts.city}</Text>
          <Text style={styles.compactPlateLetters}>{plateParts.letters}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactPlate}>{record.plate}</Text>
          <Text style={styles.compactName}>{record.customerName}</Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactPrice}>{formatPrice(record.totalAmount)} TL</Text>
          <View style={[styles.paymentBadgeSmall, { backgroundColor: paymentInfo.bgColor }]}>
            <Text style={[styles.paymentBadgeSmallText, { color: paymentInfo.textColor }]}>
              {paymentInfo.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.cardHeader}>
        <View style={styles.plateBadge}>
          <Text style={styles.plateCity}>{plateParts.city}</Text>
          <Text style={styles.plateLetters}>{plateParts.letters}</Text>
          <Text style={styles.plateNumbers}>{plateParts.numbers}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.customerName}>{record.customerName}</Text>
          {(record.brand || record.model) ? (
            <Text style={styles.vehicleText}>
              {[record.brand, record.model, record.year].filter(Boolean).join(' ')}
            </Text>
          ) : null}
          <Text style={styles.dateText}>{formatDateCompact(record.date)}</Text>
        </View>
      </View>

      {/* Servis ozeti */}
      {record.services && record.services.length > 0 && (
        <View style={styles.servicesRow}>
          <Text style={styles.servicesCount}>{record.services.length} islem</Text>
          <Text style={styles.servicesList} numberOfLines={1}>
            {record.services.map((s) => s.name).join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(record.totalAmount)} TL</Text>
        <View style={[styles.paymentBadge, { backgroundColor: paymentInfo.bgColor }]}>
          <Text style={[styles.paymentBadgeText, { color: paymentInfo.textColor }]}>
            {paymentInfo.label}
          </Text>
        </View>
      </View>

      {record.paymentStatus === 'partial' && record.paidAmount > 0 && (
        <Text style={styles.partialInfo}>
          Tahsil edilen: {formatPrice(record.paidAmount)} TL  /  Kalan: {formatPrice(record.totalAmount - record.paidAmount)} TL
        </Text>
      )}

      {record.oilBrand ? (
        <View style={styles.oilTag}>
          <Text style={styles.oilText}>
            Yag: <Text style={styles.oilBold}>{record.oilBrand} {record.oilViscosity}</Text>
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function parsePlate(plate) {
  if (!plate) return { city: '', letters: '', numbers: '' };
  const parts = plate.trim().split(' ');
  if (parts.length >= 3) {
    return {
      city: parts[0],
      letters: parts.slice(1, parts.length - 1).join(' '),
      numbers: parts[parts.length - 1],
    };
  }
  return { city: '', letters: plate, numbers: '' };
}

function getPaymentInfo(status) {
  switch (status) {
    case 'paid':
      return { label: 'Tahsil Edildi', bgColor: '#DCFCE7', textColor: '#16A34A' };
    case 'partial':
      return { label: 'Kismi Tahsil', bgColor: '#FEF3C7', textColor: '#D97706' };
    case 'unpaid':
      return { label: 'Tahsil Edilecek', bgColor: '#FEE2E2', textColor: '#DC2626' };
    default:
      return { label: 'Belirsiz', bgColor: '#F3F4F6', textColor: '#6B7280' };
  }
}

const styles = StyleSheet.create({
  // Full card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.peach,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  plateBadge: {
    backgroundColor: COLORS.peach,
    borderRadius: 12,
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  plateCity: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.orange,
  },
  plateLetters: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginVertical: 1,
  },
  plateNumbers: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.orange,
  },
  headerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  servicesCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  servicesList: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  partialInfo: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 6,
  },
  oilTag: {
    backgroundColor: COLORS.oilTag,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  oilText: {
    fontSize: 14,
    color: COLORS.text,
  },
  oilBold: {
    fontWeight: '700',
  },

  // Compact card
  compactCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactPlateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPlateCity: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  compactPlateLetters: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  compactInfo: {
    flex: 1,
  },
  compactPlate: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  compactName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  compactPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.orange,
  },
  compactDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  paymentBadgeSmallText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
